import ast
from pathlib import Path


CONTRACT = Path(__file__).parents[2] / "contracts" / "incidentscope.py"
HEADER = '# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }'
def source() -> str:
    return CONTRACT.read_text(encoding="ascii")


def test_contract_exists_with_exact_header_and_ascii_source():
    assert CONTRACT.exists(), "contracts/incidentscope.py must exist"
    text = source()
    assert text.splitlines()[0] == HEADER
    assert text.encode("ascii").decode("ascii") == text


def test_contract_has_one_project_specific_gl_contract():
    tree = ast.parse(source())
    contract_classes = []
    for node in tree.body:
        if isinstance(node, ast.ClassDef):
            bases = {ast.unparse(base) for base in node.bases}
            if "gl.Contract" in bases:
                contract_classes.append(node.name)

    assert contract_classes == ["IncidentScopeContract"]


def test_contract_uses_verified_import_family_and_no_collection_reassignment():
    text = source()
    assert "from genlayer import *" in text
    assert "self.pools = TreeMap" not in text
    assert "self.profiles = TreeMap" not in text


def test_review_prompt_requires_the_exact_profile_set_and_schema():
    text = source()
    assert '"EXPECTED_PROFILE_IDS="' in text
    assert '"Every verdict object must have exactly the keys class and profile_id.\\n"' in text
    assert '"Copy every EXPECTED_PROFILE_ID verbatim exactly once; no missing, duplicate, or extra IDs.\\n"' in text

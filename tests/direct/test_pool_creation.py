from __future__ import annotations

import json
from pathlib import Path

from tests.direct.conftest import GEN, address_hex, set_time


CONTRACT_PATH = Path(__file__).resolve().parents[2] / "contracts" / "incidentscope.py"
NOW = 1_000_000
ACCEPTANCE = NOW + 86_400
REVIEW = ACCEPTANCE + 86_400
INCIDENT_URL = "https://status.openai.com/incidents/01KZSC0T66YTVM57N5T79SV8ZV"
POLICY_ID = "OPENAI_STATUS_V1"


def deploy(direct_vm, direct_deploy):
    set_time(direct_vm, NOW)
    return direct_deploy(CONTRACT_PATH)


def create_pool(contract, direct_vm, sponsor, reserve: int = GEN) -> None:
    direct_vm.sender = sponsor
    direct_vm.value = reserve
    contract.create_pool("Agent API credit pool", INCIDENT_URL, POLICY_ID, ACCEPTANCE, REVIEW)
    direct_vm.value = 0


def test_create_pool_accepts_only_one_or_two_gen(direct_vm, direct_deploy, direct_alice):
    contract = deploy(direct_vm, direct_deploy)
    direct_vm.sender = direct_alice

    for value in (0, GEN - 1, 3 * GEN):
        direct_vm.value = value
        with direct_vm.expect_revert("requires exactly 1 or 2 GEN"):
            contract.create_pool("Agent API credit pool", INCIDENT_URL, POLICY_ID, ACCEPTANCE, REVIEW)

    direct_vm.value = GEN
    contract.create_pool("Agent API credit pool", INCIDENT_URL, POLICY_ID, ACCEPTANCE, REVIEW)
    direct_vm.value = 2 * GEN
    contract.create_pool("Second API credit pool", INCIDENT_URL, POLICY_ID, ACCEPTANCE, REVIEW)
    assert contract.get_pool_count() == 2


def test_create_pool_records_isolated_reserve_and_account_history(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = deploy(direct_vm, direct_deploy)
    create_pool(contract, direct_vm, direct_alice, 2 * GEN)

    pool = json.loads(contract.get_pool("pool-1"))
    accounting = json.loads(contract.get_pool_accounting("pool-1"))
    alice_pools = json.loads(contract.get_account_pool_ids(direct_alice))
    bob_pools = json.loads(contract.get_account_pool_ids(direct_bob))

    assert pool["pool_id"] == "pool-1"
    assert pool["sponsor"] == address_hex(direct_alice)
    assert pool["phase"] == "ENROLLING"
    assert pool["source_policy_id"] == POLICY_ID
    assert pool["reserve_gen"] == "2"
    assert pool["accepted_count"] == 0
    assert pool["pending_count"] == 0
    assert accounting == {
        "invariant_holds": True,
        "participant_outstanding_gen": "0",
        "participant_withdrawn_gen": "0",
        "reserve_total_gen": "2",
        "sponsor_recoverable_gen": "2",
        "sponsor_withdrawn_gen": "0",
    }
    assert alice_pools == ["pool-1"]
    assert bob_pools == []


def test_create_pool_rejects_malformed_terms_without_state_change(direct_vm, direct_deploy, direct_alice):
    contract = deploy(direct_vm, direct_deploy)
    direct_vm.sender = direct_alice
    direct_vm.value = GEN

    invalid_calls = [
        ("No", INCIDENT_URL, POLICY_ID, ACCEPTANCE, REVIEW, "title"),
        ("Agent API credit pool", "https://example.com/incidents/01KZSC0T66YTVM57N5T79SV8ZV", POLICY_ID, ACCEPTANCE, REVIEW, "incident URL"),
        ("Agent API credit pool", INCIDENT_URL, "CALLER_POLICY", ACCEPTANCE, REVIEW, "source policy"),
        ("Agent API credit pool", INCIDENT_URL, POLICY_ID, NOW, REVIEW, "acceptance deadline"),
        ("Agent API credit pool", INCIDENT_URL, POLICY_ID, NOW + 7 * 86_400 + 1, REVIEW, "acceptance deadline"),
        ("Agent API credit pool", INCIDENT_URL, POLICY_ID, ACCEPTANCE, ACCEPTANCE, "review expiry"),
        ("Agent API credit pool", INCIDENT_URL, POLICY_ID, ACCEPTANCE, ACCEPTANCE + 7 * 86_400 + 1, "review expiry"),
    ]
    for title, url, policy, acceptance, review, message in invalid_calls:
        with direct_vm.expect_revert(message):
            contract.create_pool(title, url, policy, acceptance, review)

    assert contract.get_pool_count() == 0

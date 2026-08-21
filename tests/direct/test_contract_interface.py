from __future__ import annotations

import ast
import json

from tests.direct.conftest import GEN
from tests.direct.test_enrollment import deploy_pool, invite


EXPECTED_WRITES = {
    "accept_dependency",
    "cancel_pool",
    "create_pool",
    "invite_dependency",
    "lock_enrollment",
    "recover_reserve",
    "request_review",
    "retry_review",
    "withdraw_credit",
}
EXPECTED_VIEWS = {
    "get_account_pool_ids",
    "get_account_profile",
    "get_available_actions",
    "get_contract_metadata",
    "get_current_attempt",
    "get_pool",
    "get_pool_accounting",
    "get_pool_count",
    "get_pool_profile_ids",
    "get_profile",
    "get_withdrawable_credit",
}


def public_methods(source: str):
    tree = ast.parse(source)
    contract = next(node for node in tree.body if isinstance(node, ast.ClassDef) and node.name == "IncidentScopeContract")
    writes = set()
    views = set()
    payable = set()
    for node in contract.body:
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        decorators = {ast.unparse(item) for item in node.decorator_list}
        if "gl.public.view" in decorators:
            views.add(node.name)
        if "gl.public.write" in decorators or "gl.public.write.payable" in decorators:
            writes.add(node.name)
        if "gl.public.write.payable" in decorators:
            payable.add(node.name)
    return writes, views, payable


def test_public_interface_and_payable_metadata_are_exact():
    from tests.direct.test_contract_static import source

    writes, views, payable = public_methods(source())
    assert writes == EXPECTED_WRITES
    assert views == EXPECTED_VIEWS
    assert payable == {"create_pool"}


def test_metadata_exposes_versioned_policy_without_private_configuration(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/incidentscope.py")
    metadata = json.loads(contract.get_contract_metadata())
    assert metadata == {
        "api_version": "incidentscope.contract.v1.2",
        "contract_name": "IncidentScopeContract",
        "max_profiles": 8,
        "review_schema": "incidentscope.review.v1",
        "source_feed_url": "https://status.openai.com/api/v2/incidents.json",
        "source_policy_hash": "88910f256e8888c21257f88a5ef0c58fd8b118a5648e4a60e2bb56365123851f",
        "source_policy_id": "OPENAI_STATUS_V1",
    }


def test_available_actions_are_derived_from_role_and_canonical_state(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = deploy_pool(direct_vm, direct_deploy, direct_alice, GEN)
    sponsor_actions = json.loads(contract.get_available_actions("pool-1", direct_alice))
    stranger_actions = json.loads(contract.get_available_actions("pool-1", direct_bob))
    assert sponsor_actions["invite"] is True
    assert sponsor_actions["cancel"] is True
    assert stranger_actions["invite"] is False
    assert stranger_actions["accept"] is False

    invite(contract, direct_vm, direct_alice, direct_bob)
    integrator_actions = json.loads(contract.get_available_actions("pool-1", direct_bob))
    assert integrator_actions["accept"] is True
    assert integrator_actions["withdraw"] is False


def test_profile_limit_is_eight_and_ninth_invitation_is_rejected(direct_vm, direct_deploy, direct_alice):
    contract = deploy_pool(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender = direct_alice
    accounts = [bytes([index]) * 20 for index in range(1, 10)]
    for index, account in enumerate(accounts[:8]):
        contract.invite_dependency(
            "pool-1",
            account,
            f"capability-{index + 1}",
            "A bounded production capability profile for this exact integrator.",
        )
    with direct_vm.expect_revert("profile limit"):
        contract.invite_dependency(
            "pool-1",
            accounts[8],
            "capability-9",
            "A bounded production capability profile for the ninth integrator.",
        )
    assert json.loads(contract.get_pool("pool-1"))["pending_count"] == 8

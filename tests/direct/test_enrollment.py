from __future__ import annotations

import json
from pathlib import Path

from tests.direct.conftest import GEN, address_hex, set_time
from tests.direct.test_pool_creation import ACCEPTANCE, INCIDENT_URL, NOW, POLICY_ID, REVIEW


CONTRACT_PATH = Path(__file__).resolve().parents[2] / "contracts" / "incidentscope.py"


def deploy_pool(direct_vm, direct_deploy, sponsor, reserve: int = GEN):
    set_time(direct_vm, NOW)
    contract = direct_deploy(CONTRACT_PATH)
    direct_vm.sender = sponsor
    direct_vm.value = reserve
    contract.create_pool("Agent API credit pool", INCIDENT_URL, POLICY_ID, ACCEPTANCE, REVIEW)
    direct_vm.value = 0
    return contract


def invite(contract, direct_vm, sponsor, integrator, capability: str = "responses.api"):
    direct_vm.sender = sponsor
    contract.invite_dependency(
        "pool-1",
        integrator,
        capability,
        "Uses the Responses API for production agent orchestration.",
    )


def test_sponsor_invites_and_named_integrator_accepts_immutable_profile(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = deploy_pool(direct_vm, direct_deploy, direct_alice)
    invite(contract, direct_vm, direct_alice, direct_bob)

    pool_before = json.loads(contract.get_pool("pool-1"))
    profile_before = json.loads(contract.get_profile("profile-1"))
    assert pool_before["pending_count"] == 1
    assert pool_before["accepted_count"] == 0
    assert profile_before["integrator"] == address_hex(direct_bob)
    assert profile_before["capability_id"] == "responses.api"
    assert profile_before["accepted"] is False

    direct_vm.sender = direct_bob
    contract.accept_dependency("pool-1")

    pool_after = json.loads(contract.get_pool("pool-1"))
    profile_after = json.loads(contract.get_profile("profile-1"))
    own_profile = json.loads(contract.get_account_profile("pool-1", direct_bob))
    assert pool_after["pending_count"] == 0
    assert pool_after["accepted_count"] == 1
    assert profile_after["accepted"] is True
    assert profile_after["capability_profile"] == profile_before["capability_profile"]
    assert own_profile["profile_id"] == "profile-1"
    assert json.loads(contract.get_account_pool_ids(direct_bob)) == ["pool-1"]


def test_invitation_rejects_wrong_caller_duplicate_bad_profile_and_unexpected_value(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = deploy_pool(direct_vm, direct_deploy, direct_alice)

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("only sponsor"):
        contract.invite_dependency("pool-1", direct_bob, "responses.api", "Valid capability profile with enough detail.")

    direct_vm.sender = direct_alice
    direct_vm.value = GEN
    with direct_vm.expect_revert("does not accept GEN"):
        contract.invite_dependency("pool-1", direct_bob, "responses.api", "Valid capability profile with enough detail.")
    direct_vm.value = 0

    invalid = [
        (direct_alice, "responses.api", "Valid capability profile with enough detail.", "sponsor cannot"),
        (direct_bob, "UPPER CASE", "Valid capability profile with enough detail.", "capability ID"),
        (direct_bob, "responses.api", "too short", "capability profile"),
    ]
    for account, capability, profile, message in invalid:
        with direct_vm.expect_revert(message):
            contract.invite_dependency("pool-1", account, capability, profile)

    invite(contract, direct_vm, direct_alice, direct_bob)
    with direct_vm.expect_revert("duplicate invitation"):
        contract.invite_dependency("pool-1", direct_bob, "another.api", "Another detailed capability profile for the same account.")

    pool = json.loads(contract.get_pool("pool-1"))
    accounting = json.loads(contract.get_pool_accounting("pool-1"))
    assert pool["pending_count"] == 1
    assert accounting["reserve_total_gen"] == "1"
    assert accounting["sponsor_recoverable_gen"] == "1"


def test_acceptance_requires_exact_account_and_open_window(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = deploy_pool(direct_vm, direct_deploy, direct_alice)
    invite(contract, direct_vm, direct_alice, direct_bob)

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("no invitation"):
        contract.accept_dependency("pool-1")

    direct_vm.sender = direct_bob
    set_time(direct_vm, ACCEPTANCE)
    with direct_vm.expect_revert("acceptance deadline"):
        contract.accept_dependency("pool-1")
    set_time(direct_vm, ACCEPTANCE - 1)
    contract.accept_dependency("pool-1")
    with direct_vm.expect_revert("already accepted"):
        contract.accept_dependency("pool-1")


def test_lock_requires_accepted_profile_and_early_lock_has_no_pending_invites(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = deploy_pool(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("accepted profile"):
        contract.lock_enrollment("pool-1")

    invite(contract, direct_vm, direct_alice, direct_bob)
    invite(contract, direct_vm, direct_alice, direct_charlie, "assistants.api")
    direct_vm.sender = direct_bob
    contract.accept_dependency("pool-1")

    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("pending invitations"):
        contract.lock_enrollment("pool-1")

    set_time(direct_vm, ACCEPTANCE)
    contract.lock_enrollment("pool-1")
    pool = json.loads(contract.get_pool("pool-1"))
    assert pool["phase"] == "LOCKED"
    assert pool["pending_count"] == 0
    assert json.loads(contract.get_pool_profile_ids("pool-1")) == ["profile-1", "profile-2"]

    with direct_vm.expect_revert("pool is not enrolling"):
        contract.lock_enrollment("pool-1")


def test_early_lock_succeeds_when_every_invitation_is_accepted(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = deploy_pool(direct_vm, direct_deploy, direct_alice)
    invite(contract, direct_vm, direct_alice, direct_bob)
    direct_vm.sender = direct_bob
    contract.accept_dependency("pool-1")
    direct_vm.sender = direct_alice
    set_time(direct_vm, ACCEPTANCE - 1)
    contract.lock_enrollment("pool-1")
    assert json.loads(contract.get_pool("pool-1"))["phase"] == "LOCKED"

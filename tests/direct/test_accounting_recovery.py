from __future__ import annotations

import json

from tests.direct.conftest import GEN, set_time
from tests.direct.test_pool_creation import ACCEPTANCE, REVIEW
from tests.direct.test_review import deploy_locked, install_review_mocks


def settle(contract, direct_vm, sponsor, verdicts):
    install_review_mocks(direct_vm, verdicts)
    direct_vm.sender = sponsor
    set_time(direct_vm, ACCEPTANCE + 10)
    contract.request_review("pool-1")
    return json.loads(contract.get_pool("pool-1"))


def test_impacted_integrator_withdraws_once_before_deadline(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = deploy_locked(direct_vm, direct_deploy, direct_alice, [direct_bob], 2 * GEN)
    pool = settle(contract, direct_vm, direct_alice, [{"profile_id": "profile-1", "class": "IMPACTED"}])

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("no credit"):
        contract.withdraw_credit("pool-1")

    direct_vm.sender = direct_bob
    set_time(direct_vm, int(pool["claim_deadline"]) - 1)
    contract.withdraw_credit("pool-1")
    profile = json.loads(contract.get_profile("profile-1"))
    accounting = json.loads(contract.get_pool_accounting("pool-1"))
    assert profile["withdrawn"] is True
    assert profile["credit_gen"] == "0"
    assert accounting["participant_outstanding_gen"] == "0"
    assert accounting["participant_withdrawn_gen"] == "2"
    assert accounting["invariant_holds"] is True

    with direct_vm.expect_revert("already withdrawn"):
        contract.withdraw_credit("pool-1")


def test_withdrawal_deadline_is_entrypoint_local_and_rejection_keeps_ledger(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = deploy_locked(direct_vm, direct_deploy, direct_alice, [direct_bob])
    pool = settle(contract, direct_vm, direct_alice, [{"profile_id": "profile-1", "class": "IMPACTED"}])
    before = contract.get_pool_accounting("pool-1")

    direct_vm.sender = direct_bob
    set_time(direct_vm, int(pool["claim_deadline"]))
    with direct_vm.expect_revert("claim deadline"):
        contract.withdraw_credit("pool-1")
    assert contract.get_pool_accounting("pool-1") == before
    assert json.loads(contract.get_profile("profile-1"))["withdrawn"] is False


def test_sponsor_cannot_take_live_credit_but_can_close_after_withdrawal(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = deploy_locked(direct_vm, direct_deploy, direct_alice, [direct_bob])
    settle(contract, direct_vm, direct_alice, [{"profile_id": "profile-1", "class": "IMPACTED"}])

    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("live participant credit"):
        contract.recover_reserve("pool-1")

    direct_vm.sender = direct_bob
    contract.withdraw_credit("pool-1")
    direct_vm.sender = direct_alice
    contract.recover_reserve("pool-1")
    assert json.loads(contract.get_pool("pool-1"))["phase"] == "CLOSED"
    with direct_vm.expect_revert("pool is not decided"):
        contract.recover_reserve("pool-1")


def test_claim_expiry_returns_unwithdrawn_credit_to_sponsor(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = deploy_locked(direct_vm, direct_deploy, direct_alice, [direct_bob], 2 * GEN)
    pool = settle(contract, direct_vm, direct_alice, [{"profile_id": "profile-1", "class": "IMPACTED"}])

    direct_vm.sender = direct_alice
    set_time(direct_vm, int(pool["claim_deadline"]))
    contract.recover_reserve("pool-1")
    closed = json.loads(contract.get_pool("pool-1"))
    profile = json.loads(contract.get_profile("profile-1"))
    accounting = json.loads(contract.get_pool_accounting("pool-1"))
    assert closed["phase"] == "CLOSED"
    assert closed["terminal_reason"] == "CLAIM_EXPIRED"
    assert profile["credit_gen"] == "0"
    assert profile["withdrawn"] is False
    assert accounting["participant_outstanding_gen"] == "0"
    assert accounting["sponsor_withdrawn_gen"] == "2"
    assert accounting["invariant_holds"] is True


def test_zero_impact_reserve_is_sponsor_recoverable_and_closes(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = deploy_locked(direct_vm, direct_deploy, direct_alice, [direct_bob])
    settle(contract, direct_vm, direct_alice, [{"profile_id": "profile-1", "class": "AMBIGUOUS"}])
    direct_vm.sender = direct_alice
    contract.recover_reserve("pool-1")
    accounting = json.loads(contract.get_pool_accounting("pool-1"))
    assert json.loads(contract.get_pool("pool-1"))["phase"] == "CLOSED"
    assert accounting["sponsor_recoverable_gen"] == "0"
    assert accounting["sponsor_withdrawn_gen"] == "1"


def test_cancel_is_authorized_safe_and_idempotent(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = deploy_locked(direct_vm, direct_deploy, direct_alice, [direct_bob], 2 * GEN)

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("only sponsor"):
        contract.cancel_pool("pool-1")

    direct_vm.sender = direct_alice
    set_time(direct_vm, REVIEW - 1)
    with direct_vm.expect_revert("accepted participant interest"):
        contract.cancel_pool("pool-1")
    set_time(direct_vm, REVIEW)
    contract.cancel_pool("pool-1")
    pool = json.loads(contract.get_pool("pool-1"))
    accounting = json.loads(contract.get_pool_accounting("pool-1"))
    assert pool["phase"] == "CANCELLED"
    assert accounting["sponsor_withdrawn_gen"] == "2"
    assert accounting["sponsor_recoverable_gen"] == "0"
    with direct_vm.expect_revert("pool cannot be cancelled"):
        contract.cancel_pool("pool-1")


def test_three_way_split_has_deterministic_sponsor_remainder(direct_vm, direct_deploy, direct_alice):
    integrators = [bytes([index]) * 20 for index in (21, 22, 23)]
    contract = deploy_locked(direct_vm, direct_deploy, direct_alice, integrators, GEN)
    settle(
        contract,
        direct_vm,
        direct_alice,
        [
            {"profile_id": "profile-1", "class": "IMPACTED"},
            {"profile_id": "profile-2", "class": "IMPACTED"},
            {"profile_id": "profile-3", "class": "IMPACTED"},
        ],
    )
    accounting = json.loads(contract.get_pool_accounting("pool-1"))
    assert accounting["participant_outstanding_gen"] == "0.999999999999999999"
    assert accounting["sponsor_recoverable_gen"] == "0.000000000000000001"
    assert accounting["invariant_holds"] is True


def test_enrolling_pool_with_zero_acceptance_can_cancel_immediately(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    from tests.direct.test_enrollment import deploy_pool, invite

    contract = deploy_pool(direct_vm, direct_deploy, direct_alice, GEN)
    invite(contract, direct_vm, direct_alice, direct_bob)
    direct_vm.sender = direct_alice
    contract.cancel_pool("pool-1")
    assert json.loads(contract.get_pool("pool-1"))["phase"] == "CANCELLED"
    assert json.loads(contract.get_pool_accounting("pool-1"))["sponsor_withdrawn_gen"] == "1"

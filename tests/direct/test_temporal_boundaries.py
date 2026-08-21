from __future__ import annotations

import json

import pytest

from tests.direct.conftest import GEN, set_time
from tests.direct.test_enrollment import deploy_pool, invite
from tests.direct.test_pool_creation import ACCEPTANCE, INCIDENT_URL, NOW, POLICY_ID, REVIEW
from tests.direct.test_review import deploy_locked, install_review_mocks


@pytest.mark.parametrize("offset,accepted", [(-1, True), (0, False), (1, False)])
def test_invite_boundary_with_stale_enrolling_phase(
    direct_vm, direct_deploy, direct_alice, direct_bob, offset, accepted
):
    contract = deploy_pool(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender = direct_alice
    set_time(direct_vm, ACCEPTANCE + offset)
    if accepted:
        contract.invite_dependency(
            "pool-1", direct_bob, "responses.api", "A production Responses API dependency profile."
        )
        assert json.loads(contract.get_pool("pool-1"))["pending_count"] == 1
    else:
        before = contract.get_pool_accounting("pool-1")
        with direct_vm.expect_revert("acceptance deadline"):
            contract.invite_dependency(
                "pool-1", direct_bob, "responses.api", "A production Responses API dependency profile."
            )
        assert contract.get_pool_accounting("pool-1") == before


@pytest.mark.parametrize("offset,accepted", [(-1, True), (0, False), (1, False)])
def test_accept_boundary_with_stale_enrolling_phase(
    direct_vm, direct_deploy, direct_alice, direct_bob, offset, accepted
):
    contract = deploy_pool(direct_vm, direct_deploy, direct_alice)
    invite(contract, direct_vm, direct_alice, direct_bob)
    direct_vm.sender = direct_bob
    set_time(direct_vm, ACCEPTANCE + offset)
    if accepted:
        contract.accept_dependency("pool-1")
        assert json.loads(contract.get_pool("pool-1"))["accepted_count"] == 1
    else:
        before = contract.get_pool("pool-1")
        with direct_vm.expect_revert("acceptance deadline"):
            contract.accept_dependency("pool-1")
        assert contract.get_pool("pool-1") == before


@pytest.mark.parametrize("offset,locks", [(-1, False), (0, True), (1, True)])
def test_lock_boundary_with_pending_invitation_and_stale_enrolling_phase(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, offset, locks
):
    contract = deploy_pool(direct_vm, direct_deploy, direct_alice)
    invite(contract, direct_vm, direct_alice, direct_bob)
    invite(contract, direct_vm, direct_alice, direct_charlie, "assistants.api")
    direct_vm.sender = direct_bob
    contract.accept_dependency("pool-1")
    direct_vm.sender = direct_alice
    set_time(direct_vm, ACCEPTANCE + offset)
    if locks:
        contract.lock_enrollment("pool-1")
        assert json.loads(contract.get_pool("pool-1"))["phase"] == "LOCKED"
    else:
        before = contract.get_pool("pool-1")
        with direct_vm.expect_revert("pending invitations"):
            contract.lock_enrollment("pool-1")
        assert contract.get_pool("pool-1") == before


@pytest.mark.parametrize("offset,reviewed", [(-1, True), (0, False), (1, False)])
def test_request_review_boundary_with_stale_locked_phase(
    direct_vm, direct_deploy, direct_alice, direct_bob, offset, reviewed
):
    contract = deploy_locked(direct_vm, direct_deploy, direct_alice, [direct_bob])
    install_review_mocks(direct_vm, [{"profile_id": "profile-1", "class": "AMBIGUOUS"}])
    direct_vm.sender = direct_alice
    set_time(direct_vm, REVIEW + offset)
    if reviewed:
        contract.request_review("pool-1")
        assert json.loads(contract.get_pool("pool-1"))["phase"] == "DECIDED"
    else:
        before = contract.get_pool_accounting("pool-1")
        with direct_vm.expect_revert("review expiry"):
            contract.request_review("pool-1")
        assert contract.get_pool_accounting("pool-1") == before
        assert json.loads(contract.get_pool("pool-1"))["phase"] == "LOCKED"


@pytest.mark.parametrize("offset,retried", [(-1, True), (0, False), (1, False)])
def test_retry_review_boundary_with_stale_retryable_phase(
    direct_vm, direct_deploy, direct_alice, direct_bob, offset, retried
):
    contract = deploy_locked(direct_vm, direct_deploy, direct_alice, [direct_bob])
    install_review_mocks(direct_vm, [], body="", status=503)
    direct_vm.sender = direct_alice
    contract.request_review("pool-1")
    assert json.loads(contract.get_pool("pool-1"))["phase"] == "RETRYABLE"
    direct_vm.clear_mocks()
    install_review_mocks(direct_vm, [{"profile_id": "profile-1", "class": "NOT_IMPACTED"}])
    set_time(direct_vm, REVIEW + offset)
    if retried:
        contract.retry_review("pool-1")
        assert json.loads(contract.get_pool("pool-1"))["phase"] == "DECIDED"
    else:
        before = contract.get_pool_accounting("pool-1")
        with direct_vm.expect_revert("review expiry"):
            contract.retry_review("pool-1")
        assert contract.get_pool_accounting("pool-1") == before
        assert json.loads(contract.get_pool("pool-1"))["phase"] == "RETRYABLE"


@pytest.mark.parametrize("offset,withdrawn", [(-1, True), (0, False), (1, False)])
def test_withdraw_boundary_with_stale_decided_phase(
    direct_vm, direct_deploy, direct_alice, direct_bob, offset, withdrawn
):
    contract = deploy_locked(direct_vm, direct_deploy, direct_alice, [direct_bob])
    install_review_mocks(direct_vm, [{"profile_id": "profile-1", "class": "IMPACTED"}])
    direct_vm.sender = direct_alice
    contract.request_review("pool-1")
    pool = json.loads(contract.get_pool("pool-1"))
    direct_vm.sender = direct_bob
    set_time(direct_vm, int(pool["claim_deadline"]) + offset)
    if withdrawn:
        contract.withdraw_credit("pool-1")
        assert json.loads(contract.get_profile("profile-1"))["withdrawn"] is True
    else:
        before = contract.get_pool_accounting("pool-1")
        with direct_vm.expect_revert("claim deadline"):
            contract.withdraw_credit("pool-1")
        assert contract.get_pool_accounting("pool-1") == before
        assert json.loads(contract.get_pool("pool-1"))["phase"] == "DECIDED"


@pytest.mark.parametrize("offset,recovered", [(-1, False), (0, True), (1, True)])
def test_recover_boundary_with_live_credit_and_stale_decided_phase(
    direct_vm, direct_deploy, direct_alice, direct_bob, offset, recovered
):
    contract = deploy_locked(direct_vm, direct_deploy, direct_alice, [direct_bob])
    install_review_mocks(direct_vm, [{"profile_id": "profile-1", "class": "IMPACTED"}])
    direct_vm.sender = direct_alice
    contract.request_review("pool-1")
    pool = json.loads(contract.get_pool("pool-1"))
    set_time(direct_vm, int(pool["claim_deadline"]) + offset)
    if recovered:
        contract.recover_reserve("pool-1")
        assert json.loads(contract.get_pool("pool-1"))["phase"] == "CLOSED"
    else:
        before = contract.get_pool_accounting("pool-1")
        with direct_vm.expect_revert("live participant credit"):
            contract.recover_reserve("pool-1")
        assert contract.get_pool_accounting("pool-1") == before


@pytest.mark.parametrize("offset,cancelled", [(-1, False), (0, True), (1, True)])
def test_cancel_boundary_with_accepted_interest_and_stale_locked_phase(
    direct_vm, direct_deploy, direct_alice, direct_bob, offset, cancelled
):
    contract = deploy_locked(direct_vm, direct_deploy, direct_alice, [direct_bob])
    direct_vm.sender = direct_alice
    set_time(direct_vm, REVIEW + offset)
    if cancelled:
        contract.cancel_pool("pool-1")
        assert json.loads(contract.get_pool("pool-1"))["phase"] == "CANCELLED"
    else:
        before = contract.get_pool_accounting("pool-1")
        with direct_vm.expect_revert("accepted participant interest"):
            contract.cancel_pool("pool-1")
        assert contract.get_pool_accounting("pool-1") == before


def test_create_deadline_boundaries_are_transaction_time_local(direct_vm, direct_deploy, direct_alice):
    set_time(direct_vm, NOW)
    contract = direct_deploy("contracts/incidentscope.py")
    direct_vm.sender = direct_alice
    direct_vm.value = GEN
    for acceptance in (NOW - 1, NOW):
        with direct_vm.expect_revert("acceptance deadline"):
            contract.create_pool("Agent API pool", INCIDENT_URL, POLICY_ID, acceptance, NOW + 100)
    contract.create_pool("Agent API pool", INCIDENT_URL, POLICY_ID, NOW + 1, NOW + 2)
    with direct_vm.expect_revert("review expiry"):
        contract.create_pool("Agent API pool", INCIDENT_URL, POLICY_ID, NOW + 2, NOW + 2)
    assert contract.get_pool_count() == 1

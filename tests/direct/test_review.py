from __future__ import annotations

import hashlib
import json
from pathlib import Path

from tests.direct.conftest import GEN, set_time
from tests.direct.test_enrollment import deploy_pool, invite
from tests.direct.test_pool_creation import ACCEPTANCE, REVIEW


CONTRACT_PATH = Path(__file__).resolve().parents[2] / "contracts" / "incidentscope.py"
INCIDENT_ID = "01KZSC0T66YTVM57N5T79SV8ZV"
FEED_URL_PATTERN = r"https://status\.openai\.com/api/v2/incidents\.json"


def feed_body() -> str:
    return json.dumps(
        {
            "incidents": [
                {
                    "id": INCIDENT_ID,
                    "name": "Elevated errors for the Responses API",
                    "status": "resolved",
                    "created_at": "1970-01-12T13:46:00Z",
                    "updated_at": "1970-01-12T13:50:00Z",
                    "components": [{"id": "responses", "name": "Responses API"}],
                    "incident_updates": [
                        {
                            "id": "update-1",
                            "status": "investigating",
                            "body": "We are investigating elevated errors for Responses API requests.",
                            "created_at": "1970-01-12T13:46:00Z",
                            "updated_at": "1970-01-12T13:46:00Z",
                        },
                        {
                            "id": "update-2",
                            "status": "resolved",
                            "body": "The Responses API has recovered.",
                            "created_at": "1970-01-12T13:50:00Z",
                            "updated_at": "1970-01-12T13:50:00Z",
                        },
                    ],
                }
            ]
        },
        separators=(",", ":"),
        sort_keys=True,
    )


def install_review_mocks(direct_vm, verdicts, *, body: str | None = None, status: int = 200, extra=None):
    direct_vm.mock_web(
        FEED_URL_PATTERN,
        {"method": "GET", "status": status, "body": feed_body() if body is None else body},
    )
    result = {"verdicts": verdicts, "root_cause_profile_ids": []}
    if extra:
        result.update(extra)
    direct_vm.mock_llm(r"(?s).*IncidentScope official incident review.*", json.dumps(result))


def deploy_locked(direct_vm, direct_deploy, sponsor, integrators, reserve: int = GEN):
    contract = deploy_pool(direct_vm, direct_deploy, sponsor, reserve)
    for index, integrator in enumerate(integrators):
        invite(contract, direct_vm, sponsor, integrator, f"capability-{index + 1}")
        direct_vm.sender = integrator
        contract.accept_dependency("pool-1")
    direct_vm.sender = sponsor
    contract.lock_enrollment("pool-1")
    return contract


def test_verified_review_settles_exact_profile_set_and_derives_credit(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = deploy_locked(direct_vm, direct_deploy, direct_alice, [direct_bob, direct_charlie], 2 * GEN)
    install_review_mocks(
        direct_vm,
        [
            {"profile_id": "profile-1", "class": "IMPACTED"},
            {"profile_id": "profile-2", "class": "NOT_IMPACTED"},
        ],
    )
    direct_vm.sender = direct_alice
    set_time(direct_vm, ACCEPTANCE + 10)
    contract.request_review("pool-1")

    pool = json.loads(contract.get_pool("pool-1"))
    impacted = json.loads(contract.get_profile("profile-1"))
    not_impacted = json.loads(contract.get_profile("profile-2"))
    attempt = json.loads(contract.get_current_attempt("pool-1"))
    accounting = json.loads(contract.get_pool_accounting("pool-1"))

    assert pool["phase"] == "DECIDED"
    assert impacted["classification"] == "IMPACTED"
    assert impacted["credit_gen"] == "2"
    assert not_impacted["classification"] == "NOT_IMPACTED"
    assert not_impacted["credit_gen"] == "0"
    assert attempt["status"] == "VERIFIED"
    assert attempt["source_digest"] == hashlib.sha256(feed_body().encode("utf-8")).hexdigest()
    assert accounting["participant_outstanding_gen"] == "2"
    assert accounting["sponsor_recoverable_gen"] == "0"
    assert accounting["invariant_holds"] is True


def test_official_newest_first_update_order_is_verified(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    document = json.loads(feed_body())
    document["incidents"][0]["incident_updates"].reverse()
    contract = deploy_locked(direct_vm, direct_deploy, direct_alice, [direct_bob])
    install_review_mocks(
        direct_vm,
        [{"profile_id": "profile-1", "class": "IMPACTED"}],
        body=json.dumps(document, separators=(",", ":"), sort_keys=True),
    )
    direct_vm.sender = direct_alice
    contract.request_review("pool-1")

    assert json.loads(contract.get_pool("pool-1"))["phase"] == "DECIDED"
    assert json.loads(contract.get_current_attempt("pool-1"))["status"] == "VERIFIED"


def test_unavailable_source_is_retryable_and_retry_uses_fresh_attempt(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = deploy_locked(direct_vm, direct_deploy, direct_alice, [direct_bob])
    install_review_mocks(direct_vm, [], body="", status=503)
    direct_vm.sender = direct_alice
    set_time(direct_vm, ACCEPTANCE + 10)
    contract.request_review("pool-1")

    assert json.loads(contract.get_pool("pool-1"))["phase"] == "RETRYABLE"
    first = json.loads(contract.get_current_attempt("pool-1"))
    assert first["attempt_id"] == 1
    assert first["status"] == "RETRYABLE"
    assert json.loads(contract.get_pool_accounting("pool-1"))["sponsor_recoverable_gen"] == "1"

    direct_vm.clear_mocks()
    install_review_mocks(
        direct_vm,
        [{"profile_id": "profile-1", "class": "AMBIGUOUS"}],
    )
    contract.retry_review("pool-1")
    second = json.loads(contract.get_current_attempt("pool-1"))
    assert second["attempt_id"] == 2
    assert second["status"] == "VERIFIED"
    assert json.loads(contract.get_pool("pool-1"))["phase"] == "DECIDED"
    assert json.loads(contract.get_pool_accounting("pool-1"))["sponsor_recoverable_gen"] == "1"


def test_invalid_settlement_meaning_stays_retryable_without_credit(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = deploy_locked(direct_vm, direct_deploy, direct_alice, [direct_bob])
    install_review_mocks(
        direct_vm,
        [
            {"profile_id": "profile-1", "class": "IMPACTED"},
            {"profile_id": "profile-extra", "class": "IMPACTED"},
        ],
        extra={"payout_gen": "999"},
    )
    direct_vm.sender = direct_alice
    contract.request_review("pool-1")

    assert json.loads(contract.get_pool("pool-1"))["phase"] == "RETRYABLE"
    assert json.loads(contract.get_profile("profile-1"))["classification"] == ""
    accounting = json.loads(contract.get_pool_accounting("pool-1"))
    assert accounting["participant_outstanding_gen"] == "0"
    assert accounting["sponsor_recoverable_gen"] == "1"
    assert accounting["invariant_holds"] is True


def test_review_enforces_sponsor_state_and_expiry_locally(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = deploy_locked(direct_vm, direct_deploy, direct_alice, [direct_bob])
    install_review_mocks(direct_vm, [{"profile_id": "profile-1", "class": "IMPACTED"}])

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("only sponsor"):
        contract.request_review("pool-1")

    direct_vm.sender = direct_alice
    set_time(direct_vm, REVIEW)
    with direct_vm.expect_revert("review expiry"):
        contract.request_review("pool-1")
    set_time(direct_vm, REVIEW - 1)
    contract.request_review("pool-1")
    with direct_vm.expect_revert("pool is not retryable"):
        contract.retry_review("pool-1")


def test_semantic_validator_rejects_changed_digest_ids_classes_and_roots(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = deploy_locked(direct_vm, direct_deploy, direct_alice, [direct_bob])
    install_review_mocks(direct_vm, [{"profile_id": "profile-1", "class": "IMPACTED"}])
    direct_vm.sender = direct_alice
    contract.request_review("pool-1")
    accepted = json.loads(contract.get_current_attempt("pool-1"))

    malicious = {
        "schema_version": "incidentscope.review.v1",
        "source_policy_hash": "0" * 64,
        "source_status": "VERIFIED",
        "canonical_url": "https://status.openai.com/incidents/" + INCIDENT_ID,
        "incident_id": INCIDENT_ID,
        "content_digest": accepted["source_digest"],
        "source_updated_at": "1970-01-12T13:50:00Z",
        "verdicts": [{"profile_id": "profile-1", "class": "NOT_IMPACTED"}],
        "root_cause_profile_ids": ["profile-1"],
    }
    assert direct_vm.run_validator(leader_result=malicious) is False


def test_semantic_validator_accepts_same_id_class_mapping_in_different_order(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = deploy_locked(direct_vm, direct_deploy, direct_alice, [direct_bob, direct_charlie])
    verdicts = [
        {"profile_id": "profile-1", "class": "IMPACTED"},
        {"profile_id": "profile-2", "class": "AMBIGUOUS"},
    ]
    install_review_mocks(direct_vm, verdicts)
    direct_vm.sender = direct_alice
    contract.request_review("pool-1")

    equivalent = {
        "schema_version": "incidentscope.review.v1",
        "source_policy_hash": "88910f256e8888c21257f88a5ef0c58fd8b118a5648e4a60e2bb56365123851f",
        "source_status": "VERIFIED",
        "canonical_url": "https://status.openai.com/incidents/" + INCIDENT_ID,
        "incident_id": INCIDENT_ID,
        "content_digest": hashlib.sha256(feed_body().encode("utf-8")).hexdigest(),
        "source_updated_at": "1970-01-12T13:50:00Z",
        "verdicts": list(reversed(verdicts)),
        "root_cause_profile_ids": [],
    }
    assert direct_vm.run_validator(leader_result=equivalent) is True

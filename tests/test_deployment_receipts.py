from scripts.deployment_receipts import safe_execution_projection


def test_raw_studio_leader_receipt_projects_only_safe_execution_fields():
    receipt = {
        "status": "FINALIZED",
        "consensus_data": {
            "leader_receipt": [
                {
                    "execution_result": {
                        "status": "SUCCESS",
                        "result": "FINISHED_WITH_RETURN",
                        "return_data": "0x1234",
                        "node_config": {"private": "never expose"},
                    },
                    "stdout": "never expose",
                }
            ]
        },
        "trace": {"private": "never expose"},
    }
    assert safe_execution_projection(receipt) == {
        "status": "SUCCESS",
        "result": "FINISHED_WITH_RETURN",
        "errorCode": None,
        "returnData": "0x1234",
    }


def test_normalized_sdk_shape_is_supported_without_inventing_success():
    receipt = {
        "statusName": "FINALIZED",
        "txExecutionResultName": "FINISHED_WITH_RETURN",
        "returnData": {"contract_address": "0xabc"},
        "node_config": {"private": "never expose"},
    }
    assert safe_execution_projection(receipt) == {
        "status": "FINALIZED",
        "result": "FINISHED_WITH_RETURN",
        "errorCode": None,
        "returnData": {"contract_address": "0xabc"},
    }


def test_error_and_malformed_receipts_remain_explicit_and_safe():
    error = {
        "status": "FINALIZED",
        "execution_result": {
            "status": "ERROR",
            "error_code": "USER_ERROR",
            "result": "FINISHED_WITH_ERROR",
            "stderr": "private validator details",
        },
    }
    assert safe_execution_projection(error) == {
        "status": "ERROR",
        "result": "FINISHED_WITH_ERROR",
        "errorCode": "USER_ERROR",
        "returnData": None,
    }
    for malformed in (None, "bad", [], {"consensus_data": {"leader_receipt": "bad"}}):
        assert safe_execution_projection(malformed) == {
            "status": "UNKNOWN",
            "result": "UNKNOWN",
            "errorCode": None,
            "returnData": None,
        }

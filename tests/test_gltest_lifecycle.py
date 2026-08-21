from scripts.gltest_lifecycle import GEN, create_pool_transaction, install_review_mocks, write_transaction


class FakeTransaction:
    def __init__(self, calls, method_name, args):
        self.calls = calls
        self.method_name = method_name
        self.args = args

    def transact(self, **kwargs):
        self.calls.append(("transact", self.method_name, self.args, kwargs))
        return "tx-hash"


class FakeConnectedContract:
    def __init__(self, calls):
        self.calls = calls

    def __getattr__(self, method_name):
        def method(*, args):
            self.calls.append(("method", method_name, args))
            return FakeTransaction(self.calls, method_name, args)

        return method


class FakeContract:
    def __init__(self):
        self.calls = []

    def connect(self, account):
        self.calls.append(("connect", account))
        return FakeConnectedContract(self.calls)


class FakeProvider:
    def __init__(self):
        self.request = None

    def make_request(self, *, method, params):
        self.request = {"method": method, "params": params}
        return {"ok": True}


class FakeClient:
    def __init__(self):
        self.provider = FakeProvider()


def test_value_write_uses_fluent_connect_args_transact_api():
    contract = FakeContract()
    args = ["title", "url", "OPENAI_STATUS_V1", 100, 200]
    assert create_pool_transaction(contract, "sponsor", args, 2) == "tx-hash"
    assert contract.calls == [
        ("connect", "sponsor"),
        ("method", "create_pool", args),
        ("transact", "create_pool", args, {"value": 2 * GEN}),
    ]


def test_zero_value_write_uses_fluent_api_without_value_kwarg():
    contract = FakeContract()
    assert write_transaction(contract, "integrator", "accept_dependency", ["pool-1"]) == "tx-hash"
    assert contract.calls[-1] == ("transact", "accept_dependency", ["pool-1"], {})


def test_review_mocks_are_installed_as_bare_dict_before_nondet_transaction():
    client = FakeClient()
    install_review_mocks(
        client,
        llm_mocks={".*": '{"verdicts":[],"root_cause_profile_ids":[]}'},
        web_mocks={".*": {"status": 200, "body": "{}"}},
    )
    assert client.provider.request["method"] == "sim_installMocks"
    assert isinstance(client.provider.request["params"], dict)
    assert set(client.provider.request["params"]) == {"llm_mocks", "web_mocks"}

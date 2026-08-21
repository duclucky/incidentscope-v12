from __future__ import annotations


GEN = 10**18


def create_pool_transaction(contract, account, args: list, reserve_gen: int):
    if reserve_gen not in (1, 2):
        raise ValueError("reserve_gen must be 1 or 2 GEN")
    return contract.connect(account).create_pool(args=args).transact(value=reserve_gen * GEN)


def write_transaction(contract, account, method_name: str, args: list):
    method = getattr(contract.connect(account), method_name)
    return method(args=args).transact()


def install_review_mocks(client, *, llm_mocks: dict, web_mocks: dict):
    params = {"llm_mocks": llm_mocks, "web_mocks": web_mocks}
    return client.provider.make_request(method="sim_installMocks", params=params)

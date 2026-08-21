import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionNoticeCenter, TransactionProvider, useTransactions } from "./TransactionProvider";

function TransactionHarness() {
  const { report } = useTransactions();
  return <div>
    <button type="button" onClick={() => report({ id: "tx-1", poolId: "pool-1", title: "Review", stage: "SUBMITTED" })}>Submit</button>
    <button type="button" onClick={() => report({ id: "tx-1", poolId: "pool-1", title: "Review", stage: "FAILED", message: "RPC rejected the transaction" })}>Fail</button>
    <button type="button" onClick={() => report({ id: "tx-1", poolId: "pool-1", title: "Review", stage: "FINALIZED" })}>Invalid finalize</button>
    <button type="button" onClick={() => report({ id: "tx-2", poolId: "pool-2", title: "Withdrawal", stage: "FINALIZED" })}>Finalize another</button>
    <button type="button" onClick={() => report({ id: "tx-3", poolId: "pool-3", title: "Review", stage: "RETRYABLE" })}>Retryable review</button>
  </div>;
}

describe("TransactionProvider", () => {
  it("announces lifecycle, preserves failure, and reloads only valid finalization", async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    render(<TransactionProvider onCanonicalReload={reload}><TransactionHarness /><TransactionNoticeCenter /></TransactionProvider>);
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(screen.getByRole("status")).toHaveTextContent("Submitted");
    await user.click(screen.getByRole("button", { name: "Fail" }));
    expect(screen.getByRole("alert")).toHaveTextContent("RPC rejected the transaction");
    await user.click(screen.getByRole("button", { name: "Invalid finalize" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Failed");
    expect(reload).not.toHaveBeenCalledWith("pool-1");
    await user.click(screen.getByRole("button", { name: "Finalize another" }));
    expect(reload).toHaveBeenCalledWith("pool-2");
    await user.click(screen.getByRole("button", { name: "Retryable review" }));
    expect(screen.getByRole("status")).toHaveTextContent("Retry available");
    expect(reload).toHaveBeenCalledWith("pool-3");
  });
});

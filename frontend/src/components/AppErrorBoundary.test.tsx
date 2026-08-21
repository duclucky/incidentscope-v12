import { render, screen } from "@testing-library/react";
import { AppErrorBoundary } from "./AppErrorBoundary";

function BrokenPage(): never {
  throw new Error("render failed");
}

describe("AppErrorBoundary", () => {
  it("shows a recoverable user-facing failure without claiming success", () => {
    render(<AppErrorBoundary onReset={vi.fn()}><BrokenPage /></AppErrorBoundary>);
    expect(screen.getByRole("heading", { name: "This page could not be displayed" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload IncidentScope" })).toBeInTheDocument();
    expect(screen.queryByText(/finalized|success/i)).not.toBeInTheDocument();
  });
});

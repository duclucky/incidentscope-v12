import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../App";

function renderPath(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>);
}

describe("public product pages", () => {
  it("explains the bounded value flow and its honest limits on Home", () => {
    renderPath("/");

    expect(screen.getByText("Provider-funded credits, independently scoped.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore credit pools" })).toHaveAttribute("href", "/pools");
    expect(screen.getByRole("img", { name: "Dependency paths pass through a bounded incident-scope decision." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "How the credit boundary works" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What IncidentScope does not prove" })).toBeInTheDocument();
    expect(screen.getByText(/provider's official status incident page/i)).toBeInTheDocument();
  });

  it("documents evidence, result classes, and non-penalizing recovery on Help", () => {
    renderPath("/help");

    expect(screen.getByText("IMPACTED")).toBeInTheDocument();
    expect(screen.getByText("NOT_IMPACTED")).toBeInTheDocument();
    expect(screen.getByText("AMBIGUOUS")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "When official evidence is unavailable" })).toBeInTheDocument();
    expect(screen.getAllByText(/no credit or penalty moves/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("link", { name: "Review wallet and network settings" })).toHaveAttribute("href", "/settings");
  });
});

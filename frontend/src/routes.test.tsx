import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "./App";

const routeCases = [
  ["/", "Decide incident scope before credits move"],
  ["/pools", "Credit pools"],
  ["/pools/new", "Create a credit pool"],
  ["/pools/pool-1", "Pool details"],
  ["/dependencies", "Your dependencies"],
  ["/activity", "Activity"],
  ["/settings", "Settings"],
  ["/help", "Help and evidence model"],
] as const;

describe("application routes", () => {
  it.each(routeCases)("renders %s inside persistent navigation", (path, heading) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: heading, level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Pools" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Activity" }).length).toBeGreaterThan(0);
  });

  it("keeps support routes reachable from the mobile more menu", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/pools"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "More" }));

    expect(screen.getByRole("menuitem", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Help" })).toBeInTheDocument();
  });
});

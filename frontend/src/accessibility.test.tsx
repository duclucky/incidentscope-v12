import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { axe } from "vitest-axe";
import { AppRoutes } from "./App";

describe("application accessibility", () => {
  it.each([
    ["/", "Decide incident scope before credits move"],
    ["/pools", "Credit pools"],
  ])("has no automated accessibility violations on %s", async (path, heading) => {
    const { container } = render(
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await screen.findByRole("heading", { name: heading, level: 1 });

    const results = await axe(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});

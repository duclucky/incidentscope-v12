import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WalletControls } from "./WalletControls";
import { WalletProvider } from "./WalletProvider";

describe("WalletControls", () => {
  it("shows a centered picker, then exposes account disconnect", async () => {
    const user = userEvent.setup();
    const request = vi.fn().mockResolvedValue(["0x1234567890abcdef1234567890abcdef12345678"]);
    Object.defineProperty(window, "ethereum", {
      configurable: true,
      value: { request, isRabby: true },
    });
    render(
      <WalletProvider>
        <WalletControls />
      </WalletProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Connect wallet" }));
    expect(screen.getByRole("dialog", { name: "Choose a wallet" })).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Rabby/ }));
    expect(await screen.findByRole("button", { name: /Account 0x1234/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Account 0x1234/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Disconnect" }));
    expect(screen.getByRole("button", { name: "Connect wallet" })).toBeInTheDocument();
    Reflect.deleteProperty(window, "ethereum");
  });
});

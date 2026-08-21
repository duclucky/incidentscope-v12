import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { CaretDown, Copy, SignOut, Wallet } from "@phosphor-icons/react";
import { useWallet } from "./WalletProvider";

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function AccountMenu() {
  const { account, selectedWallet, disconnect } = useWallet();
  if (!account) return null;

  const copyAddress = async () => {
    await navigator.clipboard?.writeText(account);
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="account-trigger" type="button" aria-label={`Account ${shortenAddress(account)}`}>
          <Wallet aria-hidden="true" />
          <span>{shortenAddress(account)}</span>
          <CaretDown aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="account-menu" align="end" sideOffset={8}>
          <DropdownMenu.Label>Connected with {selectedWallet?.name ?? "Browser wallet"}</DropdownMenu.Label>
          <DropdownMenu.Separator />
          <DropdownMenu.Item className="menu-item" onSelect={() => void copyAddress()}>
            <Copy aria-hidden="true" /> Copy address
          </DropdownMenu.Item>
          <DropdownMenu.Item className="menu-item danger" onSelect={disconnect}>
            <SignOut aria-hidden="true" /> Disconnect
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

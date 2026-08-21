import * as Dialog from "@radix-ui/react-dialog";
import { Wallet, X } from "@phosphor-icons/react";
import { useWallet } from "./WalletProvider";

interface WalletPickerDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
}

export function WalletPickerDialog({ open, onOpenChange }: WalletPickerDialogProps) {
  const { providers, connect, connectionStatus } = useWallet();

  const chooseWallet = async (providerIndex: number) => {
    const provider = providers[providerIndex];
    if (!provider) return;
    await connect(provider);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content" aria-describedby="wallet-picker-description">
          <div className="dialog-heading">
            <div>
              <Dialog.Title>Choose a wallet</Dialog.Title>
              <Dialog.Description id="wallet-picker-description">
                Select a detected browser wallet. IncidentScope never chooses one for you.
              </Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="Close wallet picker">
              <X aria-hidden="true" />
            </Dialog.Close>
          </div>
          {providers.length > 0 ? (
            <div className="wallet-list">
              {providers.map((provider, index) => (
                <button
                  className="wallet-option"
                  type="button"
                  key={`${provider.source}-${provider.id}`}
                  onClick={() => void chooseWallet(index)}
                  disabled={connectionStatus === "CONNECTING"}
                >
                  {provider.icon ? (
                    <img src={provider.icon} alt="" width="32" height="32" />
                  ) : (
                    <span className="wallet-icon" aria-hidden="true">
                      <Wallet />
                    </span>
                  )}
                  <span>
                    <strong>{provider.name}</strong>
                    <small>{provider.source === "EIP6963" ? "EIP-6963" : "Injected provider"}</small>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-inline">
              <Wallet aria-hidden="true" />
              <div>
                <strong>No browser wallet detected</strong>
                <p>Install or enable an EVM-compatible wallet, then reopen this picker.</p>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

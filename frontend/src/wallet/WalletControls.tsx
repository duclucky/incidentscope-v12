import { useState } from "react";
import { Wallet } from "@phosphor-icons/react";
import { AccountMenu } from "./AccountMenu";
import { useWallet } from "./WalletProvider";
import { WalletPickerDialog } from "./WalletPickerDialog";

export function WalletControls() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { account, connectionStatus, error } = useWallet();

  return (
    <div className="wallet-controls">
      {account ? (
        <AccountMenu />
      ) : (
        <button className="button primary compact" type="button" onClick={() => setPickerOpen(true)}>
          <Wallet aria-hidden="true" />
          {connectionStatus === "CONNECTING" ? "Connecting…" : "Connect wallet"}
        </button>
      )}
      {error ? <p className="connection-error" role="alert">{error}</p> : null}
      <WalletPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} />
    </div>
  );
}

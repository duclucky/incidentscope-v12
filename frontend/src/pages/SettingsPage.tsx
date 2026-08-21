import { Desktop, Moon, SignOut, Sun, Wallet } from "@phosphor-icons/react";
import { useContractAdapter } from "../adapters/ContractAdapterProvider";
import { useTheme } from "../theme/ThemeProvider";
import { useWallet } from "../wallet/WalletProvider";

export function SettingsPage() {
  const adapter = useContractAdapter();
  const { theme, setTheme } = useTheme();
  const { account, selectedWallet, providers, disconnect } = useWallet();
  const configuration = adapter.configuration;

  return (
    <section className="page settings-page">
      <header className="page-header narrow"><p className="page-context">Account and connection</p><h1>Settings</h1><p>Inspect the selected wallet, separate network paths, and display theme. Canonical contract state is never stored here.</p></header>
      <div className="settings-stack">
        <section className="settings-panel"><div className="settings-heading"><Wallet aria-hidden="true" /><div><h2>Wallet session</h2><p>{account ? `Connected with ${selectedWallet?.name ?? "Browser wallet"}` : `${providers.length} browser wallet${providers.length === 1 ? "" : "s"} detected`}</p></div></div>{account ? <div className="setting-row"><div><span>Selected account</span><code>{account}</code></div><button className="button secondary" type="button" onClick={disconnect}><SignOut aria-hidden="true" /> Disconnect</button></div> : <p className="settings-note">Use “Connect wallet” in the top bar to explicitly choose a provider. No provider is selected automatically.</p>}</section>

        <section className="settings-panel"><div className="settings-heading"><Desktop aria-hidden="true" /><div><h2>Network paths</h2><p>{configuration.networkName}</p></div></div><div className="network-path-list"><div><span>Wallet write path</span><strong>{configuration.writeConfigured ? "Configured" : "Not configured"}</strong><small>EVM-compatible provider selected in the browser</small></div><div><span>Intelligent Contract read path</span><strong>{configuration.readConfigured ? "Configured" : "Not configured"}</strong><small>{configuration.icReadPath ?? "Same-origin proxy or browser-safe GenLayer RPC required"}</small></div></div></section>

        <section className="settings-panel"><div className="settings-heading"><Sun aria-hidden="true" /><div><h2>Appearance</h2><p>Theme stays in this browser session only.</p></div></div><div className="theme-options"><button className={theme === "light" ? "selected" : ""} type="button" aria-label="Use light theme" onClick={() => setTheme("light")}><Sun aria-hidden="true" /> Light</button><button className={theme === "dark" ? "selected" : ""} type="button" aria-label="Use dark theme" onClick={() => setTheme("dark")}><Moon aria-hidden="true" /> Dark</button></div></section>
      </div>
    </section>
  );
}

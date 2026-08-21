import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { detectInjectedWallets, startWalletDiscovery } from "./discovery";
import { ensureStudionetWalletChain } from "./network";
import type { WalletDescriptor } from "./types";

type ConnectionStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR";

interface WalletContextValue {
  providers: WalletDescriptor[];
  selectedWallet?: WalletDescriptor;
  account?: string;
  connectionStatus: ConnectionStatus;
  error?: string;
  connect(wallet: WalletDescriptor): Promise<void>;
  disconnect(): void;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

function mergeWallets(current: WalletDescriptor[], incoming: WalletDescriptor): WalletDescriptor[] {
  const duplicate = current.some(
    (wallet) => wallet.provider === incoming.provider || wallet.id === incoming.id,
  );
  return duplicate ? current : [...current, incoming];
}

function normalizeAccounts(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((account): account is string => typeof account === "string" && account.length > 0);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [providers, setProviders] = useState<WalletDescriptor[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletDescriptor>();
  const [account, setAccount] = useState<string>();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("DISCONNECTED");
  const [error, setError] = useState<string>();

  useEffect(() => {
    for (const provider of detectInjectedWallets(window)) {
      setProviders((current) => mergeWallets(current, provider));
    }
    return startWalletDiscovery(window, (provider) => {
      setProviders((current) => mergeWallets(current, provider));
    });
  }, []);

  const disconnect = useCallback(() => {
    setSelectedWallet(undefined);
    setAccount(undefined);
    setConnectionStatus("DISCONNECTED");
    setError(undefined);
  }, []);

  const connect = useCallback(async (wallet: WalletDescriptor) => {
    setSelectedWallet(wallet);
    setConnectionStatus("CONNECTING");
    setError(undefined);

    try {
      const accounts = normalizeAccounts(
        await wallet.provider.request({ method: "eth_requestAccounts" }),
      );
      if (!accounts[0]) {
        throw new Error("The selected wallet returned no account.");
      }
      await ensureStudionetWalletChain(wallet.provider);
      setAccount(accounts[0]);
      setConnectionStatus("CONNECTED");
    } catch (cause) {
      setAccount(undefined);
      setConnectionStatus("ERROR");
      setError(cause instanceof Error ? cause.message : "Wallet connection was rejected.");
    }
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      providers,
      selectedWallet,
      account,
      connectionStatus,
      error,
      connect,
      disconnect,
    }),
    [providers, selectedWallet, account, connectionStatus, error, connect, disconnect],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const value = useContext(WalletContext);
  if (!value) {
    throw new Error("useWallet must be used inside WalletProvider");
  }
  return value;
}

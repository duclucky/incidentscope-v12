import { createContext, useContext, type ReactNode } from "react";
import type { ContractAdapter } from "./contract";
import { createUnconfiguredContractAdapter } from "./unconfiguredContract";

const defaultAdapter = createUnconfiguredContractAdapter();
const ContractAdapterContext = createContext<ContractAdapter | undefined>(undefined);

interface ContractAdapterProviderProps {
  adapter?: ContractAdapter;
  children: ReactNode;
}

export function ContractAdapterProvider({
  adapter = defaultAdapter,
  children,
}: ContractAdapterProviderProps) {
  return (
    <ContractAdapterContext.Provider value={adapter}>
      {children}
    </ContractAdapterContext.Provider>
  );
}

export function useContractAdapter(): ContractAdapter {
  const adapter = useContext(ContractAdapterContext);

  if (!adapter) {
    throw new Error("useContractAdapter must be used inside ContractAdapterProvider");
  }

  return adapter;
}

import { useMemo, type ReactNode } from "react";
import { useTransactions } from "../transactions/TransactionProvider";
import { useWallet } from "../wallet/WalletProvider";
import { ContractAdapterProvider } from "./ContractAdapterProvider";
import { createGenLayerContractAdapter } from "./genlayerContract";


export function ContractRuntimeAdapterProvider({ children }: { children: ReactNode }) {
  const { account, selectedWallet } = useWallet();
  const { report } = useTransactions();
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined;

  const adapter = useMemo(() => {
    if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) return undefined;
    return createGenLayerContractAdapter({
      contractAddress,
      account,
      provider: selectedWallet?.provider,
      icReadPath: "/genlayer-rpc",
      onTransactionStage: report,
    });
  }, [account, contractAddress, report, selectedWallet]);

  return <ContractAdapterProvider adapter={adapter}>{children}</ContractAdapterProvider>;
}

import type { Eip1193Provider, Eip6963Announcement, WalletDescriptor } from "./types";

type InjectedWindow = Window & {
  ethereum?: Eip1193Provider;
  okxwallet?: Eip1193Provider;
  okxWallet?: Eip1193Provider;
  rabby?: Eip1193Provider;
  coinbaseWalletExtension?: Eip1193Provider;
  coinbaseWallet?: Eip1193Provider;
  braveEthereum?: Eip1193Provider;
};

function providerIdentity(provider: Eip1193Provider): { id: string; name: string } {
  if (provider.isRabby) return { id: "rabby", name: "Rabby" };
  if (provider.isOkxWallet) return { id: "okx", name: "OKX Wallet" };
  if (provider.isCoinbaseWallet) return { id: "coinbase", name: "Coinbase Wallet" };
  if (provider.isBraveWallet) return { id: "brave", name: "Brave Wallet" };
  if (provider.isMetaMask) return { id: "metamask", name: "MetaMask" };
  return { id: "browser-wallet", name: "Browser wallet" };
}

export function detectInjectedWallets(browserWindow: Window): WalletDescriptor[] {
  const injected = browserWindow as InjectedWindow;
  const ethereumCandidates = injected.ethereum?.providers?.length
    ? injected.ethereum.providers
    : injected.ethereum
      ? [injected.ethereum]
      : [];
  const candidates = [
    ...ethereumCandidates,
    injected.okxwallet,
    injected.okxWallet,
    injected.rabby,
    injected.coinbaseWalletExtension,
    injected.coinbaseWallet,
    injected.braveEthereum,
  ].filter((candidate): candidate is Eip1193Provider => Boolean(candidate?.request));
  const seen = new Set<Eip1193Provider>();

  return candidates.flatMap((provider) => {
    if (seen.has(provider)) return [];
    seen.add(provider);
    const identity = providerIdentity(provider);
    return [
      {
        id: `injected-${identity.id}`,
        name: identity.name,
        source: "INJECTED" as const,
        provider,
      },
    ];
  });
}

export function startWalletDiscovery(
  browserWindow: Window,
  onProvider: (wallet: WalletDescriptor) => void,
): () => void {
  const handleAnnouncement = (event: Event) => {
    const announcement = (event as CustomEvent<Eip6963Announcement>).detail;

    if (!announcement?.info?.uuid || !announcement.provider) {
      return;
    }

    onProvider({
      id: announcement.info.uuid,
      name: announcement.info.name,
      icon: announcement.info.icon,
      rdns: announcement.info.rdns,
      source: "EIP6963",
      provider: announcement.provider,
    });
  };

  browserWindow.addEventListener("eip6963:announceProvider", handleAnnouncement);
  browserWindow.dispatchEvent(new Event("eip6963:requestProvider"));

  return () => {
    browserWindow.removeEventListener("eip6963:announceProvider", handleAnnouncement);
  };
}

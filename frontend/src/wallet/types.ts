export interface Eip1193RequestArguments {
  method: string;
  params?: readonly unknown[] | object;
}

export interface Eip1193Provider {
  request(args: Eip1193RequestArguments): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
  isMetaMask?: boolean;
  isRabby?: boolean;
  isCoinbaseWallet?: boolean;
  isBraveWallet?: boolean;
  isOkxWallet?: boolean;
  providers?: Eip1193Provider[];
}

export interface Eip6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface WalletDescriptor {
  id: string;
  name: string;
  icon?: string;
  rdns?: string;
  source: "EIP6963" | "INJECTED";
  provider: Eip1193Provider;
}

export interface Eip6963Announcement {
  info: Eip6963ProviderInfo;
  provider: Eip1193Provider;
}

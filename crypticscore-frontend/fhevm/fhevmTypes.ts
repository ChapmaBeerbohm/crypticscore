// Re-export types from the reference implementation
export type FhevmInstance = {
  createEncryptedInput: (contractAddress: string, userAddress: string) => EncryptedInputBuilder;
  getPublicKey: () => string;
  getPublicParams: (size: number) => string;
  generateKeypair: () => { publicKey: string; privateKey: string };
  createEIP712: (
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: number,
    durationDays: number
  ) => {
    domain: any;
    types: { UserDecryptRequestVerification: Array<{ name: string; type: string }> };
    message: any;
  };
  userDecrypt: (
    handles: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ) => Promise<Record<string, bigint | boolean>>;
};

export type EncryptedInputBuilder = {
  add32: (value: number) => EncryptedInputBuilder;
  add64: (value: number) => EncryptedInputBuilder;
  addBool: (value: boolean) => EncryptedInputBuilder;
  addAddress: (address: string) => EncryptedInputBuilder;
  encrypt: () => Promise<{ handles: string[]; inputProof: string }>;
};

export type FhevmInstanceConfig = {
  aclContractAddress: string;
  network: string | any;
  publicKey?: string;
  publicParams?: string;
  gatewayRelayerURL?: string;
  chainId?: number;
};


import { ethers } from "ethers";
import { FhevmInstance } from "./fhevmTypes";

export type FhevmDecryptionSignatureType = {
  privateKey: string;
  publicKey: string;
  signature: string;
  contractAddresses: string[];
  userAddress: string;
  startTimestamp: number;
  durationDays: number;
};

export class FhevmDecryptionSignature {
  privateKey: string;
  publicKey: string;
  signature: string;
  contractAddresses: string[];
  userAddress: string;
  startTimestamp: number;
  durationDays: number;

  constructor(data: FhevmDecryptionSignatureType) {
    this.privateKey = data.privateKey;
    this.publicKey = data.publicKey;
    this.signature = data.signature;
    this.contractAddresses = data.contractAddresses;
    this.userAddress = data.userAddress;
    this.startTimestamp = data.startTimestamp;
    this.durationDays = data.durationDays;
  }

  static async loadOrSign(
    instance: FhevmInstance,
    contractAddresses: `0x${string}`[],
    signer: ethers.JsonRpcSigner,
    storage: { get: (key: string) => string | null; set: (key: string, value: string) => void }
  ): Promise<FhevmDecryptionSignature | null> {
    const userAddress = await signer.getAddress();
    const storageKey = `fhevm.decryptionSignature.${userAddress}`;

    try {
      const stored = storage.get(storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        return new FhevmDecryptionSignature(data);
      }
    } catch (e) {
      console.warn("Failed to load stored signature:", e);
    }

    // Generate new signature
    try {
      // Generate keypair (works in both Mock and Real modes)
      const { publicKey, privateKey } = instance.generateKeypair();
      
      const startTimestamp = Math.floor(Date.now() / 1000);
      const durationDays = 365; // 1 year validity

      // Use instance.createEIP712 method (works in both modes)
      const eip712 = instance.createEIP712(
        publicKey,
        contractAddresses,
        startTimestamp,
        durationDays
      );

      // Sign the EIP712 message
      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );

      const sigData: FhevmDecryptionSignatureType = {
        privateKey: privateKey,
        publicKey: publicKey,
        signature: signature,
        contractAddresses: contractAddresses,
        userAddress: userAddress,
        startTimestamp: startTimestamp,
        durationDays: durationDays,
      };

      storage.set(storageKey, JSON.stringify(sigData));
      return new FhevmDecryptionSignature(sigData);
    } catch (e) {
      console.error("Failed to create signature:", e);
      return null;
    }
  }
}


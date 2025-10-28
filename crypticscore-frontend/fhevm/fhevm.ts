import { isAddress, Eip1193Provider, JsonRpcProvider } from "ethers";
import { FhevmInstance, FhevmInstanceConfig } from "./fhevmTypes";
import { RelayerSDKLoader, isFhevmWindowType } from "./loader";
import { LOCALHOST_RPC_URL, LOCALHOST_CHAIN_ID } from "./constants";

export class FhevmError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message);
    this.code = code;
    this.name = "FhevmError";
  }
}

async function getChainId(providerOrUrl: Eip1193Provider | string): Promise<number> {
  if (typeof providerOrUrl === "string") {
    const provider = new JsonRpcProvider(providerOrUrl);
    const chainId = Number((await provider.getNetwork()).chainId);
    provider.destroy();
    return chainId;
  }
  const chainId = await providerOrUrl.request({ method: "eth_chainId" });
  return Number.parseInt(chainId as string, 16);
}

async function getWeb3ClientVersion(rpcUrl: string): Promise<string> {
  const rpc = new JsonRpcProvider(rpcUrl);
  try {
    return await rpc.send("web3_clientVersion", []);
  } finally {
    rpc.destroy();
  }
}

async function tryFetchFHEVMHardhatNodeMetadata(rpcUrl: string): Promise<
  | {
      ACLAddress: `0x${string}`;
      InputVerifierAddress: `0x${string}`;
      KMSVerifierAddress: `0x${string}`;
    }
  | undefined
> {
  try {
    const version = await getWeb3ClientVersion(rpcUrl);
    if (!version.toLowerCase().includes("hardhat")) {
      return undefined;
    }

    const rpc = new JsonRpcProvider(rpcUrl);
    try {
      const metadata = await rpc.send("fhevm_relayer_metadata", []);
      if (
        metadata &&
        typeof metadata === "object" &&
        "ACLAddress" in metadata &&
        "InputVerifierAddress" in metadata &&
        "KMSVerifierAddress" in metadata
      ) {
        return metadata as any;
      }
    } finally {
      rpc.destroy();
    }
  } catch (e) {
    console.warn("Not a FHEVM Hardhat node:", e);
  }
  return undefined;
}

type MockResolveResult = { isMock: true; chainId: number; rpcUrl: string };
type GenericResolveResult = { isMock: false; chainId: number; rpcUrl?: string };
type ResolveResult = MockResolveResult | GenericResolveResult;

async function resolve(
  providerOrUrl: Eip1193Provider | string,
  mockChains?: Record<number, string>
): Promise<ResolveResult> {
  const chainId = await getChainId(providerOrUrl);
  let rpcUrl = typeof providerOrUrl === "string" ? providerOrUrl : undefined;

  const _mockChains: Record<number, string> = {
    [LOCALHOST_CHAIN_ID]: LOCALHOST_RPC_URL,
    ...(mockChains ?? {}),
  };

  if (Object.hasOwn(_mockChains, chainId)) {
    if (!rpcUrl) {
      rpcUrl = _mockChains[chainId];
    }
    return { isMock: true, chainId, rpcUrl };
  }

  return { isMock: false, chainId, rpcUrl };
}

export const createFhevmInstance = async (parameters: {
  provider: Eip1193Provider | string;
  mockChains?: Record<number, string>;
  onStatusChange?: (status: string) => void;
}): Promise<FhevmInstance> => {
  const { provider: providerOrUrl, mockChains, onStatusChange } = parameters;

  const notify = (status: string) => {
    if (onStatusChange) onStatusChange(status);
  };

  const { isMock, rpcUrl, chainId } = await resolve(providerOrUrl, mockChains);

  if (isMock && rpcUrl) {
    const metadata = await tryFetchFHEVMHardhatNodeMetadata(rpcUrl);

    if (metadata) {
      notify("creating-mock");
      
      // Dynamic import to avoid bundling mock in production
      const fhevmMock = await import("./mock/fhevmMock");
      const mockInstance = await fhevmMock.fhevmMockCreateInstance({
        rpcUrl,
        chainId,
        metadata,
      });

      notify("ready");
      return mockInstance;
    }
  }

  // Load real Relayer SDK
  if (!isFhevmWindowType(window)) {
    notify("sdk-loading");
    const loader = new RelayerSDKLoader();
    await loader.load();
    notify("sdk-loaded");
  }

  if (!isFhevmWindowType(window)) {
    throw new FhevmError("SDK_NOT_LOADED", "Relayer SDK not available");
  }

  const relayerSDK = window.relayerSDK;

  if (!relayerSDK.__initialized__) {
    notify("sdk-initializing");
    await relayerSDK.initSDK();
    relayerSDK.__initialized__ = true;
    notify("sdk-initialized");
  }

  const aclAddress = relayerSDK.SepoliaConfig.aclContractAddress;
  if (!isAddress(aclAddress)) {
    throw new FhevmError("INVALID_ACL_ADDRESS", `Invalid address: ${aclAddress}`);
  }

  const config: FhevmInstanceConfig = {
    ...relayerSDK.SepoliaConfig,
    network: providerOrUrl,
  };

  notify("creating");
  const instance = await relayerSDK.createInstance(config);
  notify("ready");

  return instance;
};



import { SDK_CDN_URL } from "./constants";

type FhevmWindowType = Window & {
  relayerSDK: {
    initSDK: (options?: any) => Promise<boolean>;
    createInstance: (config: any) => Promise<any>;
    SepoliaConfig: any;
    __initialized__?: boolean;
  };
};

export class RelayerSDKLoader {
  public isLoaded(): boolean {
    if (typeof window === "undefined") {
      return false;
    }
    return "relayerSDK" in window && typeof (window as any).relayerSDK === "object";
  }

  public async load(): Promise<void> {
    console.log("[RelayerSDKLoader] Loading SDK...");
    
    if (typeof window === "undefined") {
      throw new Error("RelayerSDKLoader: can only be used in the browser.");
    }

    if (this.isLoaded()) {
      console.log("[RelayerSDKLoader] SDK already loaded");
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${SDK_CDN_URL}"]`);
      if (existingScript) {
        if (this.isLoaded()) {
          resolve();
        } else {
          reject(new Error("SDK script exists but not loaded properly"));
        }
        return;
      }

      const script = document.createElement("script");
      script.src = SDK_CDN_URL;
      script.type = "text/javascript";
      script.async = true;

      script.onload = () => {
        if (!this.isLoaded()) {
          console.error("[RelayerSDKLoader] Script loaded but SDK not available");
          reject(new Error("Relayer SDK script loaded but window.relayerSDK is invalid"));
        } else {
          console.log("[RelayerSDKLoader] SDK loaded successfully");
          resolve();
        }
      };

      script.onerror = () => {
        console.error("[RelayerSDKLoader] Failed to load SDK");
        reject(new Error(`Failed to load Relayer SDK from ${SDK_CDN_URL}`));
      };

      console.log("[RelayerSDKLoader] Adding script to DOM...");
      document.head.appendChild(script);
    });
  }
}

export function isFhevmWindowType(win: any): win is FhevmWindowType {
  return typeof win === "object" && 
         win !== null && 
         "relayerSDK" in win && 
         typeof win.relayerSDK === "object";
}



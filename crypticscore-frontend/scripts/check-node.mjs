import { ethers } from "ethers";

async function checkIfHardhatNodeIsRunning() {
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");

  try {
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Hardhat node is running. Block number: ${blockNumber}`);
  } catch {
    console.error("\n");
    console.error("===============================================================================\n");
    console.error(" ❌ Local Hardhat Node is not running!\n");
    console.error("   To start Hardhat Node:");
    console.error("   ----------------------");
    console.error("   ✅ 1. Open a new terminal window");
    console.error("   ✅ 2. cd ../fhevm-hardhat-template");
    console.error("   ✅ 3. Run: npx hardhat node\n");
    console.error("===============================================================================\n");
    console.error("\n");
    process.exit(1);
  } finally {
    provider.destroy();
  }
}

checkIfHardhatNodeIsRunning();



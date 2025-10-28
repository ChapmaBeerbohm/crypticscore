const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  
  console.log("🔍 Sepolia Deployment Account:");
  console.log("Address:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
  
  const minRequired = hre.ethers.parseEther("0.01"); // 0.01 ETH minimum
  
  if (balance < minRequired) {
    console.log("\n❌ Insufficient balance for deployment!");
    console.log("💡 Get Sepolia ETH from:");
    console.log("   • https://sepoliafaucet.com/");
    console.log("   • https://www.alchemy.com/faucets/ethereum-sepolia");
    console.log("   • https://faucet.quicknode.com/ethereum/sepolia");
    process.exit(1);
  } else {
    console.log("✅ Sufficient balance for deployment");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

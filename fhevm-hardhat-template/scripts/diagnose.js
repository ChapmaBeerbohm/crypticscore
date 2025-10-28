const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🔍 Diagnosing deployment issues...\n");

  // 1. Check if deployment file exists
  const deploymentPath = "./deployments/localhost/RatingManager.json";
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ RatingManager.json not found!");
    console.log("Please run: npx hardhat deploy --network localhost\n");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("✅ Contract deployed at:", deployment.address);

  // 2. Check if contract code exists
  const code = await ethers.provider.getCode(deployment.address);
  if (code === "0x") {
    console.error("❌ No contract code at address!");
    console.log("The Hardhat node may have been restarted.");
    console.log("Please redeploy: npx hardhat deploy --network localhost\n");
    process.exit(1);
  }
  console.log("✅ Contract code exists");

  // 3. Check signer balance
  const [signer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(signer.address);
  console.log("✅ Signer address:", signer.address);
  console.log("✅ Balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("❌ Insufficient balance!");
    process.exit(1);
  }

  // 4. Try to read contract
  const RatingManager = await ethers.getContractAt("RatingManager", deployment.address);
  const projectCount = await RatingManager.projectCount();
  console.log("✅ Current project count:", projectCount.toString());

  // 5. Test a simple transaction
  console.log("\n🧪 Testing contract interaction...");
  try {
    const testDimensions = ["Quality", "Service"];
    const endTime = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
    
    const tx = await RatingManager.createRatingProject(
      "Test Project",
      "Test Description",
      testDimensions,
      5,
      endTime,
      false
    );
    
    const receipt = await tx.wait();
    console.log("✅ Test transaction successful!");
    console.log("   Gas used:", receipt.gasUsed.toString());
    console.log("   Block:", receipt.blockNumber);
  } catch (error) {
    console.error("❌ Test transaction failed:");
    console.error("   Error:", error.message);
    
    if (error.message.includes("InvalidEndTime")) {
      console.log("\n💡 Tip: Check that endTime > current block timestamp");
    } else if (error.message.includes("InvalidDimensions")) {
      console.log("\n💡 Tip: Ensure 1-10 dimensions with non-empty names");
    }
  }

  console.log("\n✅ Diagnosis complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



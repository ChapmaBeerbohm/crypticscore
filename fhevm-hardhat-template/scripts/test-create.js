const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("Testing with account:", signer.address);

  // Get deployed contract
  const deployment = await hre.deployments.get("RatingManager");
  console.log("Contract address:", deployment.address);

  const RatingManager = await hre.ethers.getContractAt(
    "RatingManager",
    deployment.address,
    signer
  );

  // Check current state
  const currentCount = await RatingManager.projectCount();
  console.log("Current project count:", currentCount.toString());

  // Test create
  console.log("\nCreating test project...");
  const dimensions = ["Quality", "Service", "Value"];
  const endTime = Math.floor(Date.now() / 1000) + 7 * 86400; // 7 days

  try {
    const tx = await RatingManager.createRatingProject(
      "Test Project",
      "Test Description",
      dimensions,
      5,
      endTime,
      false
    );

    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Success! Gas used:", receipt.gasUsed.toString());

    const newCount = await RatingManager.projectCount();
    console.log("New project count:", newCount.toString());
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



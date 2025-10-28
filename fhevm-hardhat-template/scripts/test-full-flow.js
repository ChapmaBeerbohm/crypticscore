const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing complete rating flow...\n");

  const [alice, bob] = await hre.ethers.getSigners();
  console.log("Alice:", alice.address);
  console.log("Bob:", bob.address);

  // Get contract
  const deployment = await hre.deployments.get("RatingManager");
  const contract = await hre.ethers.getContractAt(
    "RatingManager",
    deployment.address
  );
  console.log("\n✅ Contract address:", deployment.address);

  // 1. Create project (Alice)
  console.log("\n📝 Step 1: Alice creates a project...");
  const dimensions = ["Quality", "Service", "Value"];
  const endTime = Math.floor(Date.now() / 1000) + 86400; // 1 day

  const createTx = await contract.connect(alice).createRatingProject(
    "Test Product",
    "Testing the rating system",
    dimensions,
    5,
    endTime,
    false
  );
  await createTx.wait();
  console.log("✅ Project created (ID: 0)");

  // 2. Bob submits encrypted rating
  console.log("\n🔒 Step 2: Bob submits encrypted rating...");

  // Create encrypted input for 3 dimensions
  const input = hre.fhevm.createEncryptedInput(deployment.address, bob.address);
  input.add32(5); // Quality: 5/5
  input.add32(4); // Service: 4/5
  input.add32(3); // Value: 3/5
  const encrypted = await input.encrypt();

  const rateTx = await contract.connect(bob).submitRating(
    0, // projectId
    encrypted.handles,
    encrypted.inputProof
  );
  await rateTx.wait();
  console.log("✅ Bob's rating submitted");

  // 3. Alice authorizes decryption
  console.log("\n🔓 Step 3: Alice authorizes decryption...");
  const authTx = await contract.connect(alice).allowCreatorDecryptAll(0);
  await authTx.wait();
  console.log("✅ Decryption authorized");

  // 4. Decrypt ratings
  console.log("\n📊 Step 4: Decrypting ratings...");
  
  for (let dimIdx = 0; dimIdx < dimensions.length; dimIdx++) {
    const handle = await contract.getRatingScore(0, 0, dimIdx);
    
    try {
      const decrypted = await hre.fhevm.userDecryptEuint(
        contract.target,
        handle,
        alice.address
      );
      console.log(`  ${dimensions[dimIdx]}: ${decrypted}/5`);
    } catch (error) {
      console.error(`  ${dimensions[dimIdx]}: Decryption failed -`, error.message);
    }
  }

  console.log("\n✅ Full flow test complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


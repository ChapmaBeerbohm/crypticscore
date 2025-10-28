import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("rating:create", "Create a new rating project")
  .addParam("name", "Project name")
  .addParam("description", "Project description")
  .addParam("dimensions", "Comma-separated dimension names (e.g., Quality,Service,Value)")
  .addParam("scale", "Maximum rating value (e.g., 5 for 1-5 stars)")
  .addParam("days", "Number of days until project ends")
  .addOptionalParam("multiple", "Allow multiple ratings from same user", "false")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const deployment = await hre.deployments.get("RatingManager");
    const contract = await hre.ethers.getContractAt("RatingManager", deployment.address);
    const [signer] = await hre.ethers.getSigners();
    
    const dimensions = taskArgs.dimensions.split(",").map((d: string) => d.trim());
    const endTime = Math.floor(Date.now() / 1000) + (parseInt(taskArgs.days) * 86400);
    const allowMultiple = taskArgs.multiple === "true";
    
    console.log("Creating rating project...");
    console.log("- Name:", taskArgs.name);
    console.log("- Dimensions:", dimensions);
    console.log("- Scale:", taskArgs.scale);
    console.log("- End time:", new Date(endTime * 1000).toISOString());
    console.log("- Allow multiple:", allowMultiple);
    
    const tx = await contract.createRatingProject(
      taskArgs.name,
      taskArgs.description,
      dimensions,
      parseInt(taskArgs.scale),
      endTime,
      allowMultiple
    );
    
    const receipt = await tx.wait();
    const event = receipt.logs.find((log: any) => {
      try {
        return contract.interface.parseLog(log)?.name === "RatingProjectCreated";
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = contract.interface.parseLog(event);
      console.log("\n✅ Project created successfully!");
      console.log("Project ID:", parsed?.args[0].toString());
    }
  });

task("rating:submit", "Submit a rating for a project")
  .addParam("project", "Project ID")
  .addParam("scores", "Comma-separated scores (e.g., 5,4,3)")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const deployment = await hre.deployments.get("RatingManager");
    const contract = await hre.ethers.getContractAt("RatingManager", deployment.address);
    const [signer] = await hre.ethers.getSigners();
    
    const projectId = parseInt(taskArgs.project);
    const scores = taskArgs.scores.split(",").map((s: string) => parseInt(s.trim()));
    
    console.log("Submitting rating...");
    console.log("- Project ID:", projectId);
    console.log("- Scores:", scores);
    
    // Get project info
    const project = await contract.getProject(projectId);
    console.log("- Project name:", project.name);
    console.log("- Dimensions:", project.dimensions.length);
    
    if (scores.length !== project.dimensions.length) {
      throw new Error(`Score count mismatch. Expected ${project.dimensions.length}, got ${scores.length}`);
    }
    
    // Encrypt scores
    const { createInstance } = await import("@fhevm/mock-utils");
    const instance = await createInstance(signer, hre.ethers, contract);
    
    const input = instance.createEncryptedInput(
      await contract.getAddress(),
      signer.address
    );
    
    for (const score of scores) {
      input.add32(score);
    }
    
    const encrypted = input.encrypt();
    
    console.log("Submitting encrypted rating...");
    const tx = await contract.submitRating(projectId, encrypted.handles);
    await tx.wait();
    
    console.log("\n✅ Rating submitted successfully!");
  });

task("rating:info", "Get information about a project")
  .addParam("project", "Project ID")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const deployment = await hre.deployments.get("RatingManager");
    const contract = await hre.ethers.getContractAt("RatingManager", deployment.address);
    
    const projectId = parseInt(taskArgs.project);
    const project = await contract.getProject(projectId);
    const ratingCount = await contract.getProjectRatingCount(projectId);
    
    console.log("\n📊 Project Information");
    console.log("======================");
    console.log("Project ID:", projectId);
    console.log("Name:", project.name);
    console.log("Description:", project.description);
    console.log("Creator:", project.creator);
    console.log("Dimensions:", project.dimensions.join(", "));
    console.log("Scale: 1 -", project.scaleMax);
    console.log("End time:", new Date(Number(project.endTime) * 1000).toISOString());
    console.log("Allow multiple:", project.allowMultiple);
    console.log("Ended:", project.ended);
    console.log("Rating count:", ratingCount.toString());
    console.log();
  });

task("rating:list", "List all projects")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const deployment = await hre.deployments.get("RatingManager");
    const contract = await hre.ethers.getContractAt("RatingManager", deployment.address);
    const count = await contract.projectCount();
    
    console.log("\n📋 Rating Projects");
    console.log("==================");
    console.log(`Total projects: ${count}\n`);
    
    for (let i = 0; i < count; i++) {
      const project = await contract.getProject(i);
      const ratingCount = await contract.getProjectRatingCount(i);
      const status = project.ended || Date.now() / 1000 > Number(project.endTime) ? "ENDED" : "ACTIVE";
      
      console.log(`[${i}] ${project.name}`);
      console.log(`    Status: ${status}`);
      console.log(`    Creator: ${project.creator}`);
      console.log(`    Ratings: ${ratingCount}`);
      console.log(`    Dimensions: ${project.dimensions.length}`);
      console.log();
    }
  });

task("rating:end", "End a project early")
  .addParam("project", "Project ID")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const contract = await hre.ethers.getContract("RatingManager");
    const projectId = parseInt(taskArgs.project);
    
    console.log(`Ending project ${projectId}...`);
    
    const tx = await contract.endProject(projectId);
    await tx.wait();
    
    console.log("✅ Project ended successfully!");
  });

task("rating:allow-decrypt", "Allow creator to decrypt all ratings")
  .addParam("project", "Project ID")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const contract = await hre.ethers.getContract("RatingManager");
    const projectId = parseInt(taskArgs.project);
    
    console.log(`Authorizing decryption for project ${projectId}...`);
    
    const tx = await contract.allowCreatorDecryptAll(projectId);
    await tx.wait();
    
    console.log("✅ Decryption authorized!");
    console.log("You can now decrypt ratings using the FHEVM SDK");
  });


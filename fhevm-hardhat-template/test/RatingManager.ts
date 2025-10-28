import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { RatingManager } from "../types";
import { expect } from "chai";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

describe("RatingManager", function () {
  let signers: Signers;
  let ratingManager: RatingManager;
  let ratingManagerAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { 
      deployer: ethSigners[0], 
      alice: ethSigners[1], 
      bob: ethSigners[2],
      charlie: ethSigners[3]
    };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    await deployments.fixture(["RatingManager"]);
    const deployment = await deployments.get("RatingManager");
    ratingManager = await ethers.getContractAt("RatingManager", deployment.address) as unknown as RatingManager;
    ratingManagerAddress = await ratingManager.getAddress();
  });

  describe("Project Creation", function () {
    it("should create a rating project successfully", async function () {
      const dimensions = ["Quality", "Service", "Value"];
      const endTime = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
      
      const tx = await ratingManager.connect(signers.alice).createRatingProject(
        "Product Review",
        "Review our new product",
        dimensions,
        5, // 1-5 stars
        endTime,
        false // no multiple ratings
      );
      
      await expect(tx).to.emit(ratingManager, "RatingProjectCreated")
        .withArgs(0, signers.alice.address, "Product Review", 3, endTime);
      
      const project = await ratingManager.getProject(0);
      expect(project.name).to.equal("Product Review");
      expect(project.creator).to.equal(signers.alice.address);
      expect(project.dimensions.length).to.equal(3);
      expect(project.scaleMax).to.equal(5);
    });

    it("should reject invalid dimension count", async function () {
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      
      await expect(
        ratingManager.connect(signers.alice).createRatingProject(
          "Test",
          "Test",
          [], // Empty dimensions
          5,
          endTime,
          false
        )
      ).to.be.revertedWithCustomError(ratingManager, "InvalidDimensions");
    });

    it("should reject invalid scale", async function () {
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      
      await expect(
        ratingManager.connect(signers.alice).createRatingProject(
          "Test",
          "Test",
          ["Quality"],
          1, // Too small
          endTime,
          false
        )
      ).to.be.revertedWithCustomError(ratingManager, "InvalidScale");
    });

    it("should reject past end time", async function () {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      
      await expect(
        ratingManager.connect(signers.alice).createRatingProject(
          "Test",
          "Test",
          ["Quality"],
          5,
          pastTime,
          false
        )
      ).to.be.revertedWithCustomError(ratingManager, "InvalidEndTime");
    });
  });

  describe("Rating Submission", function () {
    let projectId: number;
    const endTime = Math.floor(Date.now() / 1000) + 86400;

    beforeEach(async function () {
      const tx = await ratingManager.connect(signers.alice).createRatingProject(
        "Product Review",
        "Review our new product",
        ["Quality", "Service", "Value"],
        5,
        endTime,
        false
      );
      await tx.wait();
      projectId = 0;
    });

    it("should submit encrypted ratings successfully", async function () {
      // Encrypt ratings: Quality=5, Service=4, Value=3
      const encryptedInput = await fhevm
        .createEncryptedInput(ratingManagerAddress, signers.bob.address)
        .add32(5)
        .add32(4)
        .add32(3)
        .encrypt();
      
      const tx = await ratingManager.connect(signers.bob).submitRating(
        projectId,
        encryptedInput.handles,
        encryptedInput.inputProof
      );
      
      await expect(tx).to.emit(ratingManager, "RatingSubmitted");
      
      const project = await ratingManager.getProject(projectId);
      expect(project.ratingCount).to.equal(1);
      
      const hasRated = await ratingManager.hasRated(projectId, signers.bob.address);
      expect(hasRated).to.be.true;
    });

    it("should prevent double rating when not allowed", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(ratingManagerAddress, signers.bob.address)
        .add32(5)
        .add32(4)
        .add32(3)
        .encrypt();
      
      // First rating
      await ratingManager.connect(signers.bob).submitRating(
        projectId,
        encryptedInput.handles,
        encryptedInput.inputProof
      );
      
      // Second rating should fail
      await expect(
        ratingManager.connect(signers.bob).submitRating(
          projectId,
          encryptedInput.handles,
          encryptedInput.inputProof
        )
      ).to.be.revertedWithCustomError(ratingManager, "AlreadyRated");
    });

    it("should allow multiple ratings when enabled", async function () {
      // Create project with allowMultiple = true
      const tx = await ratingManager.connect(signers.alice).createRatingProject(
        "Multi-Rating Project",
        "Multiple ratings allowed",
        ["Quality"],
        5,
        endTime,
        true // Allow multiple
      );
      await tx.wait();
      const multiProjectId = 1;
      
      const enc1 = await fhevm
        .createEncryptedInput(ratingManagerAddress, signers.bob.address)
        .add32(5)
        .encrypt();
      
      const enc2 = await fhevm
        .createEncryptedInput(ratingManagerAddress, signers.bob.address)
        .add32(3)
        .encrypt();
      
      // Both should succeed
      await ratingManager.connect(signers.bob).submitRating(multiProjectId, enc1.handles, enc1.inputProof);
      await ratingManager.connect(signers.bob).submitRating(multiProjectId, enc2.handles, enc2.inputProof);
      
      const project = await ratingManager.getProject(multiProjectId);
      expect(project.ratingCount).to.equal(2);
    });

    it("should reject dimension mismatch", async function () {
      // Only 2 dimensions instead of 3
      const encryptedInput = await fhevm
        .createEncryptedInput(ratingManagerAddress, signers.bob.address)
        .add32(5)
        .add32(4)
        .encrypt();
      
      await expect(
        ratingManager.connect(signers.bob).submitRating(
          projectId,
          encryptedInput.handles,
          encryptedInput.inputProof
        )
      ).to.be.revertedWithCustomError(ratingManager, "DimensionMismatch");
    });
  });

  describe("Decryption Authorization", function () {
    let projectId: number;
    const endTime = Math.floor(Date.now() / 1000) + 86400;

    beforeEach(async function () {
      // Create project
      await ratingManager.connect(signers.alice).createRatingProject(
        "Product Review",
        "Review",
        ["Quality", "Service"],
        5,
        endTime,
        false
      );
      projectId = 0;
      
      // Bob submits rating
      const encryptedInput = await fhevm
        .createEncryptedInput(ratingManagerAddress, signers.bob.address)
        .add32(5)
        .add32(4)
        .encrypt();
      
      await ratingManager.connect(signers.bob).submitRating(
        projectId,
        encryptedInput.handles,
        encryptedInput.inputProof
      );
    });

    it("should allow creator to decrypt all ratings", async function () {
      const tx = await ratingManager.connect(signers.alice).allowCreatorDecryptAll(projectId);
      await tx.wait();
      
      // Creator should now be able to decrypt
      // (Actual decryption happens off-chain via FHEVM SDK)
      expect(tx).to.not.be.reverted;
    });

    it("should allow creator to decrypt specific dimension", async function () {
      const tx = await ratingManager.connect(signers.alice).allowCreatorDecryptDimension(
        projectId,
        0 // First dimension
      );
      await tx.wait();
      
      expect(tx).to.not.be.reverted;
    });

    it("should prevent non-creator from decrypting", async function () {
      await expect(
        ratingManager.connect(signers.bob).allowCreatorDecryptAll(projectId)
      ).to.be.revertedWithCustomError(ratingManager, "Unauthorized");
    });

    it("should allow user to decrypt own rating", async function () {
      const tx = await ratingManager.connect(signers.bob).allowUserDecryptOwnRating(projectId);
      await tx.wait();
      
      expect(tx).to.not.be.reverted;
    });

    it("should prevent non-rater from decrypting", async function () {
      await expect(
        ratingManager.connect(signers.charlie).allowUserDecryptOwnRating(projectId)
      ).to.be.revertedWithCustomError(ratingManager, "Unauthorized");
    });
  });

  describe("Project Management", function () {
    let projectId: number;
    const endTime = Math.floor(Date.now() / 1000) + 86400;

    beforeEach(async function () {
      await ratingManager.connect(signers.alice).createRatingProject(
        "Product Review",
        "Review",
        ["Quality"],
        5,
        endTime,
        false
      );
      projectId = 0;
    });

    it("should allow creator to end project early", async function () {
      const tx = await ratingManager.connect(signers.alice).endProject(projectId);
      
      await expect(tx).to.emit(ratingManager, "ProjectEnded").withArgs(projectId);
      
      const project = await ratingManager.getProject(projectId);
      expect(project.ended).to.be.true;
    });

    it("should prevent non-creator from ending project", async function () {
      await expect(
        ratingManager.connect(signers.bob).endProject(projectId)
      ).to.be.revertedWithCustomError(ratingManager, "Unauthorized");
    });

    it("should prevent rating on ended project", async function () {
      await ratingManager.connect(signers.alice).endProject(projectId);
      
      const encryptedInput = await fhevm
        .createEncryptedInput(ratingManagerAddress, signers.bob.address)
        .add32(5)
        .encrypt();
      
      await expect(
        ratingManager.connect(signers.bob).submitRating(projectId, encryptedInput.handles, encryptedInput.inputProof)
      ).to.be.revertedWithCustomError(ratingManager, "ProjectAlreadyEnded");
    });
  });

  describe("Query Functions", function () {
    let projectId: number;

    beforeEach(async function () {
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      await ratingManager.connect(signers.alice).createRatingProject(
        "Product Review",
        "Review",
        ["Quality", "Service"],
        5,
        endTime,
        false
      );
      projectId = 0;
    });

    it("should return correct project count", async function () {
      const count = await ratingManager.projectCount();
      expect(count).to.equal(1);
    });

    it("should return correct rating count", async function () {
      // Submit 2 ratings
      for (const signer of [signers.bob, signers.charlie]) {
        const encryptedInput = await fhevm
          .createEncryptedInput(ratingManagerAddress, signer.address)
          .add32(5)
          .add32(4)
          .encrypt();
        
        await ratingManager.connect(signer).submitRating(
          projectId,
          encryptedInput.handles,
          encryptedInput.inputProof
        );
      }
      
      const count = await ratingManager.getProjectRatingCount(projectId);
      expect(count).to.equal(2);
    });

    it("should check if user has rated", async function () {
      expect(await ratingManager.userHasRated(projectId, signers.bob.address)).to.be.false;
      
      const encryptedInput = await fhevm
        .createEncryptedInput(ratingManagerAddress, signers.bob.address)
        .add32(5)
        .add32(4)
        .encrypt();
      
      await ratingManager.connect(signers.bob).submitRating(
        projectId,
        encryptedInput.handles,
        encryptedInput.inputProof
      );
      
      expect(await ratingManager.userHasRated(projectId, signers.bob.address)).to.be.true;
    });
  });
});

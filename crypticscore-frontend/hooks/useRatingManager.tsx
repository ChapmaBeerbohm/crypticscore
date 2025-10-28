"use client";

import { useCallback, useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "./useWallet";
import { useFhevm } from "./useFhevm";
import { RatingManagerABI } from "@/abi/RatingManagerABI";
import { RatingManagerAddresses } from "@/abi/RatingManagerAddresses";

export type RatingProject = {
  projectId: number;
  creator: string;
  name: string;
  description: string;
  dimensions: string[];
  scaleMax: number;
  endTime: number;
  allowMultiple: boolean;
  ended: boolean;
  ratingCount: number;
};

export function useRatingManager() {
  const { account, chainId, signer, provider } = useWallet();
  const { instance: fhevmInstance, isLoading: fhevmLoading } = useFhevm();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);

  // Initialize contract
  useEffect(() => {
    if (!chainId || !provider) {
      setContract(null);
      setContractAddress(null);
      return;
    }

    const addresses = RatingManagerAddresses[chainId.toString() as keyof typeof RatingManagerAddresses];
    if (!addresses || addresses.address === ethers.ZeroAddress) {
      console.warn(`RatingManager not deployed on chain ${chainId}`);
      setContract(null);
      setContractAddress(null);
      return;
    }

    const addr = addresses.address;
    const contractInstance = new ethers.Contract(
      addr,
      RatingManagerABI.abi,
      signer || provider
    );

    setContract(contractInstance);
    setContractAddress(addr);
  }, [chainId, provider, signer]);

  /**
   * Create a new rating project
   */
  const createProject = useCallback(
    async (params: {
      name: string;
      description: string;
      dimensions: string[];
      scaleMax: number;
      endTime: number;
      allowMultiple: boolean;
    }) => {
      if (!contract || !signer) {
        throw new Error("Contract or signer not available");
      }

      try {
        const tx = await contract.createRatingProject(
          params.name,
          params.description,
          params.dimensions,
          params.scaleMax,
          params.endTime,
          params.allowMultiple
        );

        const receipt = await tx.wait();
        
        // Extract project ID from event
        const event = receipt.logs.find((log: any) => {
          try {
            return contract.interface.parseLog(log)?.name === "RatingProjectCreated";
          } catch {
            return false;
          }
        });

        if (event) {
          const parsed = contract.interface.parseLog(event);
          return { 
            success: true, 
            projectId: Number(parsed?.args[0]), 
            txHash: receipt.hash 
          };
        }

        return { success: true, txHash: receipt.hash };
      } catch (error: any) {
        console.error("Create project failed:", error);
        throw new Error(error.message || "Failed to create project");
      }
    },
    [contract, signer]
  );

  /**
   * Submit encrypted rating
   */
  const submitRating = useCallback(
    async (projectId: number, scores: number[]) => {
      if (!contract || !signer || !fhevmInstance || !contractAddress) {
        throw new Error("Required components not available");
      }

      try {
        const userAddress = await signer.getAddress();

        // Create encrypted input
        const input = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
        
        // Add all scores
        for (const score of scores) {
          input.add32(score);
        }

        // Encrypt
        const encrypted = await input.encrypt();

        // Submit to contract
        const tx = await contract.submitRating(
          projectId,
          encrypted.handles,
          encrypted.inputProof
        );

        const receipt = await tx.wait();
        
        return { success: true, txHash: receipt.hash };
      } catch (error: any) {
        console.error("Submit rating failed:", error);
        throw new Error(error.message || "Failed to submit rating");
      }
    },
    [contract, signer, fhevmInstance, contractAddress]
  );

  /**
   * Get project details
   */
  const getProject = useCallback(
    async (projectId: number): Promise<RatingProject | null> => {
      if (!contract) return null;

      try {
        const project = await contract.getProject(projectId);
        
        return {
          projectId: Number(project.projectId),
          creator: project.creator,
          name: project.name,
          description: project.description,
          dimensions: project.dimensions,
          scaleMax: Number(project.scaleMax),
          endTime: Number(project.endTime),
          allowMultiple: project.allowMultiple,
          ended: project.ended,
          ratingCount: Number(project.ratingCount),
        };
      } catch (error) {
        console.error("Get project failed:", error);
        return null;
      }
    },
    [contract]
  );

  /**
   * Get project count
   */
  const getProjectCount = useCallback(async (): Promise<number> => {
    if (!contract) return 0;

    try {
      const count = await contract.projectCount();
      return Number(count);
    } catch (error) {
      console.error("Get project count failed:", error);
      return 0;
    }
  }, [contract]);

  /**
   * Get all projects
   */
  const getAllProjects = useCallback(async (): Promise<RatingProject[]> => {
    if (!contract) return [];

    try {
      const count = await getProjectCount();
      const projects: RatingProject[] = [];

      for (let i = 0; i < count; i++) {
        const project = await getProject(i);
        if (project) {
          projects.push(project);
        }
      }

      return projects;
    } catch (error) {
      console.error("Get all projects failed:", error);
      return [];
    }
  }, [contract, getProjectCount, getProject]);

  /**
   * Get projects created by user
   */
  const getUserCreatedProjects = useCallback(
    async (userAddress?: string): Promise<RatingProject[]> => {
      const targetAddress = userAddress || account;
      if (!targetAddress) return [];

      const allProjects = await getAllProjects();
      return allProjects.filter(
        (p) => p.creator.toLowerCase() === targetAddress.toLowerCase()
      );
    },
    [account, getAllProjects]
  );

  /**
   * Check if user has rated a project
   */
  const hasUserRated = useCallback(
    async (projectId: number, userAddress?: string): Promise<boolean> => {
      if (!contract) return false;

      const targetAddress = userAddress || account;
      if (!targetAddress) return false;

      try {
        return await contract.userHasRated(projectId, targetAddress);
      } catch (error) {
        console.error("Check has rated failed:", error);
        return false;
      }
    },
    [contract, account]
  );

  /**
   * Get rating count for a project
   */
  const getRatingCount = useCallback(
    async (projectId: number): Promise<number> => {
      if (!contract) return 0;

      try {
        const count = await contract.getProjectRatingCount(projectId);
        return Number(count);
      } catch (error) {
        console.error("Get rating count failed:", error);
        return 0;
      }
    },
    [contract]
  );

  /**
   * Allow creator to decrypt all ratings
   */
  const allowCreatorDecryptAll = useCallback(
    async (projectId: number) => {
      if (!contract || !signer) {
        throw new Error("Contract or signer not available");
      }

      try {
        const tx = await contract.allowCreatorDecryptAll(projectId);
        const receipt = await tx.wait();
        
        return { success: true, txHash: receipt.hash };
      } catch (error: any) {
        console.error("Allow decrypt failed:", error);
        throw new Error(error.message || "Failed to authorize decryption");
      }
    },
    [contract, signer]
  );

  /**
   * Allow user to decrypt their own rating
   */
  const allowUserDecryptOwn = useCallback(
    async (projectId: number) => {
      if (!contract || !signer) {
        throw new Error("Contract or signer not available");
      }

      try {
        const tx = await contract.allowUserDecryptOwnRating(projectId);
        const receipt = await tx.wait();
        
        return { success: true, txHash: receipt.hash };
      } catch (error: any) {
        console.error("Allow user decrypt failed:", error);
        throw new Error(error.message || "Failed to authorize decryption");
      }
    },
    [contract, signer]
  );

  /**
   * Get encrypted rating score handle
   */
  const getRatingScore = useCallback(
    async (
      projectId: number,
      ratingIndex: number,
      dimensionIndex: number
    ): Promise<string | null> => {
      if (!contract) return null;

      try {
        const score = await contract.getRatingScore(
          projectId,
          ratingIndex,
          dimensionIndex
        );
        return score;
      } catch (error) {
        console.error("Get rating score failed:", error);
        return null;
      }
    },
    [contract]
  );

  /**
   * End a project early
   */
  const endProject = useCallback(
    async (projectId: number) => {
      if (!contract || !signer) {
        throw new Error("Contract or signer not available");
      }

      try {
        const tx = await contract.endProject(projectId);
        const receipt = await tx.wait();
        
        return { success: true, txHash: receipt.hash };
      } catch (error: any) {
        console.error("End project failed:", error);
        throw new Error(error.message || "Failed to end project");
      }
    },
    [contract, signer]
  );

  return {
    contract,
    contractAddress,
    isReady: !!contract && !fhevmLoading,
    createProject,
    submitRating,
    getProject,
    getProjectCount,
    getAllProjects,
    getUserCreatedProjects,
    hasUserRated,
    getRatingCount,
    allowCreatorDecryptAll,
    allowUserDecryptOwn,
    getRatingScore,
    endProject,
  };
}



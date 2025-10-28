"use client";

import { useCallback, useState } from "react";
import { useFhevm } from "./useFhevm";
import { useWallet } from "./useWallet";
import { useRatingManager } from "./useRatingManager";

export type DecryptedRating = {
  ratingIndex: number;
  scores: number[];
};

export function useDecryption() {
  const { instance: fhevmInstance, getDecryptionSignature } = useFhevm();
  const { signer } = useWallet();
  const { contractAddress, getRatingScore, getRatingCount } = useRatingManager();
  const [isDecrypting, setIsDecrypting] = useState(false);

  /**
   * Decrypt a single score
   */
  const decryptScore = useCallback(
    async (handle: string): Promise<number | null> => {
      if (!fhevmInstance || !signer || !contractAddress) {
        console.error("Required components not available");
        return null;
      }

      try {
        const signature = await getDecryptionSignature(
          [contractAddress as `0x${string}`],
          signer
        );

        if (!signature) {
          console.error("Failed to get decryption signature");
          return null;
        }

        const result = await fhevmInstance.userDecrypt(
          [{ handle, contractAddress }],
          signature.privateKey,
          signature.publicKey,
          signature.signature,
          signature.contractAddresses,
          signature.userAddress,
          signature.startTimestamp,
          signature.durationDays
        );

        const decrypted = result[handle];
        return typeof decrypted === "bigint" ? Number(decrypted) : null;
      } catch (error) {
        console.error("Decrypt score failed:", error);
        return null;
      }
    },
    [fhevmInstance, signer, contractAddress, getDecryptionSignature]
  );

  /**
   * Decrypt multiple scores in batch
   */
  const batchDecrypt = useCallback(
    async (handles: string[]): Promise<Record<string, number>> => {
      if (!fhevmInstance || !signer || !contractAddress) {
        console.error("Required components not available");
        return {};
      }

      try {
        const signature = await getDecryptionSignature(
          [contractAddress as `0x${string}`],
          signer
        );

        if (!signature) {
          console.error("Failed to get decryption signature");
          return {};
        }

        const handleObjs = handles.map((handle) => ({ handle, contractAddress }));

        const result = await fhevmInstance.userDecrypt(
          handleObjs,
          signature.privateKey,
          signature.publicKey,
          signature.signature,
          signature.contractAddresses,
          signature.userAddress,
          signature.startTimestamp,
          signature.durationDays
        );

        // Convert bigints to numbers
        const decrypted: Record<string, number> = {};
        for (const [handle, value] of Object.entries(result)) {
          decrypted[handle] = typeof value === "bigint" ? Number(value) : 0;
        }

        return decrypted;
      } catch (error) {
        console.error("Batch decrypt failed:", error);
        return {};
      }
    },
    [fhevmInstance, signer, contractAddress, getDecryptionSignature]
  );

  /**
   * Decrypt all ratings for a project (creator only)
   */
  const decryptProjectRatings = useCallback(
    async (
      projectId: number,
      dimensionCount: number
    ): Promise<DecryptedRating[]> => {
      if (!getRatingScore || !getRatingCount) {
        console.error("Rating manager not available");
        return [];
      }

      setIsDecrypting(true);

      try {
        const totalRatings = await getRatingCount(projectId);
        const allHandles: string[] = [];
        const handleMap: Map<string, { ratingIndex: number; dimensionIndex: number }> = new Map();

        // Collect all handles
        for (let ratingIdx = 0; ratingIdx < totalRatings; ratingIdx++) {
          for (let dimIdx = 0; dimIdx < dimensionCount; dimIdx++) {
            const handle = await getRatingScore(projectId, ratingIdx, dimIdx);
            if (handle) {
              allHandles.push(handle);
              handleMap.set(handle, { ratingIndex: ratingIdx, dimensionIndex: dimIdx });
            }
          }
        }

        if (allHandles.length === 0) {
          return [];
        }

        // Batch decrypt
        const decrypted = await batchDecrypt(allHandles);

        // Organize by rating index
        const ratings: Map<number, number[]> = new Map();
        
        for (const [handle, value] of Object.entries(decrypted)) {
          const info = handleMap.get(handle);
          if (info) {
            if (!ratings.has(info.ratingIndex)) {
              ratings.set(info.ratingIndex, new Array(dimensionCount).fill(0));
            }
            const scores = ratings.get(info.ratingIndex)!;
            scores[info.dimensionIndex] = value;
          }
        }

        // Convert to array
        const result: DecryptedRating[] = [];
        ratings.forEach((scores, ratingIndex) => {
          result.push({ ratingIndex, scores });
        });

        return result;
      } catch (error) {
        console.error("Decrypt project ratings failed:", error);
        return [];
      } finally {
        setIsDecrypting(false);
      }
    },
    [getRatingScore, getRatingCount, batchDecrypt]
  );

  /**
   * Calculate statistics from decrypted ratings
   */
  const calculateStatistics = useCallback(
    (ratings: DecryptedRating[], dimensionCount: number) => {
      if (ratings.length === 0) {
        return {
          averages: new Array(dimensionCount).fill(0),
          stdDevs: new Array(dimensionCount).fill(0),
          totals: new Array(dimensionCount).fill(0),
          count: 0,
        };
      }

      const sums = new Array(dimensionCount).fill(0);
      const counts = new Array(dimensionCount).fill(0);

      // Calculate sums
      for (const rating of ratings) {
        for (let i = 0; i < rating.scores.length && i < dimensionCount; i++) {
          sums[i] += rating.scores[i];
          counts[i]++;
        }
      }

      // Calculate averages
      const averages = sums.map((sum, i) => (counts[i] > 0 ? sum / counts[i] : 0));

      // Calculate standard deviations
      const variances = new Array(dimensionCount).fill(0);
      for (const rating of ratings) {
        for (let i = 0; i < rating.scores.length && i < dimensionCount; i++) {
          const diff = rating.scores[i] - averages[i];
          variances[i] += diff * diff;
        }
      }
      
      const stdDevs = variances.map((variance, i) =>
        counts[i] > 0 ? Math.sqrt(variance / counts[i]) : 0
      );

      return {
        averages,
        stdDevs,
        totals: sums,
        count: ratings.length,
      };
    },
    []
  );

  return {
    decryptScore,
    batchDecrypt,
    decryptProjectRatings,
    calculateStatistics,
    isDecrypting,
  };
}


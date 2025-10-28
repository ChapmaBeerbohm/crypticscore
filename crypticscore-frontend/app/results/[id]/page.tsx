"use client";

import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { useRatingManager, RatingProject } from "@/hooks/useRatingManager";
import { useDecryption } from "@/hooks/useDecryption";
import { StatisticsCharts } from "@/components/StatisticsCharts";
import { formatTime, shortenAddress } from "@/lib/utils";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { account } = useWallet();
  const {
    getProject,
    allowCreatorDecryptAll,
    isReady,
  } = useRatingManager();
  const {
    decryptProjectRatings,
    calculateStatistics,
    isDecrypting,
  } = useDecryption();

  const [project, setProject] = useState<RatingProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decrypted, setDecrypted] = useState(false);
  const [statistics, setStatistics] = useState<{
    averages: number[];
    stdDevs: number[];
    totals: number[];
    count: number;
  } | null>(null);
  const [authorizing, setAuthorizing] = useState(false);

  const projectId = Number(params.id);
  const isCreator = project && account && 
    project.creator.toLowerCase() === account.toLowerCase();

  // Load project
  useEffect(() => {
    if (!isReady) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const proj = await getProject(projectId);
        if (!proj) {
          setError("Project not found");
          return;
        }

        setProject(proj);
      } catch (err: any) {
        setError(err.message || "Failed to load project");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [projectId, isReady, getProject]);

  // Handle authorization and decryption
  const handleDecrypt = async () => {
    if (!project || !isCreator) return;

    try {
      setAuthorizing(true);
      setError(null);

      // First authorize decryption
      await allowCreatorDecryptAll(projectId);

      // Then decrypt all ratings
      const ratings = await decryptProjectRatings(
        projectId,
        project.dimensions.length
      );

      if (ratings.length === 0) {
        setError("No ratings to decrypt");
        return;
      }

      // Calculate statistics
      const stats = calculateStatistics(ratings, project.dimensions.length);
      setStatistics(stats);
      setDecrypted(true);
    } catch (err: any) {
      console.error("Decrypt failed:", err);
      setError(err.message || "Failed to decrypt ratings");
    } finally {
      setAuthorizing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="glass-card text-center">
          <div className="text-red-500 mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => router.push("/participate")} className="btn-primary">
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* Project Header */}
      <div className="glass-card mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
            <p className="text-gray-600 dark:text-gray-300">
              {project.description}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Project #{projectId}</div>
            <div
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                project.ended || Date.now() / 1000 > project.endTime
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
              }`}
            >
              {project.ended || Date.now() / 1000 > project.endTime
                ? "Ended"
                : "Active"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <div className="text-sm text-gray-500">Creator</div>
            <div className="font-medium">{shortenAddress(project.creator)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Dimensions</div>
            <div className="font-medium">{project.dimensions.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Rating Scale</div>
            <div className="font-medium">1 - {project.scaleMax}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Total Ratings</div>
            <div className="font-medium">{project.ratingCount}</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500">End Time</div>
          <div className="font-medium">{formatTime(project.endTime)}</div>
        </div>
      </div>

      {/* Dimensions List */}
      <div className="glass-card mb-8">
        <h2 className="text-2xl font-semibold mb-4">Rating Dimensions</h2>
        <div className="flex flex-wrap gap-2">
          {project.dimensions.map((dim, i) => (
            <div
              key={i}
              className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg"
            >
              {dim}
            </div>
          ))}
        </div>
      </div>

      {/* Decryption Section */}
      {!isCreator && (
        <div className="glass-card text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-2xl font-semibold mb-2">
            Creator-Only Access
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Only the project creator can decrypt and view rating statistics.
          </p>
        </div>
      )}

      {isCreator && !decrypted && (
        <div className="glass-card text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-2xl font-semibold mb-2">
            Decrypt Rating Results
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Click the button below to authorize decryption and view statistical
            analysis of all {project.ratingCount} ratings.
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleDecrypt}
            disabled={authorizing || isDecrypting || project.ratingCount === 0}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {authorizing
              ? "Authorizing..."
              : isDecrypting
              ? "Decrypting..."
              : "Decrypt & View Results"}
          </button>

          {project.ratingCount === 0 && (
            <p className="text-sm text-gray-500 mt-4">
              No ratings submitted yet
            </p>
          )}
        </div>
      )}

      {/* Statistics Charts */}
      {isCreator && decrypted && statistics && (
        <div className="fade-in">
          <div className="glass-card mb-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">✅</div>
              <h2 className="text-2xl font-semibold">
                Decryption Successful!
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Analyzed {statistics.count} ratings
              </p>
            </div>
          </div>

          <StatisticsCharts
            dimensions={project.dimensions}
            averages={statistics.averages}
            stdDevs={statistics.stdDevs}
            scaleMax={project.scaleMax}
          />
        </div>
      )}
    </div>
  );
}


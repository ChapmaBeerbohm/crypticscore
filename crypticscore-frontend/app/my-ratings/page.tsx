"use client";

import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { useRatingManager, RatingProject } from "@/hooks/useRatingManager";
import { formatTime, formatCountdown } from "@/lib/utils";

type RatedProject = RatingProject & {
  hasRated: boolean;
};

export default function MyRatingsPage() {
  const { account } = useWallet();
  const { getAllProjects, hasUserRated, isReady } = useRatingManager();
  const [projects, setProjects] = useState<RatedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady || !account) return;

    const load = async () => {
      try {
        setLoading(true);
        const allProjects = await getAllProjects();
        
        // Filter projects where user has rated
        const ratedProjects: RatedProject[] = [];
        for (const proj of allProjects) {
          const rated = await hasUserRated(proj.projectId, account);
          if (rated) {
            ratedProjects.push({ ...proj, hasRated: true });
          }
        }

        setProjects(ratedProjects);
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isReady, account, getAllProjects, hasUserRated]);

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-gray-600">Please connect your wallet to view your ratings.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your ratings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">My Ratings</h1>
        <Link href="/participate" className="btn-primary">
          Rate More Projects
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="glass-card text-center">
          <div className="text-4xl mb-4">⭐</div>
          <h2 className="text-2xl font-semibold mb-2">No Ratings Yet</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            You haven&apos;t rated any projects yet. Start rating to participate!
          </p>
          <Link href="/participate" className="btn-primary inline-block">
            Browse Projects
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const now = Date.now() / 1000;
            const isActive = !project.ended && now <= project.endTime;

            return (
              <div key={project.projectId} className="glass-card fade-in">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold">{project.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 font-medium">
                    <span>✓</span>
                    <span>Rated</span>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                  {project.description || "No description"}
                </p>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Project ID:</span>
                    <span className="font-medium">#{project.projectId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dimensions:</span>
                    <span className="font-medium">{project.dimensions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Ratings:</span>
                    <span className="font-medium">{project.ratingCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span
                      className={`font-medium ${
                        isActive ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      {isActive ? "Active" : "Ended"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      {isActive ? "Ends in:" : "Ended:"}
                    </span>
                    <span className="font-medium">
                      {formatCountdown(project.endTime)}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 mb-2">Dimensions:</div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {project.dimensions.map((dim, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs"
                      >
                        {dim}
                      </span>
                    ))}
                  </div>

                  {!isActive && (
                    <Link
                      href={`/results/${project.projectId}`}
                      className="btn-secondary w-full text-center text-sm"
                    >
                      View Results
                    </Link>
                  )}
                  {isActive && (
                    <div className="text-center text-sm text-gray-500">
                      Results available after project ends
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

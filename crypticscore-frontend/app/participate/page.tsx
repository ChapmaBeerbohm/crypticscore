"use client";

import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { useRatingManager, RatingProject } from "@/hooks/useRatingManager";
import { formatCountdown, shortenAddress } from "@/lib/utils";

export default function ParticipatePage() {
  const { account } = useWallet();
  const { getAllProjects, hasUserRated, isReady } = useRatingManager();
  const [projects, setProjects] = useState<RatingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "ended">("active");
  const [userRatings, setUserRatings] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!isReady) return;

    const load = async () => {
      try {
        setLoading(true);
        const allProjects = await getAllProjects();
        setProjects(allProjects);

        // Check which projects user has rated
        if (account) {
          const ratings: Record<number, boolean> = {};
          for (const proj of allProjects) {
            const rated = await hasUserRated(proj.projectId, account);
            ratings[proj.projectId] = rated;
          }
          setUserRatings(ratings);
        }
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isReady, getAllProjects, hasUserRated, account]);

  const filteredProjects = projects.filter((p) => {
    const now = Date.now() / 1000;
    const isActive = !p.ended && now <= p.endTime;

    if (filter === "active") return isActive;
    if (filter === "ended") return !isActive;
    return true;
  });

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-gray-600">
          Please connect your wallet to participate in ratings.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Participate in Ratings</h1>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === "all"
                ? "bg-primary text-white"
                : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === "active"
                ? "bg-primary text-white"
                : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("ended")}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === "ended"
                ? "bg-primary text-white"
                : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Ended
          </button>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="glass-card text-center">
          <div className="text-4xl mb-4">📭</div>
          <h2 className="text-2xl font-semibold mb-2">No Projects Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {filter === "active"
              ? "There are no active rating projects at the moment."
              : filter === "ended"
              ? "No ended projects yet."
              : "No rating projects have been created yet."}
          </p>
          <Link href="/create" className="btn-primary inline-block">
            Create First Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const now = Date.now() / 1000;
            const isActive = !project.ended && now <= project.endTime;
            const hasRated = userRatings[project.projectId];

            return (
              <div key={project.projectId} className="glass-card fade-in">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold">{project.name}</h3>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isActive
                        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {isActive ? "Active" : "Ended"}
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                  {project.description || "No description"}
                </p>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Creator:</span>
                    <span className="font-medium">
                      {shortenAddress(project.creator)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dimensions:</span>
                    <span className="font-medium">{project.dimensions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Scale:</span>
                    <span className="font-medium">1 - {project.scaleMax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ratings:</span>
                    <span className="font-medium">{project.ratingCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      {isActive ? "Ends in:" : "Ended"}
                    </span>
                    <span className="font-medium">
                      {isActive
                        ? formatCountdown(project.endTime)
                        : formatCountdown(project.endTime)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {isActive && !hasRated && (
                    <Link
                      href={`/participate/${project.projectId}`}
                      className="flex-1 btn-primary text-center text-sm"
                    >
                      Rate Now
                    </Link>
                  )}
                  {isActive && hasRated && (
                    <button
                      disabled
                      className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm cursor-not-allowed"
                    >
                      ✓ Already Rated
                    </button>
                  )}
                  {!isActive && (
                    <Link
                      href={`/results/${project.projectId}`}
                      className="flex-1 btn-secondary text-center text-sm"
                    >
                      View Results
                    </Link>
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

"use client";

import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { useRatingManager, RatingProject } from "@/hooks/useRatingManager";
import { formatTime, formatCountdown } from "@/lib/utils";

export default function MyCreationsPage() {
  const { account } = useWallet();
  const { getUserCreatedProjects, endProject, isReady } = useRatingManager();
  const [projects, setProjects] = useState<RatingProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady || !account) return;

    const load = async () => {
      try {
        setLoading(true);
        const userProjects = await getUserCreatedProjects(account);
        setProjects(userProjects);
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isReady, account, getUserCreatedProjects]);

  const handleEndProject = async (projectId: number) => {
    if (!confirm("Are you sure you want to end this project early?")) return;

    try {
      await endProject(projectId);
      // Reload projects
      const userProjects = await getUserCreatedProjects(account!);
      setProjects(userProjects);
    } catch (error: any) {
      alert(error.message || "Failed to end project");
    }
  };

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-gray-600">Please connect your wallet to view your creations.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">My Creations</h1>
        <Link href="/create" className="btn-primary">
          + Create New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="glass-card text-center">
          <div className="text-4xl mb-4">📝</div>
          <h2 className="text-2xl font-semibold mb-2">No Projects Yet</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            You haven&apos;t created any rating projects yet. Create your first one!
          </p>
          <Link href="/create" className="btn-primary inline-block">
            Create First Project
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => {
            const now = Date.now() / 1000;
            const isActive = !project.ended && now <= project.endTime;

            return (
              <div key={project.projectId} className="glass-card fade-in">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-semibold">{project.name}</h3>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isActive
                            ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {isActive ? "Active" : "Ended"}
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      {project.description || "No description"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-500">Project ID</div>
                    <div className="font-medium">#{project.projectId}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Dimensions</div>
                    <div className="font-medium">{project.dimensions.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total Ratings</div>
                    <div className="font-medium">{project.ratingCount}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Created</div>
                    <div className="font-medium text-sm">
                      {formatTime(project.endTime - 7 * 86400)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">
                      {isActive ? "Ends in" : "Ended"}
                    </div>
                    <div className="font-medium">
                      {formatCountdown(project.endTime)}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.dimensions.map((dim, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
                      >
                        {dim}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/results/${project.projectId}`}
                      className="btn-primary text-sm"
                    >
                      View Dashboard
                    </Link>
                    {isActive && (
                      <button
                        onClick={() => handleEndProject(project.projectId)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm"
                      >
                        End Early
                      </button>
                    )}
                    {!isActive && project.ratingCount > 0 && (
                      <Link
                        href={`/results/${project.projectId}`}
                        className="btn-secondary text-sm"
                      >
                        Decrypt Results
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

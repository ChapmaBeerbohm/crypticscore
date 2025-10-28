"use client";

import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { useRatingManager, RatingProject } from "@/hooks/useRatingManager";
import { formatTime, shortenAddress } from "@/lib/utils";

export default function RateProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { account } = useWallet();
  const {
    getProject,
    submitRating,
    hasUserRated,
    isReady,
  } = useRatingManager();

  const [project, setProject] = useState<RatingProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [alreadyRated, setAlreadyRated] = useState(false);

  const projectId = Number(params.id);

  useEffect(() => {
    if (!isReady || !account) return;

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
        setScores(new Array(proj.dimensions.length).fill(Math.floor(proj.scaleMax / 2)));

        // Check if user already rated
        const rated = await hasUserRated(projectId, account);
        setAlreadyRated(rated);

        // Check if project is still active
        const now = Date.now() / 1000;
        if (proj.ended || now > proj.endTime) {
          setError("This project has ended");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load project");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [projectId, isReady, account, getProject, hasUserRated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!project || !account || alreadyRated) return;

    try {
      setSubmitting(true);
      setError(null);

      await submitRating(projectId, scores);

      setSuccess(true);
      setTimeout(() => {
        router.push("/my-ratings");
      }, 2000);
    } catch (err: any) {
      console.error("Submit failed:", err);
      setError(err.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-gray-600">Please connect your wallet to rate this project.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
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

  if (success) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="glass-card text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-3xl font-bold mb-2">Rating Submitted!</h2>
          <p className="text-gray-600 mb-4">
            Your encrypted rating has been recorded on-chain.
          </p>
          <p className="text-sm text-gray-500">Redirecting to My Ratings...</p>
        </div>
      </div>
    );
  }

  if (alreadyRated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="glass-card text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-2xl font-bold mb-2">Already Rated</h2>
          <p className="text-gray-600 mb-4">
            You have already submitted a rating for this project.
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => router.push("/participate")} className="btn-secondary">
              Back to Projects
            </button>
            <button onClick={() => router.push("/my-ratings")} className="btn-primary">
              View My Ratings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Rate Project</h1>

      {/* Project Info */}
      <div className="glass-card mb-8">
        <h2 className="text-2xl font-semibold mb-2">{project.name}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {project.description}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <div className="text-sm text-gray-500">Creator</div>
            <div className="font-medium">{shortenAddress(project.creator)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Rating Scale</div>
            <div className="font-medium">1 - {project.scaleMax}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Dimensions</div>
            <div className="font-medium">{project.dimensions.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">End Time</div>
            <div className="font-medium">{formatTime(project.endTime)}</div>
          </div>
        </div>
      </div>

      {/* Rating Form */}
      <form onSubmit={handleSubmit} className="glass-card">
        <h3 className="text-xl font-semibold mb-6">Your Ratings</h3>

        <div className="space-y-6 mb-8">
          {project.dimensions.map((dimension, i) => (
            <div key={i}>
              <div className="flex justify-between items-center mb-2">
                <label className="font-medium">{dimension}</label>
                <span className="text-2xl font-bold text-primary">
                  {scores[i]}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max={project.scaleMax}
                value={scores[i]}
                onChange={(e) => {
                  const newScores = [...scores];
                  newScores[i] = Number(e.target.value);
                  setScores(newScores);
                }}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>{project.scaleMax}</span>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="text-2xl mr-3">🔒</div>
            <div>
              <div className="font-medium text-blue-900 dark:text-blue-300 mb-1">
                Privacy Protected
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Your ratings will be encrypted using FHEVM before being stored
                on-chain. Only authorized parties can decrypt the results.
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Encrypted Rating"}
        </button>
      </form>
    </div>
  );
}


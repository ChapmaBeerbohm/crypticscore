"use client";

import { useState } from "react";

export const dynamic = "force-dynamic";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { useRatingManager } from "@/hooks/useRatingManager";

export default function CreateRatingPage() {
  const router = useRouter();
  const { account } = useWallet();
  const { createProject, isReady } = useRatingManager();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    scaleMax: 5,
    endDays: 7,
    allowMultiple: false,
  });
  const [dimensions, setDimensions] = useState(["Quality", "Service", "Value"]);

  const handleAddDimension = () => {
    if (dimensions.length < 10) {
      setDimensions([...dimensions, ""]);
    }
  };

  const handleRemoveDimension = (index: number) => {
    if (dimensions.length > 1) {
      setDimensions(dimensions.filter((_, i) => i !== index));
    }
  };

  const handleDimensionChange = (index: number, value: string) => {
    const newDimensions = [...dimensions];
    newDimensions[index] = value;
    setDimensions(newDimensions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account || !isReady) {
      setError("Please connect your wallet");
      return;
    }

    // Validate dimensions
    const validDimensions = dimensions.filter(d => d.trim().length > 0);
    if (validDimensions.length === 0) {
      setError("Please add at least one dimension");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const endTime = Math.floor(Date.now() / 1000) + (formData.endDays * 86400);

      const result = await createProject({
        name: formData.name,
        description: formData.description,
        dimensions: validDimensions,
        scaleMax: formData.scaleMax,
        endTime,
        allowMultiple: formData.allowMultiple,
      });

      if (result.success) {
        router.push("/my-creations");
      }
    } catch (err: any) {
      console.error("Create project failed:", err);
      setError(err.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-gray-600">Please connect your wallet to create a rating project.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Create Rating Project</h1>
      
      <form onSubmit={handleSubmit} className="glass-card space-y-6">
        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-glass"
            placeholder="e.g., Product Review 2024"
            maxLength={50}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.name.length}/50 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input-glass"
            rows={4}
            placeholder="Describe what this rating is for..."
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.length}/500 characters
          </p>
        </div>

        {/* Dimensions */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">
              Rating Dimensions <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleAddDimension}
              disabled={dimensions.length >= 10}
              className="text-sm text-primary hover:text-secondary disabled:opacity-50"
            >
              + Add Dimension
            </button>
          </div>
          
          <div className="space-y-2">
            {dimensions.map((dim, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={dim}
                  onChange={(e) => handleDimensionChange(i, e.target.value)}
                  className="input-glass flex-1"
                  placeholder={`Dimension ${i + 1} (e.g., Quality, Service)`}
                  maxLength={30}
                />
                {dimensions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDimension(i)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {dimensions.length}/10 dimensions (at least 1 required)
          </p>
        </div>

        {/* Rating Scale & Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Rating Scale <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.scaleMax}
              onChange={(e) => setFormData({ ...formData, scaleMax: Number(e.target.value) })}
              className="input-glass"
            >
              <option value={5}>1-5 Stars</option>
              <option value={10}>1-10 Points</option>
              <option value={100}>1-100 Points</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Duration (Days) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={formData.endDays}
              onChange={(e) => setFormData({ ...formData, endDays: Number(e.target.value) })}
              className="input-glass"
            />
          </div>
        </div>

        {/* Allow Multiple Ratings */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="allowMultiple"
            checked={formData.allowMultiple}
            onChange={(e) => setFormData({ ...formData, allowMultiple: e.target.checked })}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="allowMultiple" className="ml-2 text-sm">
            Allow users to rate multiple times
          </label>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-2xl mr-3">ℹ️</div>
            <div>
              <div className="font-medium text-blue-900 dark:text-blue-300 mb-1">
                Privacy-Preserving Ratings
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                All ratings will be encrypted using FHEVM technology. Only you (the creator)
                can decrypt and view the statistical results.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !isReady}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create Project"}
        </button>
      </form>
    </div>
  );
}

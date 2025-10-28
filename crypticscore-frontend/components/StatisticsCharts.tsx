"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Radar, Bar } from "react-chartjs-2";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

type StatisticsChartsProps = {
  dimensions: string[];
  averages: number[];
  stdDevs: number[];
  scaleMax: number;
};

export function StatisticsCharts({
  dimensions,
  averages,
  stdDevs,
  scaleMax,
}: StatisticsChartsProps) {
  const radarData = useMemo(
    () => ({
      labels: dimensions,
      datasets: [
        {
          label: "Average Rating",
          data: averages,
          backgroundColor: "rgba(239, 68, 68, 0.2)",
          borderColor: "rgba(239, 68, 68, 1)",
          borderWidth: 2,
          pointBackgroundColor: "rgba(239, 68, 68, 1)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(239, 68, 68, 1)",
        },
      ],
    }),
    [dimensions, averages]
  );

  const radarOptions = useMemo(
    () => ({
      scales: {
        r: {
          beginAtZero: true,
          max: scaleMax,
          ticks: {
            stepSize: 1,
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: "top" as const,
        },
      },
    }),
    [scaleMax]
  );

  const barData = useMemo(
    () => ({
      labels: dimensions,
      datasets: [
        {
          label: "Average Score",
          data: averages,
          backgroundColor: "rgba(236, 72, 153, 0.6)",
          borderColor: "rgba(236, 72, 153, 1)",
          borderWidth: 1,
        },
        {
          label: "Std Deviation",
          data: stdDevs,
          backgroundColor: "rgba(249, 115, 22, 0.6)",
          borderColor: "rgba(249, 115, 22, 1)",
          borderWidth: 1,
        },
      ],
    }),
    [dimensions, averages, stdDevs]
  );

  const barOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: "top" as const,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: scaleMax,
        },
      },
    }),
    [scaleMax]
  );

  return (
    <div className="space-y-8">
      {/* Radar Chart */}
      <div className="glass-card">
        <h3 className="text-xl font-semibold mb-4">Multi-Dimensional Overview</h3>
        <div className="max-w-2xl mx-auto">
          <Radar data={radarData} options={radarOptions} />
        </div>
      </div>

      {/* Bar Chart */}
      <div className="glass-card">
        <h3 className="text-xl font-semibold mb-4">Dimension Comparison</h3>
        <Bar data={barData} options={barOptions} />
      </div>

      {/* Statistics Table */}
      <div className="glass-card">
        <h3 className="text-xl font-semibold mb-4">Detailed Statistics</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4">Dimension</th>
                <th className="text-right py-3 px-4">Average</th>
                <th className="text-right py-3 px-4">Std Dev</th>
              </tr>
            </thead>
            <tbody>
              {dimensions.map((dim, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-3 px-4 font-medium">{dim}</td>
                  <td className="text-right py-3 px-4">
                    {averages[i].toFixed(2)} / {scaleMax}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">
                    ±{stdDevs[i].toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-primary">
            {Math.max(...averages).toFixed(1)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Highest Score
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {dimensions[averages.indexOf(Math.max(...averages))]}
          </div>
        </div>

        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-secondary">
            {Math.min(...averages).toFixed(1)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Lowest Score
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {dimensions[averages.indexOf(Math.min(...averages))]}
          </div>
        </div>

        <div className="glass-card text-center">
          <div className="text-3xl font-bold text-accent">
            {(averages.reduce((a, b) => a + b, 0) / averages.length).toFixed(1)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Overall Average
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Across all dimensions
          </div>
        </div>
      </div>
    </div>
  );
}



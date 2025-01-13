import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";

// Custom plugin to draw labels at the end of each line
const customPlugin = {
  id: "labelsAtCurveEnd",
  afterDatasetsDraw(chart) {
    const { ctx, data } = chart;

    data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta.hidden) return; // Skip hidden datasets

      const lastPoint = meta.data[meta.data.length - 1]; // Get the last point of the dataset
      if (lastPoint) {
        const { x, y } = lastPoint.getProps(["x", "y"], true); // Get x and y position
        ctx.save();
        ctx.font = "12px Gowun Dodum"; // Set font size and style
        ctx.fillStyle = dataset.borderColor; // Match text color with the line color
        ctx.fillText(dataset.label, x + 10, y + 5); // Draw the label slightly offset to the right
        ctx.restore();
      }
    });
  },
};

// Register necessary components for Chart.js
Chart.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, customPlugin);

const emotionTranslations = {
  happy: "행복",
  sad: "슬픔",
  angry: "화남",
  surprised: "놀람",
  neutral: "중립",
  disgusted: "역겨움",
  fearful: "두려움",
};

const EmotionChart = ({ chartData }) => {
  const colorPalette = [
    { borderColor: "rgba(255, 99, 132, 1)", backgroundColor: "rgba(255, 99, 132, 0.2)" }, // Red
    { borderColor: "rgba(54, 162, 235, 1)", backgroundColor: "rgba(54, 162, 235, 0.2)" }, // Blue
    { borderColor: "rgba(255, 206, 86, 1)", backgroundColor: "rgba(255, 206, 86, 0.2)" }, // Yellow
    { borderColor: "rgba(75, 192, 192, 1)", backgroundColor: "rgba(75, 192, 192, 0.2)" }, // Teal
    { borderColor: "rgba(153, 102, 255, 1)", backgroundColor: "rgba(153, 102, 255, 0.2)" }, // Purple
    { borderColor: "rgba(255, 159, 64, 1)", backgroundColor: "rgba(255, 159, 64, 0.2)" }, // Orange
    { borderColor: "rgba(199, 199, 199, 1)", backgroundColor: "rgba(199, 199, 199, 0.2)" }, // Gray
  ];

  const data = {
    labels: chartData.timestamps, // Time labels
    datasets: Object.keys(chartData.emotions).map((emotion, index) => {
      const translatedEmotion = emotionTranslations[emotion] || emotion;
      const colors = colorPalette[index % colorPalette.length];

      return {
        label: translatedEmotion,
        data: chartData.emotions[emotion],
        borderColor: colors.borderColor,
        backgroundColor: colors.backgroundColor,
        fill: false, // No fill under the line
        tension: 0.4, // Smooth lines
      };
    }),
  };

  const options = {
    responsive: true,
    layout: {
      padding: {
        right: 50, // Add space to the right for labels
      },
    },
    plugins: {
      legend: {
        display: false, // Disable the static legend
      },
      labelsAtCurveEnd: customPlugin, // Add custom plugin
    },
    scales: {
      x: {
        type: "category", // Use "category" scale for x-axis
        title: {
          display: true,
          text: "시간",
          color: "black",
          font: {
            size: 16,
            family: "Gowun Dodum",
            weight: "bold",
          },
          padding: {
            top: 15,
          },
        },
        ticks: {
          display: false, // Hide the timestamps
        },
        grid: {
          display: false,
          drawTicks: false, // Remove tick marks
        },
      },
      y: {
        title: {
          display: true,
          text: "비율(%)",
          color: "black",
          font: {
            size: 16,
            family: "Gowun Dodum",
            weight: "bold",
          },
        },
        ticks: {
          beginAtZero: true,
          max: 1, // Keep max at 1 (100%)
          stepSize: 0.2, // Tick interval (0.2 = 20%)
          callback: (value) => `${(value * 100).toFixed(0)}%`, // Format as percentage
          font: {
            family: "Gowun Dodum",
          },
        },
      },
    },
  };

  return (
    <div style={{ marginTop: "20px", height: 300 }}>
      <Line data={data} options={options} height={300} />
    </div>
  );
};

export default EmotionChart;

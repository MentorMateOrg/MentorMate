import React from "react";

export default function LoadingSpinner({ size = "medium", color = "purple" }) {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
    xlarge: "w-16 h-16",
  };

  const colorClasses = {
    purple: "border-purple-500",
    blue: "border-blue-500",
    green: "border-green-500",
    gray: "border-gray-500",
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} border-4 border-t-transparent rounded-full animate-spin`}
      ></div>
    </div>
  );
}

export function LoadingSpinnerWithText({
  text = "Loading...",
  size = "medium",
  color = "purple",
}) {
  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <LoadingSpinner size={size} color={color} />
      <p className="text-gray-600 text-sm">{text}</p>
    </div>
  );
}

export function FullPageLoader({ text = "Loading..." }) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <LoadingSpinnerWithText text={text} size="xlarge" color="purple" />
    </div>
  );
}

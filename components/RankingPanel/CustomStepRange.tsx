import React, { useState, useEffect } from "react";

interface CustomStepRangeProps {
  min: number;
  max: number;
  step: number;
  steps: number[];
  value: number;
  onChange: (value: number) => void;
}

const CustomStepRange: React.FC<CustomStepRangeProps> = ({
  min,
  max,
  step,
  steps: initialSteps,
  value,
  onChange,
}) => {
  // Keep a local state for the active steps array that can be updated
  const [steps, setSteps] = useState<number[]>(initialSteps);

  // Update steps array if value is not included
  useEffect(() => {
    if (!steps.includes(value)) {
      // Create a new sorted array with the current value
      const newSteps = [...steps, value].sort((a, b) => a - b);
      setSteps(newSteps);
    }
  }, [value, steps]);

  // Get the index of the current value in the steps array
  const currentIndex = steps.indexOf(value);

  // Map the steps array to an evenly distributed slider value (0-100)
  const getSliderValue = (): number => {
    const index = steps.indexOf(value);
    if (index === -1) return 0;
    return index * (100 / (steps.length - 1));
  };

  // Map slider position back to the closest step value
  const getStepFromPosition = (position: number): number => {
    // Convert position (0-100) to index
    const exactIndex = (position * (steps.length - 1)) / 100;
    const closestIndex = Math.round(exactIndex);
    const boundedIndex = Math.max(0, Math.min(closestIndex, steps.length - 1));
    return steps[boundedIndex];
  };

  // Handle slider change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sliderPosition = parseFloat(e.target.value);
    const stepValue = getStepFromPosition(sliderPosition);
    onChange(stepValue);
  };

  return (
    <div className="relative w-full px-1">
      {/* Use a 0-100 range for the slider instead of min-max */}
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={getSliderValue()}
        onChange={handleChange}
        className="range range-xs w-full"
      />

      {/* Evenly spaced markers */}
      <div className="relative w-full h-6 mt-1">
        {steps.map((stepValue, index) => {
          // Calculate even spacing based on index
          const position = index * (100 / (steps.length - 1));

          // Highlight the current value
          const isActive = stepValue === value;

          // Special positioning for first and last tick markers
          const isFirst = stepValue === steps[0];
          const isLast = stepValue === steps[steps.length - 1];

          return (
            <div
              key={index}
              className={`absolute w-0.5 h-2 ${isActive ? "bg-blue-500" : "bg-gray-400"} rounded`}
              style={{
                left: `${position}%`,
                transform: isFirst
                  ? "translateX(250%)"
                  : isLast
                    ? "translateX(-250%)"
                    : "translateX(-50%)",
              }}
            >
              <span
                className={`absolute -bottom-4 text-2xs whitespace-nowrap ${isActive ? "font-bold text-blue-500" : ""}`}
                style={{
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                {stepValue.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomStepRange;

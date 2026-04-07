import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartType,
  ChartData,
  ChartOptions,
  BarController,
} from "chart.js";
import { Chart, getElementsAtEvent } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import ChartjsPluginDragData from "chartjs-plugin-dragdata";
import { cn, eventTracker } from "@/lib/utils";
import {
  useCriteriaDataStore,
  useCriteriaPanelStore,
  useWeightPanelStore,
  useSharedConfigStore,
} from "@/lib/store";
import { noto_sans } from "@/app/fonts";
import * as d3 from "d3";

// @ts-expect-error
const categoryColor = d3.schemeObservable10;

// Register required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController, // Register BarController
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
  ChartjsPluginDragData,
);

interface WeightsBarChartProps {
  rankBy: string;
  onChange?: (weights: { [key: string]: number }) => void;
  draggable?: boolean;
  classes?: string;
  onCheckboxChange?: (criteria: string, checked: boolean) => void;
  onDelete?: (criteria: string) => void;
}

const WeightsBarChart = ({
  rankBy,
  onChange,
  draggable = true,
  classes = "",
  onCheckboxChange,
  onDelete,
}: WeightsBarChartProps) => {
  const { weightSort, weightSortState, setWeightSortState, setWeightSort } =
    useWeightPanelStore();
  const { setCurrentCriteria, setShowCriteriaPanel } = useCriteriaPanelStore();
  const { setCriteriaData } = useCriteriaDataStore();
  const { numberKeys, setNumberKeys } = useSharedConfigStore();

  // Define types for the chart instance
  type ChartInstance = ChartJS<"bar", number[], string>;

  const chartRef = useRef<ChartInstance | null>(null);
  const handlersRef = useRef<{
    mousemove?: (e: MouseEvent) => void;
    click?: (e: MouseEvent) => void;
  }>({});

  const weights = weightSort;

  // Convert weights object to array of labels and data
  const labels = Object.keys(weights).map(
    (label) => label.charAt(0).toUpperCase() + label.slice(1),
  );
  const data = Object.values(weights);

  // Keep track of hovered label index
  const [hoveredLabelIndex, setHoveredLabelIndex] = React.useState<
    number | null
  >(null);

  // State for delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    criteriaName: string;
  }>({ show: false, criteriaName: "" });

  // Function to handle checkbox click
  const handleCheckboxClick = (labelIndex: number, e: MouseEvent) => {
    e.stopPropagation(); // Prevent label click from firing

    const originalKey = Object.keys(weights)[labelIndex];
    const newStatus = !weightSortState[originalKey];

    // Update the checkbox state
    setWeightSortState({
      ...weightSortState,
      [originalKey]: newStatus,
    });

    // Call the callback if provided
    if (onCheckboxChange) {
      onCheckboxChange(originalKey, newStatus);
    }
  };

  // Function to handle label click
  const handleLabelClick = (labelIndex: number) => {
    const originalKey = Object.keys(weights)[labelIndex];

    const criteriaData = useCriteriaDataStore.getState().criteriaData;
    criteriaData.forEach((criteria) => {
      if (criteria.name === originalKey) {
        setCurrentCriteria(criteria.name);
        setShowCriteriaPanel(true);
      }
    });

    setHoveredLabelIndex(null);
  };

  // Function to handle delete button click
  const handleDeleteClick = (labelIndex: number, e: MouseEvent) => {
    e.stopPropagation();
    const originalKey = Object.keys(weights)[labelIndex];
    setDeleteConfirm({ show: true, criteriaName: originalKey });
  };

  // Function to confirm delete
  const confirmDelete = () => {
    const criteriaName = deleteConfirm.criteriaName;
    const criteriaData = useCriteriaDataStore.getState().criteriaData;

    // Don't allow deletion if it's the last criteria
    if (criteriaData.length <= 1) {
      setDeleteConfirm({ show: false, criteriaName: "" });
      return;
    }

    // Remove criteria from criteriaData
    const updatedCriteriaData = criteriaData.filter(
      (criteria) => criteria.name !== criteriaName,
    );
    setCriteriaData(updatedCriteriaData);

    // Remove from weightSort and weightSortState
    const updatedWeightSort = { ...weightSort };
    delete updatedWeightSort[criteriaName];
    setWeightSort(updatedWeightSort);

    const updatedWeightSortState = { ...weightSortState };
    delete updatedWeightSortState[criteriaName];
    setWeightSortState(updatedWeightSortState);

    // Remove from numberKeys
    const updatedNumberKeys = numberKeys.filter((key) => key !== criteriaName);
    setNumberKeys(updatedNumberKeys);

    // Call onDelete callback if provided
    if (onDelete) {
      onDelete(criteriaName);
    }

    // Track the deletion
    eventTracker({
      action: "delete criteria from weight chart",
      data: {
        criterion: criteriaName,
      },
    });

    setDeleteConfirm({ show: false, criteriaName: "" });

    // Reset hovered label index to prevent accessing deleted indices
    setHoveredLabelIndex(null);
  };

  // Create custom plugin for interactive x-axis labels with checkboxes
  const interactiveLabelsPlugin = {
    id: "interactiveLabels",
    beforeInit: (chart: any) => {
      // Clean up event listeners when chart initializes/reinitializes
      if (
        handlersRef.current.mousemove &&
        handlersRef.current.click &&
        chart.canvas
      ) {
        chart.canvas.removeEventListener(
          "mousemove",
          handlersRef.current.mousemove,
        );
        chart.canvas.removeEventListener("click", handlersRef.current.click);
        handlersRef.current = {};
      }
    },
    afterDraw: (chart: any) => {
      const { ctx, chartArea, scales } = chart;

      if (!scales.x || !chartArea) return;

      // Get the canvas position on the page
      const canvas = chart.canvas;

      // Clean up previous event listeners before adding new ones
      if (handlersRef.current.mousemove && handlersRef.current.click) {
        canvas.removeEventListener("mousemove", handlersRef.current.mousemove);
        canvas.removeEventListener("click", handlersRef.current.click);
      }

      // Create arrays to store checkbox positions for event handling
      const checkboxPositions: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        index: number;
      }> = [];

      const labelPositions: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        index: number;
      }> = [];

      const deleteButtonPositions: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        index: number;
      }> = [];

      // Draw checkboxes next to each label
      scales.x.ticks.forEach((tick: any, index: number) => {
        const x = scales.x.getPixelForTick(index);
        const yPosition = scales.y.bottom;
        const yOffset = 10; // Adjust this for label position
        const y = yPosition + yOffset;

        // Get the label from the original data
        const labelText = labels[index];

        // Measure label width
        const labelWidth = ctx.measureText(labelText).width;

        // Calculate positions for checkbox, label, and delete button
        const checkboxSize = 12;
        const deleteButtonSize = 14;
        const spacing = 5;

        // Total width needed: checkbox + spacing + label + spacing + deleteButton
        const totalWidth =
          checkboxSize + spacing + labelWidth + spacing + deleteButtonSize;

        // Start from the left side of the total width
        const startX = x - totalWidth / 2;

        const checkboxX = startX;
        const checkboxY = y;

        const deleteButtonX = startX + totalWidth - deleteButtonSize;
        const deleteButtonY = y;

        // Store checkbox position for event handling
        checkboxPositions.push({
          x: checkboxX,
          y: checkboxY,
          width: checkboxSize,
          height: checkboxSize,
          index: index,
        });

        // Store label position for event handling
        labelPositions.push({
          x: startX + checkboxSize + spacing,
          y: y,
          width: labelWidth,
          height: 20,
          index: index,
        });

        // Store delete button position for event handling
        deleteButtonPositions.push({
          x: deleteButtonX,
          y: deleteButtonY,
          width: deleteButtonSize,
          height: deleteButtonSize,
          index: index,
        });

        // Draw checkbox
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#555";
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.rect(checkboxX, checkboxY, checkboxSize, checkboxSize);
        ctx.fill();
        ctx.stroke();

        // Draw check mark if checked
        const originalKey = Object.keys(weights)[index];
        if (weightSortState[originalKey]) {
          ctx.beginPath();
          ctx.strokeStyle = "#555";
          ctx.lineWidth = 2;
          ctx.moveTo(checkboxX + 2, checkboxY + checkboxSize / 2);
          ctx.lineTo(
            checkboxX + checkboxSize / 2,
            checkboxY + checkboxSize - 2,
          );
          ctx.lineTo(checkboxX + checkboxSize - 2, checkboxY + 2);
          ctx.stroke();
        }

        // Draw delete button (🗑️ emoji) - only show when hovering over this label
        const criteriaData = useCriteriaDataStore.getState().criteriaData;
        if (criteriaData.length > 1 && hoveredLabelIndex === index) {
          // Only show delete button if more than 1 criteria and hovering
          ctx.font = "14px Arial";
          ctx.textAlign = "center";
          ctx.fillStyle = "#ef4444";
          ctx.fillText(
            "🗑️",
            deleteButtonX + deleteButtonSize / 2,
            deleteButtonY + deleteButtonSize - 2,
          );
        }

        // Draw the label (centered in its allocated space) with clickable styling
        const isHovered = hoveredLabelIndex === index;
        const labelX = startX + checkboxSize + spacing;
        const labelY = y + 12;

        // Always use blue color to indicate clickability
        ctx.fillStyle = isHovered ? "#005599" : "#007acc"; // Darker blue when hovered, regular blue otherwise
        ctx.font = `bold 12px ${noto_sans.style.fontFamily}`;
        ctx.textAlign = "left";

        ctx.fillText(labelText, labelX, labelY);

        // Add underline effect for hovered labels
        if (isHovered) {
          ctx.beginPath();
          ctx.strokeStyle = "#005599";
          ctx.lineWidth = 1;
          ctx.moveTo(labelX, labelY + 2);
          ctx.lineTo(labelX + labelWidth, labelY + 2);
          ctx.stroke();
        } else {
          // Add subtle dotted underline for non-hovered state to indicate clickability
          ctx.beginPath();
          ctx.strokeStyle = "#007acc";
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]); // Dotted line
          ctx.moveTo(labelX, labelY + 2);
          ctx.lineTo(labelX + labelWidth, labelY + 2);
          ctx.stroke();
          ctx.setLineDash([]); // Reset line dash
        }
      });

      // Create new mousemove handler
      const mousemoveHandler = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const offsetLeft = rect.left;
        const offsetTop = rect.top;

        const mouseX = e.clientX - offsetLeft;
        const mouseY = e.clientY - offsetTop;

        // Check if mouse is over a checkbox, label, or delete button
        let hoveredIndex: number | null = null;
        let overInteractiveElement = false;

        // Check checkboxes first
        for (const pos of checkboxPositions) {
          if (
            mouseX >= pos.x &&
            mouseX <= pos.x + pos.width &&
            mouseY >= pos.y &&
            mouseY <= pos.y + pos.height
          ) {
            hoveredIndex = pos.index;
            overInteractiveElement = true;
            canvas.style.cursor = "pointer";
            break;
          }
        }

        // Check delete buttons (only if hovering and more than 1 criteria)
        if (!overInteractiveElement) {
          const criteriaData = useCriteriaDataStore.getState().criteriaData;
          if (criteriaData.length > 1) {
            for (const pos of deleteButtonPositions) {
              if (
                mouseX >= pos.x &&
                mouseX <= pos.x + pos.width &&
                mouseY >= pos.y &&
                mouseY <= pos.y + pos.height
              ) {
                hoveredIndex = pos.index;
                overInteractiveElement = true;
                canvas.style.cursor = "pointer";
                break;
              }
            }
          }
        }

        // If not over checkbox or delete button, check labels
        if (!overInteractiveElement) {
          for (const pos of labelPositions) {
            if (
              mouseX >= pos.x &&
              mouseX <= pos.x + pos.width &&
              mouseY >= pos.y &&
              mouseY <= pos.y + pos.height
            ) {
              hoveredIndex = pos.index;
              overInteractiveElement = true;
              canvas.style.cursor = "pointer";
              break;
            }
          }
        }

        if (hoveredIndex !== null) {
          setHoveredLabelIndex(hoveredIndex);
        } else {
          setHoveredLabelIndex(null);
          // Only reset cursor if not over a bar (where draggable would set it)
          if (!chart._active || chart._active.length === 0) {
            canvas.style.cursor = "default";
          }
        }
      };

      // Create new click handler
      const clickHandler = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const offsetLeft = rect.left;
        const offsetTop = rect.top;

        const mouseX = e.clientX - offsetLeft;
        const mouseY = e.clientY - offsetTop;

        // Only process click if it's in the x-axis label area
        if (mouseY > scales.y.bottom) {
          // Check if we're clicking on a delete button (only if more than 1 criteria)
          const criteriaData = useCriteriaDataStore.getState().criteriaData;
          if (criteriaData.length > 1) {
            for (const pos of deleteButtonPositions) {
              if (
                mouseX >= pos.x &&
                mouseX <= pos.x + pos.width &&
                mouseY >= pos.y &&
                mouseY <= pos.y + pos.height
              ) {
                handleDeleteClick(pos.index, e);
                return; // Exit after handling delete click
              }
            }
          }

          // Check if we're clicking on a checkbox
          for (const pos of checkboxPositions) {
            if (
              mouseX >= pos.x &&
              mouseX <= pos.x + pos.width &&
              mouseY >= pos.y &&
              mouseY <= pos.y + pos.height
            ) {
              handleCheckboxClick(pos.index, e);
              return; // Exit after handling checkbox click
            }
          }

          // Check if we're clicking on a label
          for (const pos of labelPositions) {
            if (
              mouseX >= pos.x &&
              mouseX <= pos.x + pos.width &&
              mouseY >= pos.y &&
              mouseY <= pos.y + pos.height
            ) {
              handleLabelClick(pos.index);
              return; // Exit after handling label click
            }
          }
        }
      };

      // Store handlers for later cleanup
      handlersRef.current.mousemove = mousemoveHandler;
      handlersRef.current.click = clickHandler;

      // Add event listeners
      canvas.addEventListener("mousemove", mousemoveHandler);
      canvas.addEventListener("click", clickHandler);

      // Draw backgrounds for labels if hovered with enhanced clickable styling
      if (hoveredLabelIndex !== null) {
        let bgColor = "rgba(0, 122, 204, 0.1)"; // Light blue background
        const criteriaData = useCriteriaDataStore.getState().criteriaData;
        criteriaData.forEach((criteria) => {
          if (
            criteria.name === Object.keys(weights)[hoveredLabelIndex as number]
          ) {
            bgColor = "rgba(0, 122, 204, 0.15)"; // Slightly more prominent for active criteria
          }
        });

        // Safety check for valid index and tick existence
        if (
          hoveredLabelIndex < 0 ||
          hoveredLabelIndex >= scales.x.ticks.length ||
          !scales.x.ticks[hoveredLabelIndex]
        ) {
          return; // Skip rendering if index is out of bounds or tick doesn't exist
        }

        const x = scales.x.getPixelForTick(hoveredLabelIndex);
        const y = scales.y.bottom;

        // Get the exact position of the label as rendered by Chart.js
        const tick = scales.x.ticks[hoveredLabelIndex];
        if (!tick.label) {
          return; // Skip rendering if label doesn't exist
        }
        const labelText = tick.label;
        const labelWidth = ctx.measureText(labelText).width + 10; // Add some padding
        const labelHeight = 22; // Slightly taller for better visual

        // Calculate the Y position with proper offset for the labels
        const yOffset = 14; // Adjust this value to match your current label position
        const labelY = y + yOffset;

        // Extend the background to include the checkbox and delete button
        const checkboxSize = 12;
        const deleteButtonSize = 14;
        const spacing = 5;
        const totalWidth =
          checkboxSize + spacing + labelWidth + spacing + deleteButtonSize;

        // Add subtle shadow effect
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(
          x - totalWidth / 2 + 1,
          labelY + 1,
          totalWidth,
          labelHeight,
        );

        // Draw main background with border
        ctx.fillStyle = bgColor;
        ctx.fillRect(x - totalWidth / 2, labelY, totalWidth, labelHeight);

        // Add subtle border to enhance clickable appearance
        ctx.strokeStyle = "rgba(0, 122, 204, 0.3)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x - totalWidth / 2, labelY, totalWidth, labelHeight);
      }
    },
  };

  // Create a custom plugin to ensure the zero line is always displayed
  const zeroLinePlugin = {
    id: "zeroLine",
    beforeDraw: (chart: any) => {
      const { ctx, chartArea, scales } = chart;

      if (!scales.y || !chartArea) return;

      // Get the pixel position for the zero value on the y axis
      const zeroY = scales.y.getPixelForValue(0);

      // Only draw if the zero line is within the chart area
      if (zeroY >= chartArea.top && zeroY <= chartArea.bottom) {
        // Save the current context state
        ctx.save();

        // Set style for zero line
        ctx.strokeStyle = "rgb(227, 227, 230)";
        ctx.lineWidth = 2;

        // Draw the zero line
        ctx.beginPath();
        ctx.moveTo(chartArea.left, zeroY);
        ctx.lineTo(chartArea.right, zeroY);
        ctx.stroke();

        // Restore the context state
        ctx.restore();
      }
    },
  };

  // Register custom plugins
  useEffect(() => {
    ChartJS.register(interactiveLabelsPlugin);
    ChartJS.register(zeroLinePlugin);

    return () => {
      // Cleanup plugin when component unmounts
      ChartJS.unregister(interactiveLabelsPlugin);
      ChartJS.unregister(zeroLinePlugin);
    };
  }, [hoveredLabelIndex, weightSortState]); // Add checkedStatus as dependency

  // Set default font family
  ChartJS.defaults.font.family = noto_sans.style.fontFamily;

  // Define chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20,
        right: 10,
        left: 10,
        bottom: 10,
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            family: noto_sans.style.fontFamily,
            size: 12,
            weight: "bold",
            color: "#555",
          },
          // Disable built-in labels as we'll draw them manually with checkboxes
          callback: function () {
            return "";
          },
        },
        grid: {
          drawTicks: false, // Don't draw tick marks
        },
      },
      y: {
        min: -1,
        max: 1,
        ticks: {
          family: noto_sans.style.fontFamily,
          callback: function (value: number) {
            return value.toFixed(1);
          },
          // Add more tick values for better visual reference
          count: 11, // Show ticks at every 0.2 (-1, -0.8, -0.6, ... 0.8, 1)
        },
        grid: {
          color: (context: any) => {
            if (context.tick.value === 0) {
              return "rgb(227, 227, 230)"; // Darker line for zero
            }
            return "rgba(0, 0, 0, 0.1)";
          },
          lineWidth: (context: any) => {
            if (context.tick.value === 0) {
              return 3; // Thicker line for zero
            }
            return 1;
          },
          drawOnChartArea: true,
          drawTicks: true,
        },
      },
    },
    plugins: {
      tooltip: {
        titleFont: {
          family: noto_sans.style.fontFamily,
        },
        bodyFont: {
          family: noto_sans.style.fontFamily,
        },
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${context.raw.toFixed(2)}`;
          },
        },
      },
      datalabels: {
        anchor: "end",
        align: "top",
        formatter: (value: number) => value.toFixed(2),
        color: function (context: any) {
          return context.dataset.backgroundColor;
        },
        font: { family: noto_sans.style.fontFamily, weight: "bold" },
        display: function (context: any) {
          return context.dataset.data[context.dataIndex] !== 0;
        },
      },
      dragData: draggable
        ? {
            round: 2,
            showTooltip: true,
            dragX: false,
            onDragStart: function (e: any) {
              e.target.style.cursor = "grabbing";
            },
            onDrag: function (
              e: any,
              datasetIndex: number,
              index: number,
              value: number,
            ) {
              e.target.style.cursor = "grabbing";

              // Ensure colors update when crossing the 0 threshold
              if (chartRef.current?.data?.datasets?.[0]) {
                const dataset = chartRef.current.data.datasets[0];

                // Ensure backgroundColor and borderColor are arrays
                if (!Array.isArray(dataset.backgroundColor)) {
                  dataset.backgroundColor = Array(dataset.data.length).fill(
                    dataset.backgroundColor,
                  );
                }

                if (!Array.isArray(dataset.borderColor)) {
                  dataset.borderColor = Array(dataset.data.length).fill(
                    dataset.borderColor,
                  );
                }

                // Update colors based on current value and rankBy
                const originalKey = Object.keys(weights)[index];
                const weightSortState =
                  useWeightPanelStore.getState().weightSortState;

                // If it is false in the weightSortState, set backgroundColor to gray
                if (!weightSortState[originalKey]) {
                  (dataset.backgroundColor as string[])[index] =
                    "rgba(150, 150, 150, 0.7)";
                  (dataset.borderColor as string[])[index] =
                    "rgba(120, 120, 120)";
                } else {
                  // Always use individual criterion color from the d3 color scheme (like the Legend)
                  const criterionColor =
                    categoryColor[
                      numberKeys.indexOf(originalKey) % categoryColor.length
                    ];
                  const rgb = d3.rgb(criterionColor);
                  (dataset.backgroundColor as string[])[index] =
                    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`;
                  (dataset.borderColor as string[])[index] = criterionColor;
                }
              }

              // Update chart visual immediately
              if (chartRef.current) {
                chartRef.current.update("none");
              }
            },
            onDragEnd: function (
              e: any,
              datasetIndex: number,
              index: number,
              value: number,
            ) {
              e.target.style.cursor = "default";

              // Create updated weights object
              if (onChange) {
                const updatedWeights = { ...weights };
                // Use the original key name from weights object
                const originalKey = Object.keys(weights)[index];
                updatedWeights[originalKey] = value;
                onChange(updatedWeights);
                eventTracker({
                  action: "update weight",
                  data: {
                    criterion: originalKey,
                    value: value,
                  },
                });
              }
            },
          }
        : false,
      legend: {
        display: false,
        labels: {
          font: {
            family: noto_sans.style.fontFamily,
          },
        },
      },
    },
    onHover: function (e: any) {
      if (!draggable) return;

      const point = e.chart.getElementsAtEventForMode(
        e,
        "nearest",
        { intersect: true },
        false,
      );

      if (point.length) {
        e.native.target.style.cursor = "grab";
      } else {
        e.native.target.style.cursor = "default";
      }
    },
  };

  // Define types for Chart.js dataset
  type ChartDataset = {
    data: number[];
    backgroundColor: string[] | string;
    borderColor: string[] | string;
    [key: string]: any;
  };

  // Custom plugin to update colors when dragging between positive/negative
  const updateBarColorsPlugin = {
    id: "updateBarColors",
    beforeDraw: (chart: any) => {
      const dataset = chart.data.datasets[0] as ChartDataset;

      if (!dataset || !Array.isArray(dataset.data)) return;

      // Ensure backgroundColor and borderColor are arrays
      if (!Array.isArray(dataset.backgroundColor)) {
        dataset.backgroundColor = Array(dataset.data.length).fill(
          dataset.backgroundColor,
        );
      }

      if (!Array.isArray(dataset.borderColor)) {
        dataset.borderColor = Array(dataset.data.length).fill(
          dataset.borderColor,
        );
      }

      const weights = useWeightPanelStore.getState().weightSort;
      const numberKeys = useSharedConfigStore.getState().numberKeys;
      // Update colors based on current values and rankBy criteria
      dataset.data.forEach((value, index) => {
        const label = Object.keys(weights)[index];

        // If it is false in the weightSortState, set backgroundColor to gray
        const weightSortState = useWeightPanelStore.getState().weightSortState;
        if (!weightSortState[label]) {
          (dataset.backgroundColor as string[])[index] =
            "rgba(150, 150, 150, 0.7)";
          (dataset.borderColor as string[])[index] = "rgba(120, 120, 120)";
          return;
        }

        // Always use individual criterion color from the d3 color scheme (like the Legend)
        const criterionColor =
          categoryColor[numberKeys.indexOf(label) % categoryColor.length];
        const rgb = d3.rgb(criterionColor);
        (dataset.backgroundColor as string[])[index] =
          `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`;
        (dataset.borderColor as string[])[index] = criterionColor;
      });
    },
  };

  // Register custom plugin
  ChartJS.register(updateBarColorsPlugin);

  // Determine bar colors based on rankBy criteria and data values
  const getBarColors = () => {
    return data.map((value, index) => {
      const label = Object.keys(weights)[index];

      // If it is false in the weightSortState, set backgroundColor to gray
      const weightSortState = useWeightPanelStore.getState().weightSortState;
      if (!weightSortState[label]) {
        return "rgba(150, 150, 150, 0.7)";
      }

      // Always use individual criterion color from the d3 color scheme (like the Legend)
      const criterionColor =
        categoryColor[numberKeys.indexOf(label) % categoryColor.length];
      // Add opacity to match the Legend's lighter appearance
      const rgb = d3.rgb(criterionColor);
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`; // 0.6 opacity for slightly more visible than Legend's 0.4
    });
  };

  // Determine bar border colors based on rankBy criteria and data values
  const getBarBorderColors = () => {
    return data.map((value, index) => {
      const label = Object.keys(weights)[index];

      // If it is false in the weightSortState, set backgroundColor to gray
      const weightSortState = useWeightPanelStore.getState().weightSortState;
      if (!weightSortState[label]) {
        return "rgba(120, 120, 120)";
      }

      // Always use individual criterion color from the d3 color scheme (like the Legend)
      const criterionColor =
        categoryColor[numberKeys.indexOf(label) % categoryColor.length];
      // Use full opacity for border to make it slightly more defined
      return criterionColor;
    });
  };

  // Prepare chart data
  const chartData = {
    labels,
    datasets: [
      {
        label: "Weight",
        data: data,
        backgroundColor: getBarColors(),
        borderColor: getBarBorderColors(),
        borderWidth: 1,
        // Add a minimum bar thickness to make small values easier to click
        minBarLength: 10,
      },
    ],
  };

  return (
    <div className={cn(classes, "w-full bg-slate-50 relative")}>
      <Chart
        ref={chartRef}
        type="bar"
        options={options as ChartOptions<"bar">}
        data={chartData as ChartData<"bar">}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-xs mx-4 shadow-xl">
            <h3 className="text-sm font-semibold mb-2 text-gray-900">
              Delete Criterion
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Are you sure you want to delete the criterion &quot;
              {deleteConfirm.criteriaName}&quot;? This action cannot be undone
              and will remove all associated data.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() =>
                  setDeleteConfirm({ show: false, criteriaName: "" })
                }
                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeightsBarChart;

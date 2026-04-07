import { SlopeChartItem } from "@/lib/type";

const MIN_NODE_GAP = 60; // Minimum pixels between nodes

export class ChartScales {
  private width: number;
  private height: number;
  private data: SlopeChartItem[];

  constructor(width: number, height: number, data: SlopeChartItem[]) {
    this.width = width;
    this.height = height;
    this.data = data;
  }

  // Minimum width needed to maintain MIN_NODE_GAP between all nodes
  public get requiredWidth(): number {
    if (this.data.length <= 1) return this.width;
    return (this.data.length - 1) * MIN_NODE_GAP;
  }

  // The effective width used for layout (at least requiredWidth)
  private get effectiveWidth(): number {
    return Math.max(this.width, this.requiredWidth);
  }

  // X position scale for ranks - adapts to available width
  public xScale = (rank: number): number => {
    if (this.data.length <= 1) return this.effectiveWidth / 2;

    // If we have few items (let's say 5 or fewer), center them
    if (this.data.length <= 5) {
      // Calculate the total width needed for the items with proper spacing
      const totalItemsWidth =
        (this.data.length - 1) * Math.min(100, this.effectiveWidth * 0.15);

      // Calculate the starting point to center the items
      const startX = (this.effectiveWidth - totalItemsWidth) / 2;

      // Return the position based on rank
      return startX + (rank - 1) * Math.min(100, this.effectiveWidth * 0.15);
    }

    // For more items, use the original spread across the full width
    return (rank - 1) * (this.effectiveWidth / (this.data.length - 1));
  };

  // Calculate space between items
  public get spaceBetweenItems(): number {
    return this.data.length > 1
      ? this.effectiveWidth / (this.data.length - 1)
      : this.effectiveWidth;
  }

  // Scale for rectangle width based on value
  public valueScale = (value: number): number => {
    // Find all values across both start and end to get the global maximum absolute value
    const allValues = [
      ...this.data.map((d) => d.startValue),
      ...this.data.map((d) => d.endValue),
    ];
    const maxAbsValue = Math.max(...allValues.map(Math.abs), 0.1); // Avoid division by zero

    // Adjust maxWidth based on number of items and available space
    const maxWidth = Math.min(this.spaceBetweenItems * 0.6, 50); // Max 50px or 60% of available space

    // Set a minimum width to ensure visibility even when value is close to 0
    const minWidth = 5; // Minimum width in pixels

    // Calculate width based on value normalized by the global maximum absolute value
    const calculatedWidth = (Math.abs(value) / maxAbsValue) * maxWidth;

    // Return the larger of calculated width and minimum width
    return Math.max(calculatedWidth, minWidth);
  };

  // Get the control points for a Sankey path
  public getPathControlPoints = (item: SlopeChartItem) => {
    const x1 = this.xScale(item.startRank);
    const y1 = 10; // Top position
    const x2 = this.xScale(item.endRank);
    const y2 = this.height - 10; // Bottom position

    // Control points for the curve
    const midY = (y1 + y2) / 2;

    return {
      p0: { x: x1, y: y1 },
      p1: { x: x1, y: midY }, // Control point 1
      p2: { x: x2, y: midY }, // Control point 2
      p3: { x: x2, y: y2 },
    };
  };

  // Calculate maximum name length based on available space
  public calculateMaxNameLength = (): number => {
    // Base this on the available width per item
    const availableWidth = this.spaceBetweenItems;
    // Rough estimate: each character takes about 7px with default font
    const charWidth = 7;
    const maxChars = Math.floor(availableWidth / charWidth);
    // Ensure we have at least a minimum and not more than maximum
    return Math.max(10, Math.min(maxChars, 15));
  };
}

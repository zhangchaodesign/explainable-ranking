import { SlopeChartItem, Intersection, CrossingPair } from "@/lib/type";
import { ChartScales } from "@/components/ExplanationPanel/ChartScales";
import { bezierPoint } from "@/lib/utils";

export class IntersectionDetector {
  private data: SlopeChartItem[];
  private scales: ChartScales;

  constructor(data: SlopeChartItem[], scales: ChartScales) {
    this.data = data;
    this.scales = scales;
  }

  // Find intersection between two bezier curves using binary search
  private findIntersection = (
    points1: any,
    points2: any,
    maxIterations = 30,
    precision = 1,
  ) => {
    let tMin = 0;
    let tMax = 1;
    let bestDistance = Infinity;
    let bestIntersection = null;

    for (let iter = 0; iter < maxIterations; iter++) {
      // Try three points in the current range
      const t1 = tMin + (tMax - tMin) / 4;
      const t2 = tMin + (tMax - tMin) / 2;
      const t3 = tMin + (3 * (tMax - tMin)) / 4;

      // Calculate points on both curves at these t values
      const p1_t1 = bezierPoint(
        t1,
        points1.p0,
        points1.p1,
        points1.p2,
        points1.p3,
      );
      const p2_t1 = bezierPoint(
        t1,
        points2.p0,
        points2.p1,
        points2.p2,
        points2.p3,
      );
      const dist1 = Math.sqrt(
        Math.pow(p1_t1.x - p2_t1.x, 2) + Math.pow(p1_t1.y - p2_t1.y, 2),
      );

      const p1_t2 = bezierPoint(
        t2,
        points1.p0,
        points1.p1,
        points1.p2,
        points1.p3,
      );
      const p2_t2 = bezierPoint(
        t2,
        points2.p0,
        points2.p1,
        points2.p2,
        points2.p3,
      );
      const dist2 = Math.sqrt(
        Math.pow(p1_t2.x - p2_t2.x, 2) + Math.pow(p1_t2.y - p2_t2.y, 2),
      );

      const p1_t3 = bezierPoint(
        t3,
        points1.p0,
        points1.p1,
        points1.p2,
        points1.p3,
      );
      const p2_t3 = bezierPoint(
        t3,
        points2.p0,
        points2.p1,
        points2.p2,
        points2.p3,
      );
      const dist3 = Math.sqrt(
        Math.pow(p1_t3.x - p2_t3.x, 2) + Math.pow(p1_t3.y - p2_t3.y, 2),
      );

      // Find the minimum distance and update best intersection
      if (dist1 < bestDistance) {
        bestDistance = dist1;
        bestIntersection = {
          x: (p1_t1.x + p2_t1.x) / 2,
          y: (p1_t1.y + p2_t1.y) / 2,
          distance: dist1,
          t: t1,
        };
      }
      if (dist2 < bestDistance) {
        bestDistance = dist2;
        bestIntersection = {
          x: (p1_t2.x + p2_t2.x) / 2,
          y: (p1_t2.y + p2_t2.y) / 2,
          distance: dist2,
          t: t2,
        };
      }
      if (dist3 < bestDistance) {
        bestDistance = dist3;
        bestIntersection = {
          x: (p1_t3.x + p2_t3.x) / 2,
          y: (p1_t3.y + p2_t3.y) / 2,
          distance: dist3,
          t: t3,
        };
      }

      // Narrow the search range based on which section had the lowest distance
      if (dist1 <= dist2 && dist1 <= dist3) {
        tMax = t2;
      } else if (dist2 <= dist1 && dist2 <= dist3) {
        tMin = t1;
        tMax = t3;
      } else {
        tMin = t2;
      }

      // Exit if we're precise enough
      if (bestDistance < precision) break;
    }

    return bestIntersection;
  };

  // Function to detect crossing paths and find intersections
  public detectIntersections = (): {
    intersections: Intersection[];
    crossingPairs: CrossingPair[];
  } => {
    const intersections: Intersection[] = [];
    const crossingPairs: CrossingPair[] = [];

    // Check for potential crossings between pairs of items
    for (let i = 0; i < this.data.length; i++) {
      for (let j = i + 1; j < this.data.length; j++) {
        const item1 = this.data[i];
        const item2 = this.data[j];

        // Fast check: do the paths potentially cross? (based on rank changes)
        const doPathsLikelyCross =
          // Case 1: item1 starts higher, ends lower than item2
          (item1.startRank < item2.startRank &&
            item1.endRank > item2.endRank) ||
          // Case 2: item1 starts lower, ends higher than item2
          (item1.startRank > item2.startRank && item1.endRank < item2.endRank);

        if (doPathsLikelyCross) {
          // Get path control points
          const points1 = this.scales.getPathControlPoints(item1);
          const points2 = this.scales.getPathControlPoints(item2);

          // Find the intersection
          const intersection = this.findIntersection(points1, points2);

          // If we found a close intersection and it's within a reasonable threshold
          if (intersection && intersection.distance < 5) {
            intersections.push({
              id1: item1.id,
              id2: item2.id,
              x: intersection.x,
              y: intersection.y,
            });

            crossingPairs.push({
              id1: item1.id,
              id2: item2.id,
              name1: item1.name,
              name2: item2.name,
            });
          }
        }
      }
    }

    return { intersections, crossingPairs };
  };
}

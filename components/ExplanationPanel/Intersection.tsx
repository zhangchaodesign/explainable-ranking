import React from "react";
import { Intersection as IntersectionType, HighlightedPair } from "@/lib/type";

interface IntersectionProps {
  intersection: IntersectionType;
  item1Name: string;
  item2Name: string;
  clickedItem: string | null;
  highlightedPair: HighlightedPair;
  handleIntersectionClick: (id1: string, id2: string) => void;
  setHighlightedPair: (pair: HighlightedPair) => void;
}

const Intersection = ({
  intersection,
  item1Name,
  item2Name,
  clickedItem,
  highlightedPair,
  handleIntersectionClick,
  setHighlightedPair,
}: IntersectionProps) => {
  const isHighlighted =
    highlightedPair &&
    highlightedPair.id1 === intersection.id1 &&
    highlightedPair.id2 === intersection.id2;

  // Only render if this intersection involves the clicked item
  if (clickedItem !== intersection.id1 && clickedItem !== intersection.id2) {
    return null;
  }

  return (
    <g>
      <circle
        cx={intersection.x}
        cy={intersection.y}
        r={6}
        fill={isHighlighted ? "#333" : "rgba(255, 255, 255, 0.6)"}
        stroke="#333"
        strokeWidth={1.5}
        style={{ cursor: "pointer" }}
        onClick={() =>
          handleIntersectionClick(intersection.id1, intersection.id2)
        }
        onMouseEnter={() =>
          setHighlightedPair({
            id1: intersection.id1,
            id2: intersection.id2,
          })
        }
        onMouseLeave={() => setHighlightedPair(null)}
      >
        <title>
          Intersection: {item1Name} & {item2Name}
        </title>
      </circle>
    </g>
  );
};

export default Intersection;

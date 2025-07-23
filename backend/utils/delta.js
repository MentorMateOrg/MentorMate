import {
  createRetainOp,
  createInsertOp,
  createDeleteOp,
  normalizeOps,
} from "./operationUtils.js";
import { SimpleMyers } from "./simpleMyers.js";

// Create a single instance for reuse
const myersInstance = new SimpleMyers();

/**
 * Enhanced delta generation with Myers algorithm
 * Uses Myers algorithm for better diff quality while maintaining simplicity
 */
export default function generateDeltas(oldText, newText, options = {}) {
  const { useMyers = true } = options;

  // Use Myers algorithm by default for better results
  if (useMyers) {
    return myersInstance.generateOperations(oldText, newText);
  }

  // Fallback to original simple algorithm
  return generateDeltasSimple(oldText, newText);
}

/**
 * Original simple delta generation algorithm
 * Kept as fallback for compatibility
 */
function generateDeltasSimple(oldText, newText) {
  // Handle null/undefined inputs
  if (!oldText) oldText = "";
  if (!newText) newText = "";

  const operations = [];
  let i = 0;
  let j = 0;

  // Simple diff implementation (can be improved with Myers diff algorithm)
  while (i < oldText.length || j < newText.length) {
    // Find common prefix
    let commonStart = 0;
    while (i + commonStart < oldText.length &&
           j + commonStart < newText.length &&
           oldText[i + commonStart] === newText[j + commonStart]) {
      commonStart++;
    }

    if (commonStart > 0) {
      operations.push(createRetainOp(commonStart));
      i += commonStart;
      j += commonStart;
    }

    // Find common suffix
    let commonEnd = 0;
    while (i + commonEnd < oldText.length &&
           j + commonEnd < newText.length &&
           oldText[oldText.length - 1 - commonEnd] === newText[newText.length - 1 - commonEnd]) {
      commonEnd++;
    }

    // Handle middle section (different content)
    const oldMiddleLength = oldText.length - i - commonEnd;
    const newMiddleLength = newText.length - j - commonEnd;

    if (oldMiddleLength > 0) {
      operations.push(createDeleteOp(oldMiddleLength));
    }

    if (newMiddleLength > 0) {
      operations.push(createInsertOp(newText.substring(j, j + newMiddleLength)));
    }

    i = oldText.length - commonEnd;
    j = newText.length - commonEnd;

    if (commonEnd > 0) {
      operations.push(createRetainOp(commonEnd));
      i += commonEnd;
      j += commonEnd;
    }
  }

  return normalizeOps(operations);
}

/**
 * Compare the performance of Myers vs Simple algorithm
 */
export function compareDiffAlgorithms(oldText, newText) {
  const startSimple = performance.now();
  const simpleOps = generateDeltasSimple(oldText, newText);
  const endSimple = performance.now();

  const startMyers = performance.now();
  const myersOps = myersInstance.generateOperations(oldText, newText);
  const endMyers = performance.now();

  return {
    simple: {
      operations: simpleOps,
      time: endSimple - startSimple,
      operationCount: simpleOps.length,
    },
    myers: {
      operations: myersOps,
      time: endMyers - startMyers,
      operationCount: myersOps.length,
    },
    improvement: {
      operationReduction: simpleOps.length - myersOps.length,
      timeRatio: (endSimple - startSimple) / (endMyers - startMyers),
    },
  };
}


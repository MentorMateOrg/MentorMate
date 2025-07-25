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
  let oldPos = 0;
  let newPos = 0;

  while (oldPos < oldText.length || newPos < newText.length) {
    // Find common prefix from current positions
    let commonStart = 0;
    while (
      oldPos + commonStart < oldText.length &&
      newPos + commonStart < newText.length &&
      oldText[oldPos + commonStart] === newText[newPos + commonStart]
    ) {
      commonStart++;
    }

    // Retain common characters
    if (commonStart > 0) {
      operations.push(createRetainOp(commonStart));
      oldPos += commonStart;
      newPos += commonStart;
      continue;
    }

    // Find the next common point using a simple approach
    let oldEnd = oldPos;
    let newEnd = newPos;

    // Look for the next matching character
    let found = false;
    for (
      let lookahead = 1;
      lookahead <= Math.max(oldText.length - oldPos, newText.length - newPos) &&
      !found;
      lookahead++
    ) {
      // Try skipping characters in old text
      if (oldPos + lookahead < oldText.length) {
        for (let newSkip = 0; newSkip <= newText.length - newPos; newSkip++) {
          if (
            newPos + newSkip < newText.length &&
            oldText[oldPos + lookahead] === newText[newPos + newSkip]
          ) {
            oldEnd = oldPos + lookahead;
            newEnd = newPos + newSkip;
            found = true;
            break;
          }
        }
      }

      // Try skipping characters in new text
      if (!found && newPos + lookahead < newText.length) {
        for (let oldSkip = 0; oldSkip <= oldText.length - oldPos; oldSkip++) {
          if (
            oldPos + oldSkip < oldText.length &&
            newText[newPos + lookahead] === oldText[oldPos + oldSkip]
          ) {
            oldEnd = oldPos + oldSkip;
            newEnd = newPos + lookahead;
            found = true;
            break;
          }
        }
      }
    }

    // If no common point found, consume the rest
    if (!found) {
      oldEnd = oldText.length;
      newEnd = newText.length;
    }

    // Generate delete operation for old text
    if (oldEnd > oldPos) {
      operations.push(createDeleteOp(oldEnd - oldPos));
      oldPos = oldEnd;
    }

    // Generate insert operation for new text
    if (newEnd > newPos) {
      operations.push(createInsertOp(newText.substring(newPos, newEnd)));
      newPos = newEnd;
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

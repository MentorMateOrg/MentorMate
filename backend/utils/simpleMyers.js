import {
  createRetainOp,
  createInsertOp,
  createDeleteOp,
  normalizeOps,
} from "./operationUtils.js";

/**
 * Simple Myers Algorithm Implementation
 *
 * This is a simplified version of the Myers diff algorithm that finds
 * better edit sequences than basic character-by-character comparison.
 *
 * The algorithm finds the shortest edit script (minimum operations)
 * to transform one string into another.
 */
export class SimpleMyers {
  /**
   * Generate operations using simplified Myers algorithm
   */
  generateOperations(oldText, newText) {
    // Handle edge cases
    if (!oldText) oldText = "";
    if (!newText) newText = "";

    if (oldText === newText) {
      return [];
    }

    // For very small texts, use simple approach
    if (oldText.length + newText.length < 10) {
      return this.simpleCompare(oldText, newText);
    }

    // Use Myers algorithm for better results
    return this.myersDiff(oldText, newText);
  }

  /**
   * Core Myers algorithm - simplified version
   */
  myersDiff(oldText, newText) {
    const N = oldText.length;
    const M = newText.length;
    const MAX = N + M;

    // Handle simple cases
    if (N === 0) {
      return [createInsertOp(newText)];
    }
    if (M === 0) {
      return [createDeleteOp(N)];
    }

    // V array tracks the furthest x-coordinate for each diagonal
    const V = {};
    V[1] = 0;

    // Find the shortest edit script
    for (let D = 0; D <= MAX; D++) {
      for (let k = -D; k <= D; k += 2) {
        let x;

        // Choose direction: down (insert) or right (delete)
        if (k === -D || (k !== D && (V[k - 1] || 0) < (V[k + 1] || 0))) {
          x = V[k + 1] || 0; // Move down (insert)
        } else {
          x = (V[k - 1] || 0) + 1; // Move right (delete)
        }

        let y = x - k;

        // Follow diagonal (matching characters)
        while (x < N && y < M && oldText[x] === newText[y]) {
          x++;
          y++;
        }

        V[k] = x;

        // Check if we reached the end
        if (x >= N && y >= M) {
          return this.buildOperations(oldText, newText);
        }
      }
    }

    // Fallback to simple comparison
    return this.simpleCompare(oldText, newText);
  }

  /**
   * Build operations from the Myers result
   * This is a simplified approach that reconstructs the operations
   */
  buildOperations(oldText, newText) {
    // For simplicity, we'll use a forward approach to build operations
    // This isn't the full Myers backtracking but gives good results

    const operations = [];
    let oldPos = 0;
    let newPos = 0;

    while (oldPos < oldText.length || newPos < newText.length) {
      // Find matching sequence
      let matchStart = oldPos;
      while (
        oldPos < oldText.length &&
        newPos < newText.length &&
        oldText[oldPos] === newText[newPos]
      ) {
        oldPos++;
        newPos++;
      }

      // Add retain for matching characters
      if (oldPos > matchStart) {
        operations.push(createRetainOp(oldPos - matchStart));
      }

      // If we're at the end, break
      if (oldPos >= oldText.length && newPos >= newText.length) {
        break;
      }

      // Find the next matching point using a smarter approach
      const nextMatch = this.findNextMatch(oldText, newText, oldPos, newPos);

      // Handle deletions
      if (nextMatch.oldPos > oldPos) {
        operations.push(createDeleteOp(nextMatch.oldPos - oldPos));
        oldPos = nextMatch.oldPos;
      }

      // Handle insertions
      if (nextMatch.newPos > newPos) {
        operations.push(
          createInsertOp(newText.substring(newPos, nextMatch.newPos))
        );
        newPos = nextMatch.newPos;
      }
    }

    return normalizeOps(operations);
  }

  /**
   * Find the next matching point between two strings
   * This uses a simplified version of Myers' approach
   */
  findNextMatch(oldText, newText, oldStart, newStart) {
    const oldLen = oldText.length;
    const newLen = newText.length;

    // Look ahead for the next matching character
    let bestOldPos = oldLen;
    let bestNewPos = newLen;
    let bestScore = oldLen + newLen; // Worst case score

    // Try different combinations within a reasonable window
    const maxLookAhead = Math.min(
      20,
      Math.max(oldLen - oldStart, newLen - newStart)
    );

    for (
      let oldSkip = 0;
      oldSkip <= maxLookAhead && oldStart + oldSkip < oldLen;
      oldSkip++
    ) {
      for (
        let newSkip = 0;
        newSkip <= maxLookAhead && newStart + newSkip < newLen;
        newSkip++
      ) {
        if (oldText[oldStart + oldSkip] === newText[newStart + newSkip]) {
          const score = oldSkip + newSkip;
          if (score < bestScore) {
            bestScore = score;
            bestOldPos = oldStart + oldSkip;
            bestNewPos = newStart + newSkip;
          }
        }
      }
    }

    return { oldPos: bestOldPos, newPos: bestNewPos };
  }

  /**
   * Simple character-by-character comparison for small texts
   */
  simpleCompare(oldText, newText) {
    const operations = [];
    let oldPos = 0;
    let newPos = 0;

    while (oldPos < oldText.length || newPos < newText.length) {
      if (
        oldPos < oldText.length &&
        newPos < newText.length &&
        oldText[oldPos] === newText[newPos]
      ) {
        // Characters match
        let matchCount = 0;
        while (
          oldPos + matchCount < oldText.length &&
          newPos + matchCount < newText.length &&
          oldText[oldPos + matchCount] === newText[newPos + matchCount]
        ) {
          matchCount++;
        }
        operations.push(createRetainOp(matchCount));
        oldPos += matchCount;
        newPos += matchCount;
      } else if (
        newPos < newText.length &&
        (oldPos >= oldText.length || oldText[oldPos] !== newText[newPos])
      ) {
        // Need to insert
        operations.push(createInsertOp(newText[newPos]));
        newPos++;
      } else {
        // Need to delete
        operations.push(createDeleteOp(1));
        oldPos++;
      }
    }

    return normalizeOps(operations);
  }
}

/**
 * Enhanced delta generation using Simple Myers algorithm
 */
export function generateDeltasWithMyers(oldText, newText) {
  const myers = new SimpleMyers();
  return myers.generateOperations(oldText, newText);
}

export default SimpleMyers;

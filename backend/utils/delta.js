import {
  createRetainOp,
  createInsertOp,
  createDeleteOp,
  normalizeOps,
} from "./operationUtils.js";

/**
 * Generate operations to transform oldText into newText
 * Uses a simple but correct diff algorithm
 */
export default function generateDeltas(oldText, newText) {
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

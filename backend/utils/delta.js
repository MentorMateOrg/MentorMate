import { OP_RETAIN, OP_INSERT, OP_DELETE } from '../constants/operationTypes.js';
import { createRetainOp, createInsertOp, createDeleteOp, normalizeOps } from './operationUtils.js';

export default function generateDeltas(oldText, newText) {
  // Use the Myers diff algorithm to find the minimal edit script
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


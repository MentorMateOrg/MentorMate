import { OP_RETAIN, OP_INSERT, OP_DELETE } from '../constants/operationTypes.js';
import { normalizeOps, createRetainOp, createInsertOp, createDeleteOp } from './operationUtils.js';

/**
 * Transform operation A against operation B
 * Returns A' such that: B + A' = A + B
 */
export function transformOp(opA, opB) {
  const result = [];
  let indexA = 0;
  let indexB = 0;

  while (indexA < opA.length || indexB < opB.length) {
    // Both operations exhausted
    if (indexA >= opA.length && indexB >= opB.length) {
      break;
    }

    const a = indexA < opA.length ? opA[indexA] : null;
    const b = indexB < opB.length ? opB[indexB] : null;

    // Case 1: A is insert - insert is always prioritized
    if (a && a.type === OP_INSERT) {
      result.push({...a});
      indexA++;
      continue;
    }

    // Case 2: B is insert - skip over B's insert
    if (b && b.type === OP_INSERT) {
      result.push(createRetainOp(b.chars.length));
      indexB++;
      continue;
    }

    // At this point, neither op is an insert

    // Handle case where one op is exhausted
    if (!a) {
      // Only B operations remain, which must be deletes
      // These deletes have no effect on A'
      break;
    }

    if (!b) {
      // Only A operations remain, copy them to result
      result.push({...a});
      indexA++;
      continue;
    }

    // Both ops are either retain or delete

    // Calculate the overlapping length
    const minLength = Math.min(
      a.type === OP_RETAIN || a.type === OP_DELETE ? a.count : a.chars.length,
      b.type === OP_RETAIN || b.type === OP_DELETE ? b.count : b.chars.length
    );

    // Case 3: both retain - keep the retain
    if (a.type === OP_RETAIN && b.type === OP_RETAIN) {
      result.push(createRetainOp(minLength));

      // Consume from both operations
      if (a.count === minLength) indexA++;
      else a.count -= minLength;

      if (b.count === minLength) indexB++;
      else b.count -= minLength;
    }

    // Case 4: A is delete, B is retain - keep the delete
    else if (a.type === OP_DELETE && b.type === OP_RETAIN) {
      result.push(createDeleteOp(minLength));

      // Consume from both operations
      if (a.count === minLength) indexA++;
      else a.count -= minLength;

      if (b.count === minLength) indexB++;
      else b.count -= minLength;
    }

    // Case 5: A is retain, B is delete - B's delete cancels A's retain
    else if (a.type === OP_RETAIN && b.type === OP_DELETE) {
      // Don't add anything to result - the text A was retaining is deleted by B

      // Consume from both operations
      if (a.count === minLength) indexA++;
      else a.count -= minLength;

      if (b.count === minLength) indexB++;
      else b.count -= minLength;
    }

    // Case 6: both delete - only count one delete
    else if (a.type === OP_DELETE && b.type === OP_DELETE) {
      // Don't add anything to result - both trying to delete the same text

      // Consume from both operations
      if (a.count === minLength) indexA++;
      else a.count -= minLength;

      if (b.count === minLength) indexB++;
      else b.count -= minLength;
    }
  }

  return normalizeOps(result);
}

import {
  OP_RETAIN,
  OP_INSERT,
  OP_DELETE,
} from "../constants/operationTypes.js";
import {
  normalizeOps,
  createRetainOp,
  createInsertOp,
  createDeleteOp,
} from "./operationUtils.js";

/**
 * Transform operation A against operation B
 * Returns A' such that: apply(apply(doc, B), A') = apply(apply(doc, A), B')
 * This implements the standard OT transformation with proper tie-breaking
 */
export function transformOp(opA, opB, priority = "left") {
  const result = [];
  let indexA = 0;
  let indexB = 0;

  // Create mutable copies to avoid modifying original operations
  const opsA = opA.map((op) => ({ ...op }));
  const opsB = opB.map((op) => ({ ...op }));

  while (indexA < opsA.length || indexB < opsB.length) {
    const a = indexA < opsA.length ? opsA[indexA] : null;
    const b = indexB < opsB.length ? opsB[indexB] : null;

    // Case 1: Both are inserts at the same position - need tie-breaking
    if (a && a.type === OP_INSERT && b && b.type === OP_INSERT) {
      // Use consistent tie-breaking: left operation (A) goes first
      if (priority === "left") {
        result.push(createInsertOp(a.chars));
        indexA++;
      } else {
        // Right operation (B) goes first, so A needs to be shifted
        result.push(createRetainOp(b.chars.length));
        indexB++;
      }
      continue;
    }

    // Case 2: A is insert (and B is not insert)
    if (a && a.type === OP_INSERT) {
      result.push(createInsertOp(a.chars));
      indexA++;
      continue;
    }

    // Case 3: B is insert (and A is not insert) - we need to retain over B's insertion
    if (b && b.type === OP_INSERT) {
      result.push(createRetainOp(b.chars.length));
      indexB++;
      continue;
    }

    // Handle exhausted operations
    if (!a) {
      // Only B operations remain (must be retain/delete)
      indexB++;
      continue;
    }

    if (!b) {
      // Only A operations remain
      result.push({ ...a });
      indexA++;
      continue;
    }

    // Both operations are retain or delete
    const aLength = a.count;
    const bLength = b.count;
    const minLength = Math.min(aLength, bLength);

    // Case 3: A retain, B retain
    if (a.type === OP_RETAIN && b.type === OP_RETAIN) {
      result.push(createRetainOp(minLength));
    }
    // Case 4: A delete, B retain
    else if (a.type === OP_DELETE && b.type === OP_RETAIN) {
      result.push(createDeleteOp(minLength));
    }
    // Case 5: A retain, B delete (B's delete cancels A's retain)
    else if (a.type === OP_RETAIN && b.type === OP_DELETE) {
      // Don't add anything - the text A wanted to retain is deleted by B
    }
    // Case 6: A delete, B delete (both delete same text)
    else if (a.type === OP_DELETE && b.type === OP_DELETE) {
      // Don't add anything - text is already deleted by B
    }

    // Consume the processed length from both operations
    a.count -= minLength;
    b.count -= minLength;

    // Move to next operation if current one is exhausted
    if (a.count === 0) indexA++;
    if (b.count === 0) indexB++;
  }

  return normalizeOps(result);
}

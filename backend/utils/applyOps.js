import {
  OP_RETAIN,
  OP_INSERT,
  OP_DELETE,
} from "../constants/operationTypes.js";

export function applyOperations(baseCode, operations) {
  let result = "";
  let textIndex = 0;

  // Handle edge case where operations is null or undefined
  if (!operations || !Array.isArray(operations)) {
    return baseCode;
  }

  // Handle edge case where baseCode is null or undefined
  if (!baseCode) {
    baseCode = "";
  }

  for (const op of operations) {
    if (!op || typeof op !== "object") {
      continue; // Skip invalid operations
    }

    if (op.type === OP_RETAIN) {
      // Handle case where retain goes past end of text
      const retainCount = Math.min(op.count || 0, baseCode.length - textIndex);
      if (retainCount > 0) {
        result += baseCode.substring(textIndex, textIndex + retainCount);
        textIndex += retainCount;
      }
      // If we're trying to retain past the end, just ignore the excess
    } else if (op.type === OP_INSERT) {
      result += op.chars || "";
    } else if (op.type === OP_DELETE) {
      // Handle case where delete goes past end of text
      const deleteCount = Math.min(op.count || 0, baseCode.length - textIndex);
      textIndex += deleteCount;
      // If we're trying to delete past the end, just ignore the excess
    }
  }

  // Append any remaining text
  if (textIndex < baseCode.length) {
    result += baseCode.substring(textIndex);
  }

  return result;
}

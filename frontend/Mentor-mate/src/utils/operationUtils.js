import {
  OP_RETAIN,
  OP_INSERT,
  OP_DELETE,
} from "../constants/operationTypes.js";

/**
 * Apply operations to a text string
 * @param {string} text - The base text to apply operations to
 * @param {Array} operations - Array of operations to apply
 * @returns {string} - The resulting text after applying operations
 */
export function applyOperations(text, operations) {
  let result = "";
  let textIndex = 0;

  for (const op of operations) {
    if (op.type === OP_RETAIN) {
      if (textIndex + op.count > text.length) {
        throw new Error("Cannot retain past end of text");
      }
      result += text.substring(textIndex, textIndex + op.count);
      textIndex += op.count;
    } else if (op.type === OP_INSERT) {
      result += op.chars;
    } else if (op.type === OP_DELETE) {
      if (textIndex + op.count > text.length) {
        throw new Error("Cannot delete past end of text");
      }
      textIndex += op.count;
    }
  }

  // Append any remaining text
  if (textIndex < text.length) {
    result += text.substring(textIndex);
  }

  return result;
}

/**
 * Create a retain operation
 * @param {number} count - Number of characters to retain
 * @returns {Object} - Retain operation
 */
export function createRetainOp(count) {
  return { type: OP_RETAIN, count };
}

/**
 * Create an insert operation
 * @param {string} chars - Characters to insert
 * @returns {Object} - Insert operation
 */
export function createInsertOp(chars) {
  return { type: OP_INSERT, chars };
}

/**
 * Create a delete operation
 * @param {number} count - Number of characters to delete
 * @returns {Object} - Delete operation
 */
export function createDeleteOp(count) {
  return { type: OP_DELETE, count };
}

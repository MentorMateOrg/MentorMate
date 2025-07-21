import { OP_RETAIN, OP_INSERT, OP_DELETE } from '../constants/operationTypes.js';

// Create operations
export function createRetainOp(count) {
  return { type: OP_RETAIN, count };
}

export function createInsertOp(chars) {
  return { type: OP_INSERT, chars };
}

export function createDeleteOp(count) {
  return { type: OP_DELETE, count };
}

// Normalize operations (combine adjacent operations of same type)
export function normalizeOps(ops) {
  if (!ops.length) return [];

  const result = [];
  let lastOp = null;

  for (const op of ops) {
    if (!lastOp) {
      lastOp = {...op};
      result.push(lastOp);
      continue;
    }

    if (op.type === lastOp.type) {
      if (op.type === OP_RETAIN || op.type === OP_DELETE) {
        lastOp.count += op.count;
      } else if (op.type === OP_INSERT) {
        lastOp.chars += op.chars;
      }
    } else {
      lastOp = {...op};
      result.push(lastOp);
    }
  }

  return result;
}

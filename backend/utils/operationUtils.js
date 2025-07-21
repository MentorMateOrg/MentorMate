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

/**
 * Compose two operations into a single operation
 * op1 + op2 = compose(op1, op2)
 */
export function composeOps(op1, op2) {
  const result = [];
  let index1 = 0;
  let index2 = 0;

  while (index1 < op1.length || index2 < op2.length) {
    // Case 1: op1 is exhausted
    if (index1 >= op1.length) {
      result.push({...op2[index2]});
      index2++;
      continue;
    }

    // Case 2: op2 is exhausted
    if (index2 >= op2.length) {
      result.push({...op1[index1]});
      index1++;
      continue;
    }

    const a = op1[index1];
    const b = op2[index2];

    // Case 3: op1 is insert
    if (a.type === OP_INSERT) {
      result.push({...a});
      index1++;
      continue;
    }

    // Case 4: op1 is delete
    if (a.type === OP_DELETE) {
      result.push({...a});
      index1++;
      continue;
    }

    // Case 5: op1 is retain
    if (a.type === OP_RETAIN) {
      // Case 5.1: op2 is insert
      if (b.type === OP_INSERT) {
        result.push({...b});
        index2++;
        continue;
      }

      // Case 5.2: op2 is delete
      if (b.type === OP_DELETE) {
        const minLength = Math.min(a.count, b.count);
        result.push(createDeleteOp(minLength));

        if (a.count === minLength) index1++;
        else a.count -= minLength;

        if (b.count === minLength) index2++;
        else b.count -= minLength;

        continue;
      }

      // Case 5.3: op2 is retain
      if (b.type === OP_RETAIN) {
        const minLength = Math.min(a.count, b.count);
        result.push(createRetainOp(minLength));

        if (a.count === minLength) index1++;
        else a.count -= minLength;

        if (b.count === minLength) index2++;
        else b.count -= minLength;

        continue;
      }
    }
  }

  return normalizeOps(result);
}

/**
 * Invert an operation
 * op + invert(op) = empty operation
 */
export function invertOps(ops, text) {
  const result = [];
  let textIndex = 0;

  for (const op of ops) {
    if (op.type === OP_RETAIN) {
      result.push(createRetainOp(op.count));
      textIndex += op.count;
    } else if (op.type === OP_INSERT) {
      result.push(createDeleteOp(op.chars.length));
    } else if (op.type === OP_DELETE) {
      result.push(createInsertOp(text.substring(textIndex, textIndex + op.count)));
      textIndex += op.count;
    }
  }

  return normalizeOps(result);
}

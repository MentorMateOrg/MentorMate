import {
  OP_RETAIN,
  OP_INSERT,
  OP_DELETE,
} from "../constants/operationTypes.js";

export function applyOperations(baseCode, operations) {
  let result = "";
  let textIndex = 0;
  for (const op of operations) {
    if (op.type === OP_RETAIN) {
      if (textIndex + op.count > baseCode.length) {
        throw new Error("Cannot retain past end of text");
      }
      result += baseCode.substring(textIndex, textIndex + op.count);
      textIndex += op.count;
    } else if (op.type === OP_INSERT) {
      result += op.chars;
    } else if (op.type === OP_DELETE) {
      if (textIndex + op.count > baseCode.length) {
        throw new Error("Cannot delete past end of text");
      }
      textIndex += op.count;
    }
  }
  if (textIndex < baseCode.length) {
    result += baseCode.substring(textIndex);
  }
  return result;
}

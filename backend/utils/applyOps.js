import { text } from "express";
import { OP_RETAIN, OP_INSERT, OP_DELETE } from "../constants/operationTypes";

export function applyOperations(baseCode, operations) {
  let result = "";
  let textIndex = 0;
  for (const op of operations) {
    if (op.type === OP_RETAIN) {
      if (textIndex + op.count > text.length) {
        throw new Error("Cannot retain past end of text");
      }
      result += text.substring(textIndex, textIndex + op.count);
      textIndex += op.count;
    } else if (op.type === INSERT) {
      result += op.chars;
    } else if (op.type === OP_DELETE) {
      if (textIndex + op.count > text.length) {
        throw new Error("Cannot delete past end of text");
      }
      textIndex += op.count;
    }
  }
  if (textIndex < text.length) {
    result += text.substring(textIndex);
  }
  return result;
}

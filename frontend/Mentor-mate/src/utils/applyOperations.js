// Frontend version of applyOperations function
const applyOperations = (baseCode, operations) => {
  const DELETE = "delete";
  const INSERT = "insert";
  let result = baseCode;
  for (const op of operations) {
    if (op.type === DELETE) {
      result = result.slice(0, op.pos) + result.slice(op.pos + op.length);
    } else if (op.type === INSERT) {
      result = result.slice(0, op.pos) + op.text + result.slice(op.pos);
    }
  }
  return result;
};

export default applyOperations;

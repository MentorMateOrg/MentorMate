export default function generateDeltas(oldStr, newStr) {
  const DELETE = "delete";
  const INSERT = "insert";
  let ops = [];
  let i = 0;

  //Find common prefix
  while (i < oldStr.length && i < newStr.length && oldStr[i] === newStr[i]) {
    i++;
  }

  //Delete old tail
  if (i < oldStr.length) {
    ops.push({ type: DELETE, pos: i, length: oldStr.length - 1 });

  }
  //Insert new tail
  if (i < newStr.length) {
    ops.push({ type: INSERT, pos: i, text: newStr.slice(i) });
  }
  return ops;
}

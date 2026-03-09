export function randomHash<K>(arr: K[], text: string) {
  return arr[
    text.split("").reduce((acc, curr) => curr.charCodeAt(0) + acc, 0) %
      arr.length
  ];
}

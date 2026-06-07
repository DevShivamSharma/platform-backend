const ROMAN = [
  ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
  ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
  ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1],
];

export function roman(num) {
  if (num <= 0) return '';
  let n = Math.floor(num);
  let out = '';
  for (const [sym, val] of ROMAN) {
    while (n >= val) {
      out += sym;
      n -= val;
    }
  }
  return out;
}

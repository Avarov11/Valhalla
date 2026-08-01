export function formatPrice(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const text = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2);
  return `${text} EGP`;
}

export function calculateWeightedAverage(
  oldQty: number,
  oldAvgPrice: number,
  newQty: number,
  newPrice: number,
): number {
  if (oldQty + newQty === 0) return 0;
  return (oldQty * oldAvgPrice + newQty * newPrice) / (oldQty + newQty);
}

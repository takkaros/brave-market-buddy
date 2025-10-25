export const getRiskColorValue = (score: number): string => {
  if (score < 30) return 'hsl(142, 76%, 36%)';
  if (score < 50) return 'hsl(45, 93%, 47%)';
  if (score < 70) return 'hsl(25, 95%, 53%)';
  return 'hsl(0, 84%, 60%)';
};

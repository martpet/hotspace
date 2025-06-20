export function getResponsiveMediaStyles(width: number, height: number) {
  const ratio = Number((height / width).toFixed(4));
  const MAX_HEIGHT = 500;

  return {
    aspectRatio: `1/${ratio}`,
    width: Math.round(MAX_HEIGHT / ratio),
  };
}

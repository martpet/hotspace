export function getResponsiveMediaStyle(width: number, height: number) {
  const ratio = height / width;
  const MAX_HEIGHT = 500;

  return {
    aspectRatio: `1/${ratio}`,
    width: Math.round(MAX_HEIGHT / ratio),
  };
}

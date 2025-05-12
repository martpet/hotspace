export function getSnsEndpoint(region: string) {
  return `https://sns.${region}.amazonaws.com`;
}

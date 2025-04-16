export function getSqsEndpoint(region: string) {
  return `https://sqs.${region}.amazonaws.com`;
}

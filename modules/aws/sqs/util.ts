export function getSqsBaseUrl(region: string) {
  return `https://sqs.${region}.amazonaws.com`;
}

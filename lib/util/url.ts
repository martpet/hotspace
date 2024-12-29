export function fileUrlToRelative(fileUrl: string) {
  const absolutePath = new URL(fileUrl).pathname;
  return absolutePath.replace(Deno.cwd(), "");
}

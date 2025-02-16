import { Path } from "./types.ts";

export function fileUrlToRelative(fileUrl: string) {
  const absolutePath = new URL(fileUrl).pathname;
  return absolutePath.replace(Deno.cwd(), "");
}

export function parsePath(pathname: string): Path {
  const segments = pathToSegments(pathname);
  if (!segments.length) throw new Error("Pathname has no segments");
  return {
    segments,
    parentSegments: segments.slice(0, -1),
    lastSegment: segments.at(-1)!,
    isRootSegment: segments.length === 1,
    isDir: pathname.endsWith("/"),
  };
}

export function pathToSegments(path: string) {
  return path.split("/").filter((part) => part !== "");
}

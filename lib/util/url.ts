import type { Path } from "./types.ts";

export function fileUrlToRelative(fileUrl: string) {
  const absolutePath = new URL(fileUrl).pathname;
  return absolutePath.replace(Deno.cwd(), "");
}

export function parsePathname(pathname: string): Path {
  const segments = pathnameToSegments(pathname);

  if (segments.length) {
    return {
      isRoot: false,
      isDir: pathname.endsWith("/"),
      isRootSegment: segments.length === 1,
      segments,
      parentSegments: segments.slice(0, -1),
      lastSegment: segments.at(-1)!,
    };
  } else {
    return {
      isRoot: true,
      isDir: true,
      isRootSegment: false,
      segments: [],
      parentSegments: null,
      lastSegment: null,
    };
  }
}

export function pathnameToSegments(path: string) {
  return path.split("/").filter(Boolean);
}

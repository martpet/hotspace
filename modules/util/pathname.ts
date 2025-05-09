export interface RootPath {
  isRoot: true;
  isDir: true;
  isRootSegment: false;
  segments: [];
  parentSegments: null;
  lastSegment: null;
}

export interface NonRootPath {
  isRoot: false;
  isDir: boolean;
  isRootSegment: boolean;
  segments: string[];
  parentSegments: string[];
  lastSegment: string;
}

export type Path = RootPath | NonRootPath;

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

export function segmentsToPathname(
  segments: string[],
  opt: { isDir?: boolean } = {},
) {
  let str = `/${segments.join("/")}`;
  if (opt.isDir) str += "/";
  return str;
}

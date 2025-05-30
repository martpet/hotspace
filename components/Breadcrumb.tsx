import { type NonRootPath, parsePathname } from "$util";
import { AppContext } from "../util/types.ts";

export interface BreadcrumbProps {
  noTrailingSlash?: boolean;
}

export default function Breadcrumb(props: BreadcrumbProps, ctx: AppContext) {
  const { noTrailingSlash } = props;
  const path = parsePathname(ctx.url.pathname);

  return (
    <nav aria-label="Breadcrumb" class="breadcrumb">
      <ol>
        <li>
          <a href="/">HotSpace</a>
        </li>
        {path.parentSegments &&
          path.parentSegments.map((segment, index) => (
            <li>
              <a href={getBreadcrumbHref({ path, index, noTrailingSlash })}>
                {segment}
              </a>
            </li>
          ))}
      </ol>
    </nav>
  );
}

function getBreadcrumbHref(options: {
  path: NonRootPath;
  index: number;
  noTrailingSlash?: boolean;
}) {
  const { path, index, noTrailingSlash } = options;

  if (noTrailingSlash) {
    return "/" + path.segments.slice(0, index + 1).join("/");
  }

  const { parentSegments, isDir } = path;
  const isLastSegment = index + 1 === parentSegments.length;

  if (!isDir && isLastSegment) {
    return "./";
  }

  let repeatTimes = parentSegments.length - index;

  if (!isDir) {
    repeatTimes -= 1;
  }

  return "../".repeat(repeatTimes);
}

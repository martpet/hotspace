import { type NonRootPath, parsePathname } from "$util";
import { AppContext } from "../util/types.ts";

export default function Breadcrumb(_: unknown, ctx: AppContext) {
  const path = parsePathname(ctx.url.pathname);

  return (
    <nav aria-label="Breadcrumb" class="breadcrumb">
      <ol>
        <li>
          <a href="/">HotSpace</a>
        </li>
        {path.parentSegments &&
          path.parentSegments.map((segment, i) => (
            <li>
              <a href={getBreadcrumbHref(path, i)}>{segment}</a>
            </li>
          ))}
      </ol>
    </nav>
  );
}

function getBreadcrumbHref(path: NonRootPath, index: number) {
  const { parentSegments, isDir } = path;
  const isLastSegment = index + 1 === parentSegments.length;
  if (!isDir && isLastSegment) return "./";
  let times = parentSegments.length - index;
  if (!isDir) times -= 1;
  return "../".repeat(times);
}

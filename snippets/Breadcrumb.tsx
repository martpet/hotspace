import { AppContext } from "../util/types.ts";
import { parsePath, type Path } from "../util/url.ts";

export default function Breadcrumb(_: unknown, ctx: AppContext) {
  const { user } = ctx.state;
  const path = parsePath(ctx.url.pathname);

  return (
    <nav aria-label="Breadcrumb" class="breadcrumb">
      <ol>
        <li>
          {user ? <a href="/">HotSpace</a> : "HotSpace"}
        </li>
        {path.parentSegments.map((segment, i) => (
          <li>
            <a href={getBreadcrumbHref(path, i)}>{segment}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function getBreadcrumbHref(path: Path, index: number) {
  const { parentSegments, isDir } = path;
  const isLastSegment = index + 1 === parentSegments.length;
  if (!isDir && isLastSegment) return "./";
  let times = parentSegments.length - index;
  if (!isDir) times -= 1;
  return "../".repeat(times);
}

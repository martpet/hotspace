import { AppContext } from "../util/types.ts";
import { parsePath } from "../util/url.ts";

export default function Breadcrumb(_: unknown, ctx: AppContext) {
  const { user } = ctx.state;
  const { pathname } = ctx.url;
  const isDir = pathname.endsWith("/");
  const path = parsePath(ctx.url.pathname);

  return (
    <nav aria-label="Breadcrumb" class="breadcrumb">
      <ol>
        <li>
          {user ? <a href="/">HotSpace</a> : "HotSpace"}
        </li>
        {path.segments.map((seg, i) => {
          const relativeUrl = !isDir && i === path.segments.length - 1
            ? "./"
            : "../".repeat(path.segments.length - i);

          return (
            <li>
              <a href={relativeUrl}>{seg}</a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

import { AppContext } from "../util/types.ts";
import { getPathSegments } from "../util/url.ts";

export default function Breadcrumb(_: unknown, ctx: AppContext) {
  const { user } = ctx.state;
  const { pathname } = ctx.url;
  const isDir = pathname.endsWith("/");
  const { parentPathSegments: segments } = getPathSegments(ctx.url.pathname);

  return (
    <nav aria-label="Breadcrumb" class="breadcrumb">
      <ol>
        <li>
          {user ? <a href="/">HotSpace</a> : "HotSpace"}
        </li>
        {segments.map((seg, i) => {
          const relativeUrl = !isDir && i === segments.length - 1
            ? "./"
            : "../".repeat(segments.length - i);

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

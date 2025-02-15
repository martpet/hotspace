import { AppContext } from "../util/types.ts";
import { parsePathname } from "../util/url.ts";

export default function Breadcrumb(_: unknown, ctx: AppContext) {
  const { user } = ctx.state;
  const { parentPathSegments, isDir } = parsePathname(ctx.url.pathname);

  return (
    <nav aria-label="Breadcrumb" class="breadcrumb">
      <ol>
        <li>
          {user ? <a href="/">HotSpace</a> : "HotSpace"}
        </li>
        {parentPathSegments.map((seg, i) => {
          const relativeUrl = !isDir && i === parentPathSegments.length - 1
            ? "./"
            : "../".repeat(parentPathSegments.length - i);

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

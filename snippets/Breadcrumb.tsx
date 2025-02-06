import { AppContext } from "../util/types.ts";
import { parsePathname } from "../util/url.ts";

export default function Breadcrumb(_: unknown, ctx: AppContext) {
  const { user } = ctx.state;
  const path = parsePathname(ctx.url.pathname);
  const segments = path.parentSegments;

  return (
    <nav aria-label="Breadcrumb" class="breadcrumb">
      <ol>
        <li>
          {user ? <a href="/">HotSpace</a> : "HotSpace"}
        </li>
        {segments.map((seg, i) => {
          const relativeUrl = !path.isDir && i === segments.length - 1
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

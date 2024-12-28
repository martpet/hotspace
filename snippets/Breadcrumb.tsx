import { AppContext } from "../util/types.ts";
import { getPathParts } from "../util/url.ts";

export default function Breadcrumb(_: unknown, ctx: AppContext) {
  const { user } = ctx.state;
  const { parentPathParts: parts } = getPathParts(ctx.url.pathname);

  return (
    <nav aria-label="Breadcrumb" class="breadcrumb">
      <ol>
        <li>
          {user ? <a href="/">Home</a> : "Home"}
        </li>
        {parts.map((part, i) => (
          <li>
            <a href={"../".repeat(parts.length - i)}>{part}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

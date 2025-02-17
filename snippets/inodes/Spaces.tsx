import { decodeTime } from "@std/ulid";
import type { AppContext, DirNode } from "../../util/types.ts";

interface Props {
  spaces: DirNode[];
}

export default function Spaces({ spaces }: Props, ctx: AppContext) {
  const dateFmt = new Intl.DateTimeFormat(ctx.locale, { dateStyle: "medium" });

  return (
    <div id="spaces">
      {spaces.map((dir) => (
        <article>
          <h1>
            <a href={`${dir.name}/`} class="name">{dir.name}</a>
          </h1>
          <p>Created on {dateFmt.format(decodeTime(dir.id))}</p>
        </article>
      ))}
    </div>
  );
}

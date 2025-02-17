import { decodeTime } from "@std/ulid";
import { type JSX } from "preact";
import type { AppContext, DirNode } from "../../util/types.ts";

interface Props extends JSX.HTMLAttributes<HTMLDivElement> {
  spaces: DirNode[];
}

export default function Spaces(props: Props, ctx: AppContext) {
  const { spaces, ...divProps } = props;
  const dateFmt = new Intl.DateTimeFormat(ctx.locale, { dateStyle: "medium" });

  return (
    <div {...divProps}>
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

import { type JSX } from "preact";
import type { DirNode } from "../../util/types.ts";
import ButtonCreateDir from "./ButtonCreateDir.tsx";

interface Props extends JSX.HTMLAttributes<HTMLDivElement> {
  spaces: DirNode[];
}

export default function Spaces(props: Props) {
  const { spaces, ...divProps } = props;

  return (
    <>
      <div {...divProps}>
        {spaces.map((dir) => (
          <article class="card">
            <a href={`${dir.name}/`} class="name">
              <h1 class="title">{dir.name}</h1>
            </a>
          </article>
        ))}
      </div>
      <ButtonCreateDir isRoot />
    </>
  );
}

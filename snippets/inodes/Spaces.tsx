import { type JSX } from "preact";
import type { DirNode } from "../../util/types.ts";
import ButtonCreateDir from "./ButtonCreateDir.tsx";

interface Props extends JSX.HTMLAttributes<HTMLUListElement> {
  spaces: DirNode[];
}

export default function Spaces(props: Props) {
  const { spaces, ...divProps } = props;

  let classes = "spaces-list";
  if (divProps.class) classes += ` ${divProps.class}`;

  return (
    <>
      <ul {...divProps} class={classes}>
        {spaces.map((dir) => (
          <li>
            <a href={`${dir.name}/`} class="name">{dir.name}</a>
          </li>
        ))}
      </ul>
      <ButtonCreateDir isRoot />
    </>
  );
}

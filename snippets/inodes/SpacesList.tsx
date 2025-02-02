import { type JSX } from "preact";
import type { DirNode } from "../../util/types.ts";

interface Props extends JSX.HTMLAttributes<HTMLUListElement> {
  dirs: DirNode[];
}

export default function SpacesList({ dirs, ...ulProps }: Props) {
  let classes = `spaces-list`;
  if (ulProps.class) classes += ` ${ulProps.class}`;

  return (
    <ul {...ulProps} class={classes}>
      {dirs.map((dir) => (
        <li>
          <a href={`${dir.name}`}>{dir.name}</a>
        </li>
      ))}
    </ul>
  );
}

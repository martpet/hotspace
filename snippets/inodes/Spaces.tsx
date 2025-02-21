import type { DirNode } from "../../util/types.ts";

interface Props {
  spaces: DirNode[];
}

export default function Spaces({ spaces }: Props) {
  return (
    <ul id="spaces">
      {spaces.map((dir) => (
        <li>
          <a href={`${dir.name}/`} class="name">
            {dir.name}
          </a>
        </li>
      ))}
    </ul>
  );
}

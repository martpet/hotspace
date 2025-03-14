import type { DirNode } from "../../util/types.ts";

interface Props {
  dirNodes: DirNode[];
}

export default function UserRootDirs({ dirNodes }: Props) {
  return (
    <ul id="user-root-dirs">
      {dirNodes.map((dirNode) => (
        <li>
          <a href={`${dirNode.name}/`} class="name">
            {dirNode.name}
          </a>
        </li>
      ))}
    </ul>
  );
}

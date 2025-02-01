import type { DirNode } from "../../util/types.ts";
import ButtonCreateDir from "./ButtonCreateDir.tsx";

interface Props {
  dirs: DirNode[];
}

export default function SpacesList({ dirs }: Props) {
  return (
    <>
      {dirs.length > 0 && (
        <ul class="space-list">
          {dirs.map((dir) => (
            <li>
              <a href={`${dir.name}`}>{dir.name}</a>
            </li>
          ))}
        </ul>
      )}
      <ButtonCreateDir isRoot />
    </>
  );
}

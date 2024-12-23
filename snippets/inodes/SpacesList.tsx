import type { DirNode } from "../../util/types.ts";

interface Props {
  dirs: DirNode[];
}

export default function SpacesList({ dirs }: Props) {
  if (!dirs.length) {
    return null;
  }

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
    </>
  );
}

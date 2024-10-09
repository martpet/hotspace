import { Space } from "../../util/types.ts";

interface Props {
  spaces: Space[];
}

export default function SpacesList({ spaces }: Props) {
  return (
    <>
      {!spaces.length
        ? (
          <p>
            A <em>space</em> is a place for your files.
          </p>
        )
        : (
          <ul>
            {spaces.map((space) => (
              <li>
                <a href={`/${space.name}`}>{space.name}</a>
              </li>
            ))}
          </ul>
        )}
    </>
  );
}

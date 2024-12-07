import { asset } from "$server";
import type { Space } from "../../util/types.ts";

interface Props {
  space: Space;
}

export default function ButtonDeleteSpace({ space }: Props) {
  return (
    <>
      <script type="module" src={asset("space.js")} />

      <button
        id="open-del-space-dialog"
        type="button"
        disabled
        data-space-name={space.name}
      >
        Delete Space
      </button>
    </>
  );
}

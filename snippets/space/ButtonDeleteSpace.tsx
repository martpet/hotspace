import { asset } from "$server";
import type { Space } from "../../util/types.ts";

interface Props {
  space: Space;
}

export default function ButtonDeleteSpace({ space }: Props) {
  return (
    <>
      <script type="module" src={asset("space.js")} />

      <button id="open-delete-space" type="button" disabled>
        Delete Space
      </button>

      <dialog id="delete-space">
        <h2>Delete Space '{space.name}'</h2>

        <form method="post" action="/spaces/delete" class="basic-form">
          <p class="alert warning">
            Are you sure you want to delete space <strong>{space.name}</strong>?
            <br />This action cannot be undone.
          </p>
          <input type="hidden" name="spaceName" value={space.name} />
          <label>
            Enter space name:
            <input type="text" required pattern={space.name} />
          </label>
          <footer>
            <button form="close-space-dialog">Cancel</button>
            <button>Delete Space Forever</button>
          </footer>
        </form>
        <form method="dialog" id="close-space-dialog" />
      </dialog>
    </>
  );
}

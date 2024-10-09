import type { Space } from "../../util/types.ts";
import { asset } from "../../util/url.ts";

interface Props {
  space: Space;
}

export default function DeleteSpaceButton({ space }: Props) {
  return (
    <>
      <script type="module" src={asset("space.mjs")} />

      <button id="open-delete-space" type="button" disabled>
        Delete Space
      </button>

      <dialog id="delete-space">
        <h2>Delete Space '{space.name}'</h2>
        <form
          class="basic-form"
          method="post"
          action="/spaces/delete"
        >
          <p class="alert warning">
            Are you sure you want to delete space <strong>{space.name}</strong>?
            <br />This action cannot be undone.
          </p>
          <input type="hidden" name="spaceName" value={space.name} />
          <label>
            Enter space name:
            <input type="text" pattern={space.name} required />
          </label>
          <footer>
            <button type="reset" id="cancel-delete-space">
              Cancel
            </button>
            <button>Delete Space Forever</button>
          </footer>
        </form>
      </dialog>
    </>
  );
}

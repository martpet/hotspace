import { asset } from "$server";
import {
  SPACE_DESCRIPTION_CONSTRAINTS,
  SPACE_NAME_CONSTRAINTS,
} from "../../util/constraints.ts";

export default function ButtonCreateSpace() {
  return (
    <>
      <script type="module" src={asset("space.js")} />

      <button id="open-create-space" type="button" disabled>
        Create New Space…
      </button>

      <dialog id="create-space">
        <h2>Create New Space</h2>
        <form method="post" action="/spaces" class="basic-form">
          <p role="alert" class="error" />
          <label>
            Name:
            <input
              name="name"
              type="text"
              required
              {...SPACE_NAME_CONSTRAINTS}
            />
          </label>
          <label>
            <span>
              Description: <small>(optional)</small>
            </span>
            <textarea
              name="description"
              {...SPACE_DESCRIPTION_CONSTRAINTS}
            >
            </textarea>
          </label>
          <footer>
            <button type="reset" id="cancel-create-space">Cancel</button>
            <button id="submit-create-space">Create Space</button>
          </footer>
        </form>
      </dialog>
    </>
  );
}

import {
  SPACE_DESCRIPTION_CONSTRAINTS,
  SPACE_NAME_CONSTRAINTS,
} from "../../util/constraints.ts";
import { asset } from "../../util/url.ts";
import ButtonSpinner from "../ButtonSpinner.tsx";

export default function CreateSpaceButton() {
  return (
    <>
      <button id="open-create-space" type="button" disabled>
        Create New Space…
      </button>

      <script type="module" src={asset("space.mjs")} />

      <dialog id="create-space">
        <h2>Create New Space</h2>
        <form class="basic-form" method="post" action="/spaces">
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
              Description <small>(optional)</small>:
            </span>
            <textarea
              name="description"
              {...SPACE_DESCRIPTION_CONSTRAINTS}
            >
            </textarea>
          </label>
          <footer>
            <button type="reset" id="cancel-create-space">Cancel</button>
            <ButtonSpinner id="submit-create-space">Create Space</ButtonSpinner>
          </footer>
        </form>
      </dialog>
    </>
  );
}

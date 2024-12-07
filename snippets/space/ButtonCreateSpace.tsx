import { asset } from "$server";
import {
  SPACE_DESCRIPTION_CONSTRAINTS,
  SPACE_NAME_CONSTRAINTS,
} from "../../util/constraints.ts";

export default function ButtonCreateSpace() {
  return (
    <>
      <script type="module" src={asset("space.js")} />

      <button id="open-create-space-dialog" type="button" disabled>
        Create New Space…
      </button>

      <template id="create-space-template">
        <input name="name" type="text" required {...SPACE_NAME_CONSTRAINTS} />
        <textarea name="description" {...SPACE_DESCRIPTION_CONSTRAINTS} />
      </template>
    </>
  );
}

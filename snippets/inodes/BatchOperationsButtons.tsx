import { asset } from "$server";

export default function BatchOperationsButtons() {
  return (
    <div id="batch-operations-buttons" hidden>
      <script type="module" src={asset("inodes/batch_operations.js")} />

      <button id="batch-delete-button">
        Delete Selected
      </button>
    </div>
  );
}

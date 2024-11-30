import MessagePreview from "./MessagePreview.tsx";

export default function DeleteMessageDialog() {
  return (
    <dialog id="edit-chat-msg-dialog" class="chat-msg-dialog">
      <h2>Edit Message</h2>
      <form class="basic-form">
        <MessagePreview editMode />
        <footer>
          <button formmethod="dialog" formnovalidate>Cancel</button>
          <button class="submit">Submit</button>
        </footer>
      </form>
    </dialog>
  );
}

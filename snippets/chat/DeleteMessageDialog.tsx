import MessagePreview from "./MessagePreview.tsx";

export default function DeleteMessageDialog() {
  return (
    <dialog id="delete-chat-msg-dialog" class="chat-msg-dialog">
      <h2>Delete Message</h2>
      <p class="alert warning">Are you sure you want to delete this message?</p>
      <MessagePreview />
      <form method="dialog" class="basic-form">
        <footer>
          <button>Cancel</button>
          <button autofocus class="submit">Delete Message</button>
        </footer>
      </form>
    </dialog>
  );
}

import MessageTextarea from "./MessageTextarea.tsx";

interface Props {
  editMode?: boolean;
}

export default function MessagePreview({ editMode }: Props) {
  return (
    <blockquote class="preview">
      <p class="chat-msg" />
      {editMode && <MessageTextarea />}
    </blockquote>
  );
}

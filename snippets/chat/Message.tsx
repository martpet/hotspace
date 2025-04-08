import { CHAT_MSG_FOLLOWUP_DURATION, type ChatMessage } from "$chat";
import { type JSX } from "preact";
import type { AppContext } from "../../util/types.ts";
import MessageEditedTag from "./MessageEditedTag.tsx";

interface Props extends JSX.HTMLAttributes<HTMLParagraphElement> {
  msg: ChatMessage;
  prevMsg?: ChatMessage;
  timeFmt: Intl.DateTimeFormat;
  dateTimeFmt: Intl.DateTimeFormat;
  canModerate: boolean;
}

export default function Message(props: Props, ctx: AppContext) {
  const { msg, timeFmt, dateTimeFmt, prevMsg, canModerate, ...elProps } = props;
  const { user } = ctx.state;

  const dateIso = msg.createdAt.toISOString();
  const canEdit = msg.username === user?.username;
  const canDelete = canEdit || canModerate;

  const classes = ["chat-msg"];
  if (elProps.class) classes.push(elProps.class as string);
  if (isFollowUp(msg, prevMsg)) classes.push("follow-up");
  if (canEdit) classes.push("edit");
  if (canDelete) classes.push("del");

  return (
    <p
      {...elProps}
      id={msg.id}
      class={classes.join(" ")}
      data-username={msg.username}
    >
      <b class="username">{msg.username}</b>
      <time datetime={dateIso}>{timeFmt.format(msg.createdAt)}</time>
      <span class="main">
        <span class="text">{msg.text}</span>
        {msg.editedAt && (
          <MessageEditedTag
            editedAt={msg.editedAt}
            dateTimeFmt={dateTimeFmt}
          />
        )}
      </span>
    </p>
  );
}

function isFollowUp(msg: ChatMessage, prevMsg?: ChatMessage) {
  if (!prevMsg || prevMsg.username !== msg.username) return false;
  const diff = Math.abs(msg.createdAt.getTime() - prevMsg.createdAt.getTime());
  return diff < CHAT_MSG_FOLLOWUP_DURATION;
}

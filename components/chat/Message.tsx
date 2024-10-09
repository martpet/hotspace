import { type JSX } from "preact";
import type { ChatMessage } from "../../util/chat_types.ts";
import { CHAT_MSG_FOLLOWUP_DURATION } from "../../util/consts.ts";

interface Props extends JSX.HTMLAttributes<HTMLParagraphElement> {
  msg: ChatMessage;
  prevMsg?: ChatMessage;
  timeFmt: Intl.DateTimeFormat;
}

export function Message(props: Props) {
  const { msg, prevMsg, timeFmt, ...rest } = props;

  let classes = "msg";
  if (rest.class) classes += ` ${rest.class}`;
  if (isFollowUp(msg, prevMsg)) classes += " follow-up";

  return (
    <p id={msg.id} {...rest} class={classes}>
      <b class="name">{msg.displayName}</b>{" "}
      <time datetime={msg.createdAt.toISOString()}>
        {timeFmt.format(msg.createdAt)}
      </time>
      <span class="text">{msg.text}</span>
    </p>
  );
}

function isFollowUp(
  msg: ChatMessage,
  prevMsg?: ChatMessage,
) {
  if (!prevMsg || prevMsg.userId !== msg.userId) return false;
  const diff = Math.abs(msg.createdAt.getTime() - prevMsg.createdAt.getTime());
  return diff < CHAT_MSG_FOLLOWUP_DURATION;
}

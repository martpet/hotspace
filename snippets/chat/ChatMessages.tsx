import { type ChatMessage } from "$chat";
import { chatIntlFmt } from "../../util/chat.ts";
import type { AppContext } from "../../util/types.ts";
import DayHeading from "./DayHeading.tsx";
import Message from "./Message.tsx";

interface Props {
  messages: ChatMessage[];
  olderMsgsCursor: string | null;
  isAdmin: boolean;
}

export default function ChatMessages(props: Props, ctx: AppContext) {
  const { messages, olderMsgsCursor, isAdmin } = props;
  const { locale } = ctx;
  const { dateFmt, timeFmt } = chatIntlFmt(locale);

  const msgsByDay = Object.groupBy(
    messages,
    (msg) => dateFmt.format(msg.createdAt),
  );

  return (
    <>
      {olderMsgsCursor && (
        <p id="chat-msgs-loader" class="spinner-sm">
          Loading older messages
        </p>
      )}

      <p id="chat-beginning" class="splash" hidden={!!olderMsgsCursor}>
        <em>This is the beginning of the conversation.</em>
      </p>

      <div
        id="chat-msgs"
        role="log"
        data-older-msgs-cursor={olderMsgsCursor}
        data-last-seen-feed-item-id={messages.at(-1)?.feedItemId}
      >
        {Object.entries(msgsByDay).map(([day, msgs]) => (
          <>
            <DayHeading>{day}</DayHeading>
            {msgs?.map((msg, i) => (
              <Message
                msg={msg}
                prevMsg={msgs[i - 1]}
                isAdmin={isAdmin}
                dateFmt={dateFmt}
                timeFmt={timeFmt}
              />
            ))}
          </>
        ))}
      </div>
    </>
  );
}

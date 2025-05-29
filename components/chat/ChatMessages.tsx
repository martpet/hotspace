import { type ChatMessage } from "$chat";
import type { AppContext } from "../../util/types.ts";
import DayHeading from "./DayHeading.tsx";
import Message from "./Message.tsx";

interface Props {
  messages: ChatMessage[];
  olderMsgsCursor: string | null;
  canModerate: boolean;
  timeZone?: string;
}

export default function ChatMessages(props: Props, ctx: AppContext) {
  const { messages, olderMsgsCursor, canModerate, timeZone } = props;

  const { dateFmt, timeFmt, dateTimeFmt } = chatIntlFmt({
    locale: ctx.locale,
    timeZone,
  });

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
                canModerate={canModerate}
                timeFmt={timeFmt}
                dateTimeFmt={dateTimeFmt}
              />
            ))}
          </>
        ))}
      </div>
    </>
  );
}

export function chatIntlFmt(options: {
  timeZone?: string;
  locale?: string;
}) {
  const { timeZone, locale } = options;
  return {
    dateTimeFmt: new Intl.DateTimeFormat(locale, {
      dateStyle: "long",
      timeStyle: "short",
      timeZone,
    }),
    dateFmt: new Intl.DateTimeFormat(locale, {
      dateStyle: "long",
      timeZone,
    }),
    timeFmt: new Intl.DateTimeFormat(locale, {
      timeStyle: "short",
      timeZone,
    }),
  };
}

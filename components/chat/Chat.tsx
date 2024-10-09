import { type JSX } from "preact";
import type { ChatMessage } from "../../util/chat_types.ts";
import { CHAT_MSG_FOLLOWUP_DURATION } from "../../util/consts.ts";
import type { AppContext, Space, SpaceItem } from "../../util/types.ts";
import { asset } from "../../util/url.ts";
import { Message } from "./Message.tsx";
import { MessageForm } from "./MessageForm.tsx";

interface Props {
  messages: ChatMessage[];
  space: Space;
  spaceItem?: SpaceItem;
}

export default function Chat(props: Props, ctx: AppContext) {
  const { space, spaceItem, messages } = props;
  const { locale, state: { user } } = ctx;
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
  const timeFmt = new Intl.DateTimeFormat(locale, { timeStyle: "short" });
  const messagesByDay = Object.groupBy(
    messages,
    (msg) => dateFmt.format(msg.createdAt),
  );

  return (
    <>
      <link rel="stylesheet" href={asset("chat.css")} />
      <script defer src={asset("chat.js")} />

      <div
        id="chat-box"
        role="log"
        data-locale={locale}
        data-space-id={space.id}
        data-space-name={space.name}
        data-space-item-id={spaceItem?.id}
        data-space-item-name={spaceItem?.name}
        data-msg-followup-duration={CHAT_MSG_FOLLOWUP_DURATION}
        data-user-display-name={user?.username}
        data-last-seen-feed-item-id={messages.at(-1)?.feedItemId}
      >
        <div id="chat-messages">
          <p class="splash beginning">
            <em>This is the beginning of the conversation.</em>
          </p>
          {Object.entries(messagesByDay).map(([day, msgs]) => (
            <>
              <DayHeading>{day}</DayHeading>
              {msgs?.map((msg, i) => (
                <Message msg={msg} prevMsg={msgs[i - 1]} timeFmt={timeFmt} />
              ))}
            </>
          ))}
        </div>
        {user && <MessageForm />}
      </div>

      <template id="day-heading-template">
        <DayHeading />
      </template>

      <template id="msg-template">
        <Message
          msg={{
            displayName: "",
            createdAt: new Date(),
          } as ChatMessage}
          timeFmt={timeFmt}
        />
      </template>
    </>
  );
}

function DayHeading(props: JSX.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 {...props} class="day" />;
}

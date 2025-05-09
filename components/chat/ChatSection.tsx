import { CHAT_MSG_FOLLOWUP_DURATION, type ChatMessage } from "$chat";
import { type ResourcePermissions } from "$util";
import { CHAT_SUB_WITHOUT_PUSH_SUB_EXPIRES } from "../../util/consts.ts";
import type { AppContext } from "../../util/types.ts";
import { asset } from "../../util/url.ts";
import Dots from "../Dots.tsx";
import ChatFooter from "./ChatFooter.tsx";
import ChatMessages, { chatIntlFmt } from "./ChatMessages.tsx";
import DayHeading from "./DayHeading.tsx";
import Message from "./Message.tsx";
import MessageEditedTag from "./MessageEditedTag.tsx";
import Subscription from "./Subscription.tsx";

type Props = (PropsWithLazyLoad | PropsWithoutLazyLoad) & {
  enabled: boolean | undefined;
  chatId: string;
  chatTitle: string;
  perm: ResourcePermissions;
};

interface PropsWithLazyLoad {
  messages?: never;
  olderMsgsCursor?: never;
}

interface PropsWithoutLazyLoad {
  messages: ChatMessage[];
  olderMsgsCursor: string | null;
}

export default function ChatSection(props: Props, ctx: AppContext) {
  const {
    chatId,
    enabled,
    chatTitle,
    perm,
    messages,
    olderMsgsCursor,
  } = props;

  if (!enabled) {
    return <div id="chat" hidden />;
  }

  const { locale } = ctx;
  const { dateTimeFmt, timeFmt } = chatIntlFmt(locale);
  const { canModerate } = perm;

  return (
    <section
      id="chat"
      data-chat-id={chatId}
      data-chat-title={chatTitle}
      data-can-moderate={canModerate ? "1" : null}
      data-msg-followup-duration={CHAT_MSG_FOLLOWUP_DURATION}
      data-chat-sub-expires={CHAT_SUB_WITHOUT_PUSH_SUB_EXPIRES}
      data-locale={locale}
    >
      <script id="chat-script" type="module" src={asset("chat/chat.js")} />
      <link rel="modulepreload" href={asset("db.js")} />

      <h1>Chat</h1>
      <div id="chat-box">
        <div id="chat-main">
          {messages
            ? (
              <ChatMessages
                messages={messages}
                olderMsgsCursor={olderMsgsCursor}
                canModerate={canModerate}
              />
            )
            : <div id="chat-lazy-root" class="spinner-lg" />}
        </div>
        <ChatFooter />
      </div>

      <p id="chat-users-typing" aria-live="polite">
        <span class="names"></span> <Dots />
      </p>

      {ctx.state.canUseServiceWorker && <Subscription />}

      <template id="chat-template">
        <DayHeading />
        <Message
          msg={{ createdAt: new Date(), username: "" } as ChatMessage}
          canModerate={false}
          timeFmt={timeFmt}
          dateTimeFmt={dateTimeFmt}
        />
        <MessageEditedTag
          editedAt={new Date()}
          dateTimeFmt={dateTimeFmt}
        />
      </template>
    </section>
  );
}

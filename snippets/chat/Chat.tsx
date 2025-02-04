import { CHAT_MSG_FOLLOWUP_DURATION, type ChatMessage } from "$chat";
import { asset } from "$server";
import { CHAT_SUB_WITHOUT_PUSH_SUB_EXPIRES } from "../../util/consts.ts";
import type { AppContext } from "../../util/types.ts";
import Dots from "../Dots.tsx";
import ChatFooter from "./ChatFooter.tsx";
import ChatMessages, { chatIntlFmt } from "./ChatMessages.tsx";
import DayHeading from "./DayHeading.tsx";
import Message from "./Message.tsx";
import MessageEditedTag from "./MessageEditedTag.tsx";
import Subscription from "./Subscription.tsx";

type Props = (PropsWithLazyLoad | PropsWithoutLazyLoad) & {
  chatId: string;
  parentDirId?: string;
  chatTitle: string;
  isAdmin: boolean;
};

interface PropsWithLazyLoad {
  messages?: never;
  olderMsgsCursor?: never;
}

interface PropsWithoutLazyLoad {
  messages: ChatMessage[];
  olderMsgsCursor: string | null;
}

export default function Chat(props: Props, ctx: AppContext) {
  const { chatId, parentDirId, chatTitle, isAdmin, messages, olderMsgsCursor } =
    props;
  const { user } = ctx.state;
  const { locale } = ctx;
  const { dateFmt, timeFmt } = chatIntlFmt(locale);

  return (
    <>
      <script type="module" src={asset("chat/chat.js")} />
      <link rel="modulepreload" href={asset("db.js")} />

      <section
        id="chat"
        data-chat-id={chatId}
        data-parent-dir-id={parentDirId}
        data-chat-title={chatTitle}
        data-is-admin={isAdmin ? "1" : null}
        data-current-user-username={user?.username}
        data-msg-followup-duration={CHAT_MSG_FOLLOWUP_DURATION}
        data-chat-sub-expires={CHAT_SUB_WITHOUT_PUSH_SUB_EXPIRES}
        data-locale={locale}
      >
        <h1>Chat</h1>
        <div id="chat-box">
          <div id="chat-main">
            {messages
              ? (
                <ChatMessages
                  messages={messages}
                  olderMsgsCursor={olderMsgsCursor}
                  isAdmin={isAdmin}
                />
              )
              : <div id="chat-lazy-root" class="spinner" />}
          </div>
          <ChatFooter />
        </div>
        <p id="chat-users-typing" aria-live="polite">
          <span class="names"></span> <Dots />
        </p>
        {ctx.state.canUseServiceWorker && <Subscription />}
      </section>

      <template id="chat-template">
        <DayHeading />
        <Message
          msg={{ createdAt: new Date(), username: "" } as ChatMessage}
          isAdmin={false}
          timeFmt={timeFmt}
          dateFmt={dateFmt}
        />
        <MessageEditedTag
          editedAt={new Date()}
          timeFmt={timeFmt}
          dateFmt={dateFmt}
        />
      </template>
    </>
  );
}

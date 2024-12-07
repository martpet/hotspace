import { CHAT_MSG_FOLLOWUP_DURATION, type ChatMessage } from "$chat";
import { asset } from "../../lib/server/asset_path.ts";
import {
  CHAT_SUB_WITHOUT_PUSH_SUB_EXPIRES,
  chatIntlFmt,
} from "../../util/chat.ts";
import type { AppContext, Space } from "../../util/types.ts";
import Dots from "../Dots.tsx";
import ChatFooter from "./ChatFooter.tsx";
import ChatMessages from "./ChatMessages.tsx";
import DayHeading from "./DayHeading.tsx";
import Message from "./Message.tsx";
import MessageEditedTag from "./MessageEditedTag.tsx";
import Subscription from "./Subscription.tsx";

type Props =
  & {
    space: Space;
  }
  & (
    {
      lazyLoad: true;
      messages?: never;
      olderMsgsCursor?: never;
    } | {
      lazyLoad: false;
      messages: ChatMessage[];
      olderMsgsCursor: string | null;
    }
  );

export default function Chat(props: Props, ctx: AppContext) {
  const { lazyLoad, space, messages, olderMsgsCursor } = props;
  const { userAgent, state, locale } = ctx;
  const { user } = state;
  const { dateFmt, timeFmt } = chatIntlFmt(locale);
  const isAdmin = space.ownerUsername === user?.username;

  return (
    <>
      <script type="module" src={asset("chat/chat.js")} />
      <link rel="modulepreload" href={asset("db.js")} />

      <div
        id="chat"
        data-chat-id={space.id}
        data-page-title={space.name}
        data-current-user-username={user?.username}
        data-is-admin={isAdmin ? "1" : null}
        data-msg-followup-duration={CHAT_MSG_FOLLOWUP_DURATION}
        cata-chat-sub-expires={CHAT_SUB_WITHOUT_PUSH_SUB_EXPIRES}
        data-locale={locale}
      >
        <div id="chat-box">
          <div id="chat-main">
            {lazyLoad
              ? (
                <div
                  id="chat_lazy_root"
                  class="spinner"
                  data-space-id={space.id}
                >
                </div>
              )
              : (
                <ChatMessages
                  messages={messages}
                  olderMsgsCursor={olderMsgsCursor}
                  isAdmin={isAdmin}
                />
              )}
          </div>
          <div id="chat-footer">
            <ChatFooter hasUser={!!user} />
          </div>
        </div>

        <p id="chat-users-typing" aria-live="polite">
          <span class="names"></span> <Dots />
        </p>

        {/* https://caniuse.com/mdn-javascript_statements_import_service_worker_support */}
        {userAgent.browser.name !== "Firefox" && <Subscription />}

        <template id="msg-template">
          <Message
            msg={{ createdAt: new Date(), username: "" } as ChatMessage}
            isAdmin={false}
            timeFmt={timeFmt}
            dateFmt={dateFmt}
          />
        </template>

        <template id="day-heading-template">
          <DayHeading />
        </template>

        <template id="msg-edited-label-tag">
          <MessageEditedTag
            editedAt={new Date()}
            timeFmt={timeFmt}
            dateFmt={dateFmt}
          />
        </template>
      </div>
    </>
  );
}

import { CHAT_MSG_FOLLOWUP_DURATION, type ChatMessage } from "$chat";
import { asset } from "$server";
import { CHAT_SUB_WITHOUT_PUSH_SUB_EXPIRES } from "../../util/chat.ts";
import type { AppContext, Space } from "../../util/types.ts";
import Dots from "../Dots.tsx";
import DayHeading from "./DayHeading.tsx";
import DeleteMessageDialog from "./DeleteMessageDialog.tsx";
import EditMessageDialog from "./EditMessageDialog.tsx";
import Message from "./Message.tsx";
import MessageEditedTag from "./MessageEditedTag.tsx";
import MessageTextarea from "./MessageTextarea.tsx";
import Subscription from "./Subscription.tsx";

interface Props {
  space: Space;
  messages: ChatMessage[];
  olderMsgsCursor: string | null;
}

export default function Chat(props: Props, ctx: AppContext) {
  const { space, messages, olderMsgsCursor } = props;
  const { user } = ctx.state;
  const { locale, userAgent } = ctx;
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
  const timeFmt = new Intl.DateTimeFormat(locale, { timeStyle: "short" });
  const isAdmin = user?.username === space.ownerUsername;

  const msgsByDay = Object.groupBy(
    messages,
    (msg) => dateFmt.format(msg.createdAt),
  );

  return (
    <div
      id="chat"
      data-chat-id={space.id}
      data-page-title={space.name}
      data-current-user-username={user?.username}
      data-is-admin={isAdmin ? "1" : null}
      data-last-seen-feed-item-id={messages.at(-1)?.feedItemId}
      data-older-msgs-cursor={olderMsgsCursor}
      data-msg-followup-duration={CHAT_MSG_FOLLOWUP_DURATION}
      cata-chat-sub-expires={CHAT_SUB_WITHOUT_PUSH_SUB_EXPIRES}
      data-locale={locale}
    >
      <script type="module" src={asset("chat/chat.js")} />
      <link rel="modulepreload" href={asset("db.js")} />

      <div id="chat-box">
        <div id="chat-main">
          {olderMsgsCursor && (
            <p id="chat-msgs-loader" class="spinner-sm">
              Loading older messages
            </p>
          )}
          <p id="chat-beginning" class="splash" hidden={!!olderMsgsCursor}>
            <em>This is the beginning of the conversation.</em>
          </p>
          <div id="chat-msgs" role="log">
            {Object.entries(msgsByDay).map(([day, msgs]) => (
              <>
                <DayHeading>{day}</DayHeading>
                {msgs?.map((msg, i) => (
                  <Message
                    msg={msg}
                    timeFmt={timeFmt}
                    dateFmt={dateFmt}
                    prevMsg={msgs[i - 1]}
                    isAdmin={isAdmin}
                  />
                ))}
              </>
            ))}
          </div>
        </div>
        <div id="chat-footer">
          {user && (
            <form id="chat-msg-form">
              <fieldset disabled>
                <MessageTextarea />
                <button hidden>Send</button>
              </fieldset>
            </form>
          )}
          <button
            id="scrollto-unseen-msg-btn"
            type="button"
            title="See new message"
            aria-live="polite"
            hidden
          >
            {userAgent.device.type === "mobile" ? "↓" : "⬇"}
          </button>
        </div>
      </div>

      <p id="chat-users-typing" aria-live="polite">
        <span class="names"></span> <Dots />
      </p>

      {/* https://caniuse.com/mdn-javascript_statements_import_service_worker_support */}
      {userAgent.browser.name !== "Firefox" && <Subscription />}

      {user && (
        <>
          <EditMessageDialog />
          <DeleteMessageDialog />
        </>
      )}

      <template id="msg-template">
        <Message
          msg={{ createdAt: new Date(), username: "" } as ChatMessage}
          timeFmt={timeFmt}
          dateFmt={dateFmt}
          isAdmin={false}
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
  );
}

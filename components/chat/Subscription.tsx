import { AppContext } from "../../util/types.ts";
import { asset } from "../../util/url.ts";
import { HelpTooltip } from "../Tooltip.tsx";

export default function Subscription(_props: unknown, ctx: AppContext) {
  const { os, browser } = ctx.userAgent;

  let help;

  if (
    os.name === "macOS" && browser.name === "Safari" ||
    os.name === "iOS" && browser.name === "Safari" ||
    os.name === "Android" && browser.name === "Chrome"
  ) {
    help =
      `Notifications for new messages appear if ${browser.name} is closed, or this page is closed, or another tab is focused.`;
  } else {
    help =
      `Notifications for new messages appear when ${browser.name} is running and this page is either closed or not focused.`;
  }

  return (
    <>
      <div id="chat-sub">
        <label>
          <input id="chat-sub-checkbox" type="checkbox" disabled />
          Chat Notifications
        </label>

        <HelpTooltip id="chat-sub-help" info={help} size="sm" />

        <span
          id="chat-sub-denied"
          class="alert error"
          aria-live="polite"
          hidden
        >
          Disabled in browser settings
        </span>

        <button id="chat-sub-allow" hidden>
          Turn on
        </button>
      </div>

      {os.name === "iOS" && (
        <details id="ios-chat-sub-help" hidden>
          <summary>Chat notifications</summary>
          <p>
            To subscribe for chat notifications on iOS, add this website to your
            Home Screen:
          </p>
          <figure>
            <img loading="lazy" src={asset("img/ios-add-homescreen-1.png")} />
            <img loading="lazy" src={asset("img/ios-add-homescreen-2.png")} />
          </figure>
        </details>
      )}
    </>
  );
}

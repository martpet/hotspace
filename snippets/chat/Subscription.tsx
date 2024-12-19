import { asset } from "../../lib/server/asset_path.ts";
import { AppContext } from "../../util/types.ts";
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
      `Notifications for new messages appear when ${browser.name} is closed, or when this page is closed, or when another tab is focused.`;
  } else {
    help =
      `Notifications for new messages appear when ${browser.name} is opened and either this page is closed or another tab is focused.`;
  }

  return (
    <>
      <div id="chat-sub">
        <label>
          <input id="chat-sub-checkbox" type="checkbox" disabled />
          Chat notifications
        </label>

        <HelpTooltip id="chat-sub-help">
          {help}
        </HelpTooltip>

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
        <details id="chat-sub-standalone-info" hidden>
          <summary>Chat notifications</summary>
          <p>To enable notifications, add the website to your Home Screen:</p>
          <figure>
            <img loading="lazy" src={asset("img/ios-add-homescreen-1.png")} />
            <img loading="lazy" src={asset("img/ios-add-homescreen-2.png")} />
          </figure>
        </details>
      )}
    </>
  );
}

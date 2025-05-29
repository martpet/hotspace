import { MINUTE } from "@std/datetime";
import { HEADER } from "@std/http/unstable-header";
import Page from "../components/pages/Page.tsx";
import { AppContext } from "../util/types.ts";

export default function contactHandler(ctx: AppContext) {
  const title = "Contact";

  ctx.resp.headers.set(
    HEADER.CacheControl,
    `Cache-Control: public, max-age=${MINUTE * 30 / 1000}`,
  );

  return (
    <Page title={title} header={{ siteNameIsLink: true }}>
      <div class="prose">
        <h1>{title}</h1>
        <p>
          HotSpace is independently developed and maintained. All support
          inquiries are handled personally.
        </p>

        <p>
          For help, feedback, or to report an issue, please contact:<br />
          📧 <a href="mailto:support@hotspace.lol">support@hotspace.lol</a>
        </p>
      </div>
    </Page>
  );
}

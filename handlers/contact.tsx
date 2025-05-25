import Page from "../components/pages/Page.tsx";

export default function contactHandler() {
  const title = "Contact";

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

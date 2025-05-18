import Page from "../components/pages/Page.tsx";

export default function contactHandler() {
  const title = "Contact";

  return (
    <Page title={title} header={{ siteNameIsLink: true }}>
      <div class="prose">
        <h1>{title}</h1>
        <p>
          HotSpace is independently developed and maintained. I personally
          handle all support and questions.
        </p>

        <p>
          For help, feedback, or issues:{" "}
          <a href="mailto:support@hotspace.lol">support@hotspace.lol</a>
        </p>
      </div>
    </Page>
  );
}

import Page from "./Page.tsx";

export default function LandingPage() {
  return (
    <Page id="landing-page" header={{ siteNameIsHeading: true }}>
      <div class="prose">
        <p>Simple file sharing, with permanent storage and fair pricing.</p>
        <h2>How It Works</h2>
        <ul>
          <li>Register and get 1 GB of upload traffic for free</li>
          <li>Upload files — they stay online indefinitely</li>
          <li>Share files publicly or keep them private</li>
          <li>Pay only for uploads: $1 per additional GB</li>
          <li>No download limits, no hidden fees</li>
        </ul>
      </div>
      <nav>
        <a href="/terms">Terms</a> | <a href="/privacy">Privacy</a> |{" "}
        <a href="/contact">Contact</a>
      </nav>
    </Page>
  );
}

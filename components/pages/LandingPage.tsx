import Page from "./Page.tsx";

export default function LandingPage() {
  return (
    <Page id="landing-page">
      <div class="prose">
        <h1>
          HotSpace: simple file sharing, with permanent storage and fair pricing
        </h1>
        <h2>How It Works</h2>
        <ul>
          <li>Register and get 1 GB of upload traffic for free</li>
          <li>Upload files — they stay online indefinitely</li>
          <li>Share files publicly or keep them private</li>
          <li>Pay only for uploads: $1 per additional GB</li>
          <li>No download limits, no hidden fees</li>
        </ul>
        <nav>
          <a href="/terms">Terms</a> | <a href="/privacy">Privacy</a> |{" "}
          <a href="/contact">Contact</a>
        </nav>
      </div>
    </Page>
  );
}

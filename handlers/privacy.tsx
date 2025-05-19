import Page from "../components/pages/Page.tsx";

export default function privacyHandler() {
  const title = "Privacy Policy";

  return (
    <Page title={title} header={{ siteNameIsLink: true }}>
      <div class="prose">
        <h1>{title}</h1>
        <p>
          Your privacy is important. This policy explains what information
          HotSpace collects and how it is used.
        </p>
        <h2>Information Collected</h2>
        <p>When you register or use the site, I may collect:</p>
        <ul>
          <li>Your IP address</li>
          <li>Usage data (file uploads/downloads, traffic volumes)</li>
        </ul>
        <p>
          Files you upload are stored on servers and linked to your account.
        </p>
        <h2>How Data is Used</h2>
        <ul>
          <li>To provide the file sharing service</li>
          <li>To calculate usage for billing purposes</li>
          <li>To respond to support requests</li>
          <li>To prevent abuse and ensure platform integrity</li>
        </ul>
        <p>
          No personal data is sold or shared with third parties, except as
          required to process payments (via Stripe) or comply with the law.
        </p>
        <h2>Cookies</h2>
        <p>
          This site may use cookies or local storage for session management and
          usage tracking. No third-party advertising cookies are used.
        </p>
        <h2>Data Security</h2>
        <p>
          I take reasonable measures to protect your data, but no system is 100%
          secure. Use HotSpace at your own discretion.
        </p>
        <h2>Contact</h2>
        <p>
          For privacy questions, contact:{" "}
          <a href="mailto:support@hotspace.lol">support@hotspace.lol</a>
        </p>
      </div>
    </Page>
  );
}

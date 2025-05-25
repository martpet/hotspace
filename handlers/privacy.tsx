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

        <p>
          When you register, use this site, or make a payment, the following
          information may be collected:
        </p>

        <ul>
          <li>
            <strong>IP address</strong>
          </li>
          <li>
            <strong>Usage data</strong>, such as file uploads/downloads and
            traffic volume
          </li>
          <li>
            <strong>Payment-related credit card information</strong>{" "}
            provided via Stripe, including:
            <ul>
              <li>Card type</li>
              <li>Card country</li>
              <li>Expiration date</li>
              <li>Last four digits of the card number</li>
              <li>Bank name</li>
            </ul>
          </li>
        </ul>

        <p>
          Payment processing is handled by Stripe. Personal data shared during
          payment is subject to{"  "}
          <a href="https://stripe.com/privacy" target="_blank">
            Stripe’s Privacy Policy
          </a>. I receive only the limited information necessary to confirm and
          manage your payment. Stripe may retain additional data to comply with
          legal and financial regulations.
        </p>

        <p>
          Files you upload are stored on servers and linked to your account.
        </p>

        <h2>How Data Is Used</h2>

        <ul>
          <li>To provide the file sharing service</li>
          <li>To calculate usage for billing purposes</li>
          <li>To respond to support requests</li>
          <li>To prevent abuse and ensure platform integrity</li>
        </ul>

        <p>
          Your personal data is never sold or shared with third parties, except
          as required to process payments (via Stripe) or comply with legal
          obligations.
        </p>

        <h2>Cookies</h2>

        <p>
          This site may use cookies or local storage for session management and
          usage tracking. No third-party advertising cookies are used.
        </p>

        <h2>Data Security</h2>

        <p>
          Reasonable measures are taken to protect your data. However, no system
          is completely secure. Use HotSpace at your own discretion.
        </p>

        <h2>Contact</h2>

        <p>
          For privacy-related questions, contact:{" "}
          <a href="mailto:support@hotspace.lol">support@hotspace.lol</a>
        </p>
      </div>
    </Page>
  );
}

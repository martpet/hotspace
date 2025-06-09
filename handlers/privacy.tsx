import { MINUTE } from "@std/datetime/constants";
import { HEADER } from "@std/http/unstable-header";
import Page from "../components/pages/Page.tsx";
import { AppContext } from "../util/types.ts";

export default function privacyHandler(ctx: AppContext) {
  const title = "Privacy Policy";

  ctx.resp.headers.set(
    HEADER.CacheControl,
    `Cache-Control: public, max-age=${MINUTE * 30 / 1000}`,
  );

  return (
    <Page title={title} header={{ siteNameIsLink: true }}>
      <div class="prose">
        <h1>{title}</h1>

        <p>
          Your privacy is important. This policy explains what information{" "}
          <strong>HotSpace</strong> collects and how it is used.
        </p>

        <h2>Information Collected</h2>

        <p>
          When you register, use this site, or make a payment, the following
          information may be collected:
        </p>

        <ul>
          {
            /* <li>
            <strong>IP address</strong>
          </li> */
          }
          <li>
            <strong>Usage data</strong>, such as file uploads, downloads, and
            traffic volume
          </li>
          <li>
            <strong>Payment-related information</strong>{" "}
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
          Payment processing is handled by{" "}
          <strong>Stripe</strong>. Any personal data you share during payment is
          subject to{" "}
          <a href="https://stripe.com/privacy" target="_blank">
            Stripe’s Privacy Policy
          </a>. I receive only the limited information necessary to confirm and
          manage your payment. Stripe may retain additional data as required by
          law.
        </p>

        <h2>Hosting</h2>

        <ul>
          <li>
            The database and application backend are hosted by{" "}
            <strong>Deno Deploy</strong>.
          </li>
          <li>
            Uploaded files are stored in{" "}
            <strong>
              Amazon Web Services (AWS) S3
            </strong>.
          </li>
        </ul>

        <h2>How Data Is Used</h2>

        <p>Your data may be used to:</p>

        <ul>
          <li>
            <strong>Provide</strong> the file sharing service
          </li>
          <li>
            <strong>Calculate</strong> usage for billing purposes
          </li>
          <li>
            <strong>Respond</strong> to support requests
          </li>
          <li>
            <strong>Prevent</strong> abuse and ensure platform integrity
          </li>
        </ul>

        <p>
          Your personal data is <strong>never sold or shared</strong>{" "}
          with third parties, except as required to process payments (via
          Stripe) or comply with legal obligations.
        </p>

        <h2>Cookies</h2>

        <p>
          This site may use cookies or local storage to manage sessions and
          track usage. No third-party advertising cookies are used.
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

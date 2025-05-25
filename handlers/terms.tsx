import Page from "../components/pages/Page.tsx";

export default function termsHandler() {
  const title = "Terms of Service";

  return (
    <Page title={title} header={{ siteNameIsLink: true }}>
      <div class="prose">
        <h1>{title}</h1>

        <p>
          Welcome to HotSpace. By using this website, you agree to the following
          terms. Please read them carefully.
        </p>

        <h2>About the Service</h2>

        <p>
          HotSpace is a file sharing service that allows registered users to
          upload files and share them either publicly or privately. Each user
          receives 1 GB of upload traffic for free. Beyond this, additional
          upload traffic is available at a cost of $1 per gigabyte.
        </p>

        <p>
          Uploaded files remain available indefinitely and can be downloaded
          without limits. Charges apply only to uploads, not to downloads or
          storage duration.
        </p>

        <h2>Payments</h2>

        <p>
          You may purchase additional upload traffic at $1 per GB. Payments are
          handled through a third-party payment processor (Stripe).
        </p>

        <h2>Refunds</h2>

        <p>
          Payments are non-refundable once the upload traffic is used. If you
          believe you were incorrectly charged, please contact support at{" "}
          <strong>support@hotspace.lol</strong>. I review refund requests case
          by case and aim to respond within 48 hours.
        </p>

        <p>
          Refunds may be issued at my discretion in the case of billing errors
          or system problems.
        </p>

        <h2>Account Deletion</h2>

        <p>
          You may delete your account at any time. When your account is deleted,
          all your uploaded files and data will be removed permanently. No
          further charges will occur.
        </p>

        <h2>Prohibited Use</h2>

        <p>You may not use HotSpace to upload or distribute:</p>

        <ul>
          <li>Illegal content</li>
          <li>Copyrighted content without proper rights</li>
          <li>Malware or harmful code</li>
          <li>Content that violates export restrictions</li>
        </ul>

        <p>
          Violation of these rules may result in immediate suspension or removal
          of your account.
        </p>

        <h2>Availability</h2>

        <p>
          HotSpace is provided by an independent developer. While I strive for
          uptime and reliability, service interruptions or changes may occur
          without notice.
        </p>

        <h2>Contact</h2>

        <p>
          For questions or issues, please contact:{" "}
          <a href="mailto:support@hotspace.lol">support@hotspace.lol</a>
        </p>
      </div>
    </Page>
  );
}

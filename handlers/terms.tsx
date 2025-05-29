import { MINUTE } from "@std/datetime/constants";
import { format } from "@std/fmt/bytes";
import { HEADER } from "@std/http/unstable-header";
import Page from "../components/pages/Page.tsx";
import { PRICE_PER_GB_CENTS } from "../util/consts.ts";
import { getSettings } from "../util/kv/settings.ts";
import type { AppContext } from "../util/types.ts";

export default async function termsHandler(ctx: AppContext) {
  const pricePerGb = PRICE_PER_GB_CENTS / 100;
  const title = "Terms of Service";
  const { value: settings } = await getSettings("eventual");
  const initialUploaQuota = settings?.initialUploadQuota || 0;
  const freeUploadQuota = format(initialUploaQuota);

  ctx.resp.headers.set(
    HEADER.CacheControl,
    `Cache-Control: public, max-age=${MINUTE * 30 / 1000}`,
  );

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
          HotSpace is a file-sharing platform that allows registered users to
          upload and share files publicly or privately.{" "}
          {initialUploaQuota > 0 && (
            <>
              Each user receives{" "}
              <strong>{freeUploadQuota} of upload traffic for free</strong>.
            </>
          )}
        </p>

        <p>
          Uploaded files remain available indefinitely and can be downloaded
          without limits. Charges apply{" "}
          <strong>only to uploads</strong>, not to downloads or storage
          duration.
        </p>

        <h2>Payments</h2>

        <p>
          {initialUploaQuota ? "Additional upload" : "Upload"}{" "}
          traffic can be purchased at a rate of{" "}
          <strong>${pricePerGb} per gigabyte</strong>. Payments are securely
          processed through a third-party provider, Stripe.
        </p>

        <h2>Refunds</h2>

        <p>
          Payments are non-refundable once the upload traffic has been used. If
          you believe you were charged in error, please contact support at{" "}
          <a href="mailto:support@hotspace.lol">support@hotspace.lol</a>. Refund
          requests are reviewed on a case-by-case basis, with a response
          typically provided within 48 hours.
        </p>

        <p>
          Refunds may be issued at my discretion in cases of billing errors or
          system-related issues.
        </p>

        <h2>Account Deletion</h2>

        <p>
          You may delete your account at any time. When your account is deleted,
          all uploaded files and associated data will be permanently removed,
          and no further charges will occur.
        </p>

        <h2>Prohibited Use</h2>

        <p>You may not use HotSpace to upload or distribute:</p>

        <ul>
          <li>Illegal content</li>
          <li>Copyrighted material without proper authorization</li>
          <li>Malware or harmful code</li>
          <li>Content that violates export laws</li>
        </ul>

        <p>
          Violating these rules may result in{" "}
          <strong>
            immediate suspension or termination
          </strong>{" "}
          of your account.
        </p>

        <h2>Availability</h2>

        <p>
          HotSpace is developed and maintained by an independent developer.
          While I strive to maintain uptime and reliability, service
          interruptions or changes may occur without notice.
        </p>

        <h2>Contact</h2>

        <p>
          For questions, concerns, or support, please email:{" "}
          <a href="mailto:support@hotspace.lol">support@hotspace.lol</a>
        </p>
      </div>
    </Page>
  );
}

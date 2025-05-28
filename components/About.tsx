import { format } from "@std/fmt/bytes";
import { INITIAL_UPLOAD_QUOTA, PRICE_PER_GB_CENTS } from "../util/consts.ts";
import { asset } from "../util/url.ts";

interface Props {
  noName?: boolean;
  noSubline?: boolean;
  noLogo?: boolean;
}

export default function About({ noLogo, noName, noSubline }: Props) {
  const freeUploadQuota = format(INITIAL_UPLOAD_QUOTA);
  const pricePerGb = PRICE_PER_GB_CENTS / 100;

  return (
    <section class="about prose">
      {!noLogo && (
        <img
          class="logo"
          src={asset("img/logo.png")}
          alt="Logo: Fire Emoji"
        />
      )}

      {!noName && (
        <h1>
          HotSpace
        </h1>
      )}

      {!noSubline && (
        <p class="subline">
          Simple file sharing, with permanent storage and fair pricing
        </p>
      )}

      <section class="box">
        <h1>How It Works</h1>
        <ul>
          <li>
            Sign up and get <strong>{freeUploadQuota} of free uploads</strong>
          </li>
          <li>
            Upload files — they stay online indefinitely
          </li>
          <li>
            Share files publicly or keep them private
          </li>
          <li>
            Pay only <strong>${pricePerGb} per additional GB uploaded</strong>
          </li>
          <li>No download limits, no hidden fees</li>
        </ul>
      </section>
      <footer>
        <nav>
          <ul>
            <li>
              <a href="/terms">Terms</a>
            </li>
            <li>
              <a href="/privacy">Privacy</a>
            </li>
            <li>
              <a href="/contact">Contact</a>
            </li>
          </ul>
        </nav>
      </footer>
    </section>
  );
}

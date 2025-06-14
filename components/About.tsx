import { format } from "@std/fmt/bytes";
import { PRICE_PER_GB_CENTS } from "../util/consts.ts";

interface Props {
  initialUploadQuota?: false | number;
  noName?: boolean;
  noSubline?: boolean;
  noLogo?: boolean;
}

export default function About(props: Props) {
  const { noLogo, noName, noSubline } = props;
  const initialUploadQuota = props.initialUploadQuota || 0;
  const pricePerGb = PRICE_PER_GB_CENTS / 100;

  return (
    <section class="about prose">
      {!noLogo && <i class="icn-globe logo" />}

      {!noName && (
        <h1 class="site-name">
          HotSpace
        </h1>
      )}

      {!noSubline && (
        <h2 class="subline">
          Simple file sharing
        </h2>
      )}

      <section class="box">
        <ul>
          {!!initialUploadQuota && (
            <li>
              Sign up and get{" "}
              <strong>{format(initialUploadQuota)} of free uploads</strong>
            </li>
          )}
          <li>Permanent storage</li>
          <li>Unlimited downloads</li>
          <li>Role-based access</li>
          <li>
            <strong>
              ${pricePerGb} per {!!initialUploadQuota && "additional"}{" "}
              GB uploaded
            </strong>
          </li>
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

import { PRICE_PER_GB_CENTS } from "../util/consts.ts";

interface Props {
  noName?: boolean;
  noSubline?: boolean;
  noLogo?: boolean;
}

export default function About(props: Props) {
  const { noLogo, noName, noSubline } = props;
  const pricePerGb = PRICE_PER_GB_CENTS / 100;

  return (
    <section class="about prose">
      {!noLogo && <i class="icn-globe logo" />}

      {!noName && (
        <p class="site-name">
          HotSpace
        </p>
      )}

      {!noSubline && (
        <h1 class="subline">
          Simple file storage
        </h1>
      )}

      <section class="box">
        <ul>
          <li>Shareable public links</li>
          <li>Unlimited downloads</li>
          <li>No expiration</li>
          <li>
            <strong>
              One-time ${pricePerGb}/GB uploaded
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

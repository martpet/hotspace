import { asset } from "../util/url.ts";

interface Props {
  skipSubline?: boolean;
}

export default function About({ skipSubline }: Props) {
  return (
    <section class="about prose">
      <img
        class="logo"
        src={asset("img/logo.png")}
        alt="Logo: Fire Emoji"
      />
      <h1>
        HotSpace
      </h1>
      {!skipSubline && (
        <p class="subline">
          Simple file sharing, with permanent storage and fair pricing
        </p>
      )}
      <section class="box">
        <h2>How It Works</h2>
        <ul>
          <li>Register and get 1 GB of upload traffic for free</li>
          <li>Upload files — they stay online indefinitely</li>
          <li>Share files publicly or keep them private</li>
          <li>Pay only for uploads: $1 per additional GB</li>
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

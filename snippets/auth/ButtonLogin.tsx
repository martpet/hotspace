import { type JSX } from "preact";

type Props = Omit<JSX.HTMLAttributes<HTMLButtonElement>, "id">;

export default function ButtonLogin(props: Props) {
  return (
    <button class="request-credential" type="button" {...props}>
      {props.children || "Login with passkey"}
    </button>
  );
}

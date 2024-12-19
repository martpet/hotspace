import { type JSX } from "preact";

type Props = Omit<JSX.HTMLAttributes<HTMLButtonElement>, "id">;

export default function ButtonLogin(props: Props) {
  return (
    <button class="login-button" type="button" {...props}>
      {props.children || "Log in"}
    </button>
  );
}

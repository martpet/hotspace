import { type JSX } from "preact";
import ButtonSpinner from "../ButtonSpinner.tsx";

type Props = Omit<JSX.HTMLAttributes<HTMLButtonElement>, "id">;

export default function LoginButton(props: Props) {
  return (
    <ButtonSpinner class="request-credential" type="button" {...props}>
      {props.children || "Sign in"}
    </ButtonSpinner>
  );
}

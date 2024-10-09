import { type JSX } from "preact";
import Spinner from "./Spinner.tsx";

type Props = JSX.HTMLAttributes<HTMLButtonElement>;

export default function ButtonSpinner(props: Props) {
  return (
    <button {...props} class={`button-spinner ${props.class || ""}`}>
      {props.children}
      <Spinner size="xs" />
    </button>
  );
}

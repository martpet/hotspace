import { type JSX } from "preact";

type Props = JSX.HTMLAttributes<HTMLButtonElement>;

export default function ButtonSettings(props: Props) {
  const classes = ["btn-settings"];
  if (props.class) classes.push(props.class as string);

  return (
    <button {...props} class={classes.join(" ")}>
      ⚙
    </button>
  );
}

import { type JSX } from "preact";

type Props = JSX.ButtonHTMLAttributes;

export default function ButtonSettings(props: Props) {
  const classes = ["btn-settings"];
  if (props.class) classes.push(props.class as string);

  return (
    <button {...props} class={classes.join(" ")}>
      ⚙
    </button>
  );
}

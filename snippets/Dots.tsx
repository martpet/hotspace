import { type JSX } from "preact";

interface Props extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, "size"> {
}

export default function Dots(props: Props) {
  let classes = `dots`;
  if (props.class) classes += ` ${props.class}`;

  return (
    <span role="progressbar" aria-label="Loading" {...props} class={classes}>
      <span />
      <span />
      <span />
    </span>
  );
}

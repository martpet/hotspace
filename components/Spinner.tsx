import { type JSX } from "preact";

interface Props extends JSX.HTMLAttributes<HTMLParagraphElement> {
}

export default function Spinner(props: Props) {
  const classes = ["spinner"];

  if (props.class) classes.push(props.class as string);

  return <p {...props} class={classes.join(" ")} />;
}

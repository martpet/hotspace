import { type JSX } from "preact";

interface Props extends JSX.HTMLAttributes<HTMLParagraphElement> {
  block?: boolean;
}

export default function Spinner(props: Props) {
  const classes = ["spinner"];

  if (props.class) classes.push(props.class as string);
  if (props.block) classes.push("spinner-block");

  return <p {...props} class={classes.join(" ")} />;
}

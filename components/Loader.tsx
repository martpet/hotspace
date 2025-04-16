import { type JSX } from "preact";

interface Props extends JSX.HTMLAttributes<HTMLParagraphElement> {
  ellipsis?: boolean;
}

export default function Loader(props: Props) {
  const { children, ellipsis = true, ...rest } = props;
  const classes = ["loader"];
  if (props.class) classes.push(props.class as string);

  return (
    <p {...rest} class={classes.join(" ")}>
      <span class="spinner" /> {children}
      {ellipsis && "…"}
    </p>
  );
}

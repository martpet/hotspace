import type { Flash } from "$server";
import type { JSX } from "preact";

interface Props extends JSX.HTMLAttributes<HTMLParagraphElement> {
  type: Flash["type"];
}

export default function Flash({ type, ...rest }: Props) {
  let classes = `alert ${type}`;
  if (rest.class) classes += ` ${rest.class}`;

  return <p id="flash" {...rest} class={classes} />;
}

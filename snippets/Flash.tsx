import type { Flash } from "$server";
import type { JSX } from "preact";

interface Props extends JSX.HTMLAttributes<HTMLDialogElement> {
  type?: Flash["type"];
}

export default function Flash(props: Props) {
  const { type = "success", ...dialogProps } = props;
  let classes = `alert ${type}`;
  if (dialogProps.class) classes += ` ${dialogProps.class}`;

  return <dialog id="flash" open {...dialogProps} class={classes} />;
}

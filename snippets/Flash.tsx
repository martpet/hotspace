import type { Flash } from "$server";
import type { JSX } from "preact";

interface Props extends JSX.HTMLAttributes<HTMLDialogElement> {
  type?: Flash["type"];
  autoHide?: boolean;
}

export default function Flash(props: Props) {
  const { type = "success", autoHide = true, ...dialogProps } = props;
  const classes = ["flash", "alert", type];

  if (autoHide) classes.push("auto-hide");
  if (dialogProps.class) classes.push(dialogProps.class as string);

  return <dialog open class={classes.join(" ")} {...dialogProps} />;
}

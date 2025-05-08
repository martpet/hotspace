import type { Flash } from "$server";
import type { JSX } from "preact";

interface Props extends JSX.HTMLAttributes<HTMLDialogElement> {
  type?: Flash["type"];
}

export default function Flash(props: Props) {
  const { type = "success", children, ...dialogProps } = props;
  const classes = ["flash", "alert", type];

  if (dialogProps.class) classes.push(dialogProps.class as string);

  return (
    <dialog
      open
      class={classes.join(" ")}
      {...dialogProps}
    >
      <form method="dialog">
        {children}
        <button>X</button>
      </form>
    </dialog>
  );
}

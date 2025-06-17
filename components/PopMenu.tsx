import { cloneElement, type JSX, toChildArray, type VNode } from "preact";

interface Props extends JSX.HTMLAttributes<HTMLDivElement> {
  btnText: string;
}

export default function PopMenu({ btnText, ...rest }: Props) {
  const { children, ...divProps } = rest;
  const menuId = crypto.randomUUID();
  const classes = ["pop-menu"];

  if (divProps.class) {
    classes.push(divProps.class as string);
  }

  return (
    <div {...divProps} class={classes.join(" ")}>
      <button popovertarget={menuId}>
        {btnText}
        <i class="icn-chevron-expand" />
      </button>
      <menu id={menuId} popover>
        {toChildArray(children).map((child) =>
          cloneElement(child as VNode, {
            popovertarget: menuId,
            popovertargetaction: "hide",
          })
        )}
      </menu>
    </div>
  );
}

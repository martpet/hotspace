import { type JSX } from "preact";

interface Props extends JSX.HTMLAttributes<HTMLDivElement> {
  btnContent: string | JSX.Element;
  menuId: string;
}

export default function PopMenu(props: Props) {
  const { btnContent, menuId, ...rest } = props;
  const { children, ...divProps } = rest;
  const classes = ["pop-menu"];

  if (divProps.class) {
    classes.push(divProps.class as string);
  }

  return (
    <div {...divProps} class={classes.join(" ")}>
      <button popovertarget={menuId}>
        {btnContent}
        <i class="icn-chevron-expand" />
      </button>
      <menu id={menuId} popover>
        {children}
      </menu>
    </div>
  );
}

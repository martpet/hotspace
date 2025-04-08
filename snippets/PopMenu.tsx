import { cloneElement, type JSX, toChildArray, type VNode } from "preact";

interface Props extends JSX.HTMLAttributes<HTMLMenuElement> {
  id: string;
  btnLabel: string;
}

export default function PopMenu(props: Props) {
  const { btnLabel, ...menuProps } = props;

  return (
    <div class="pop-menu">
      <button popovertarget={menuProps.id}>
        {btnLabel}
      </button>
      <menu popover {...props}>
        {toChildArray(props.children).map((child) =>
          cloneElement(child as VNode, {
            popovertarget: props.id,
            popovertargetaction: "hide",
          })
        )}
      </menu>
    </div>
  );
}

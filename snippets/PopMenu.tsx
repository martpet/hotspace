import { cloneElement, type JSX, toChildArray, type VNode } from "preact";
import { type ButtonToggleChatProps } from "./chat/ButtonToggleChat.tsx";

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
      <Menu {...menuProps} />
    </div>
  );
}

function Menu(props: Pick<Props, "id" | "children">) {
  const { id, children } = props;

  return (
    <menu popover {...props}>
      {toChildArray(children).map((child) => {
        const vnode = child as VNode;
        const skipHideAction =
          (vnode.props as ButtonToggleChatProps).skipHidePopoverId;
        let extraProps;
        if (!skipHideAction) {
          extraProps = {
            popovertarget: id,
            popovertargetaction: "hide",
          };
        }
        return cloneElement(vnode, extraProps);
      })}
    </menu>
  );
}

import type { ComponentChild, ComponentChildren, JSX } from "preact";

interface TooltipProps extends JSX.HTMLAttributes<HTMLDivElement> {
  info: ComponentChild;
  children: ComponentChildren;
}

export default function Tooltip(props: TooltipProps) {
  const { info, children, ...rootElProps } = props;
  const classes = ["tooltip"];
  if (rootElProps.class) classes.push(rootElProps.class as string);

  return (
    <div {...rootElProps} class={classes.join(" ")}>
      <div class="anchor">
        {children}
      </div>
      <div class="infobox">
        {info}
      </div>
    </div>
  );
}

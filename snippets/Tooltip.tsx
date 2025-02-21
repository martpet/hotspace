import type { ComponentChild, ComponentChildren, JSX } from "preact";

interface TooltipProps extends JSX.HTMLAttributes<HTMLDivElement> {
  anchor: ComponentChild;
  children: ComponentChildren;
}

export default function Tooltip(props: TooltipProps) {
  const { anchor, children, ...rootElProps } = props;
  const classes = ["tooltip"];
  if (rootElProps.class) classes.push(rootElProps.class as string);

  return (
    <div {...rootElProps} class={classes.join(" ")}>
      <div class="anchor">
        {anchor}
      </div>
      <div class="infobox">
        {children}
      </div>
    </div>
  );
}

export function HelpTooltip(props: Omit<TooltipProps, "anchor">) {
  return (
    <Tooltip
      {...props}
      class="help-tooltip"
      anchor={<span class="help-sign">?</span>}
    />
  );
}

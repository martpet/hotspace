import { type JSX } from "preact";

interface Props
  extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, "size" | "class"> {
  size?: "md" | "sm" | "xs";
}

export default function Spinner({ size = "md", ...props }: Props) {
  return <span {...props} class={`spinner ${size}`} />;
}

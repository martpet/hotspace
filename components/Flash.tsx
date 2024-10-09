import type { Flash } from "$server";
import type { ComponentChildren } from "preact";

interface Props {
  children: ComponentChildren;
  type: Flash["type"];
}

export default function Flash(props: Props) {
  return <p id="flash" class={`alert ${props.type}`}>{props.children}</p>;
}

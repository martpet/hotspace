import { type ComponentChildren } from "preact";

interface Props {
  title: string;
  subTitle?: string;
  children?: ComponentChildren;
}

export default function BlankSlate(props: Props) {
  const { title, subTitle, children } = props;

  return (
    <div class="blank-slate">
      <strong class="title">{title}</strong>
      {subTitle && <p class="sub">{subTitle}</p>}
      {children}
    </div>
  );
}

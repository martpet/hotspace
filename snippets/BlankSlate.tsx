interface Props {
  title: string;
  subTitle: string;
}

export default function BlankSlate(props: Props) {
  const { title, subTitle } = props;

  return (
    <div class="blank-slate">
      <strong>{title}</strong>
      <p>{subTitle}</p>
    </div>
  );
}

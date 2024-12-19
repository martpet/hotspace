interface Props {
  editedAt: Date;
  timeFmt: Intl.DateTimeFormat;
  dateFmt: Intl.DateTimeFormat;
}

export default function MessageEditedTag(props: Props) {
  const { editedAt, timeFmt, dateFmt } = props;
  const titleAttr = `${dateFmt.format(editedAt)} ${timeFmt.format(editedAt)}`;

  return (
    <small class="tag-edited" title={titleAttr}>
      (edited)
    </small>
  );
}

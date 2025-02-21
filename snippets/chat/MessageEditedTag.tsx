interface Props {
  editedAt: Date;
  dateTimeFmt: Intl.DateTimeFormat;
}

export default function MessageEditedTag(props: Props) {
  const { editedAt, dateTimeFmt } = props;

  return (
    <small class="tag-edited" title={dateTimeFmt.format(editedAt)}>
      (edited)
    </small>
  );
}

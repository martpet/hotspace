import { getRelativeTime } from "$util";
import { decodeTime } from "@std/ulid";
import type { AppContext } from "../util/types.ts";

type Props = {
  uuid: string;
  date?: never;
} | {
  uuid?: never;
  date: Date;
};

export default function RelativeTime(props: Props, ctx: AppContext) {
  const date = props.date || new Date(decodeTime(props.uuid));
  const text = getRelativeTime(date, ctx.locale);

  const dateFmt = new Intl.DateTimeFormat(ctx.locale, {
    dateStyle: "long",
    timeStyle: "medium",
  });

  return <time title={dateFmt.format(date)}>{text}</time>;
}

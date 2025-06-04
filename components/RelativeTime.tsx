import { getRelativeTime } from "$util";
import { decodeTime } from "@std/ulid";
import type { AppContext } from "../util/types.ts";

type Props =
  & { noDateTimeAttr?: boolean }
  & ({
    ulid: string;
    date?: never;
  } | {
    ulid?: never;
    date: Date;
  });

export default function RelativeTime(props: Props, ctx: AppContext) {
  const date = props.date || new Date(decodeTime(props.ulid));
  const dateFmt = new Intl.DateTimeFormat(ctx.locale, {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <time
      datetime={props.noDateTimeAttr ? undefined : date.toISOString()}
      title={dateFmt.format(date)}
    >
      {getRelativeTime(date)}
    </time>
  );
}

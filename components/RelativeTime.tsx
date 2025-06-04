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

  return <time datetime={date.toISOString()}>{text}</time>;
}

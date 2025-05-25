import { format } from "@std/fmt/bytes";
import type { AppContext } from "../util/types.ts";
import ButtonBuyTraffic from "./ButtonBuyTraffic.tsx";

interface Props {
  remainingBytes: number;
}

export default function RemainingUploadTraffic(props: Props, ctx: AppContext) {
  const { user } = ctx.state;
  if (!user) return null;

  const { remainingBytes } = props;

  return (
    <>
      <p>
        <span id="upload-quota">{format(remainingBytes)}</span> remaining
      </p>
      <ButtonBuyTraffic />
    </>
  );
}

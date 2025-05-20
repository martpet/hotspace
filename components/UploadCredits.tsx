import { format } from "@std/fmt/bytes";
import type { AppContext } from "../util/types.ts";

interface Props {
  totalUploaded: number;
}

export default function UploadCredits(props: Props, ctx: AppContext) {
  const { user } = ctx.state;
  if (!user) return null;

  const { totalUploaded } = props;
  const { startBytes, limitBytes } = user?.uploadCredits;
  const totalCredit = limitBytes - startBytes;
  const usedCredit = totalUploaded - startBytes;
  const remainingCredit = totalCredit - usedCredit;

  if (limitBytes === Infinity) {
    return (
      <label class="upload-credits">
        Unlimited <meter value={1} />
      </label>
    );
  }

  return (
    <>
      <label class="upload-credits">
        {format(remainingCredit)} remaining:
        <meter
          min={0}
          max={totalCredit}
          value={remainingCredit}
          optimum={totalCredit}
          low={0.2 * totalCredit}
          high={0.4 * totalCredit}
        />
      </label>
      <button>Buy Credits (from $1 per GB)</button>
    </>
  );
}

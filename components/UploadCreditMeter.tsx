import { format } from "@std/fmt/bytes";
import type { UploadCredit } from "../util/types.ts";

interface Props {
  credit: UploadCredit;
  totalUploaded: number;
}

export default function UploadCreditMeter(props: Props) {
  const { totalUploaded } = props;
  const { startBytes, limitBytes } = props.credit;
  const totalCredit = limitBytes - startBytes;
  const usedCredit = totalUploaded - startBytes;
  const remainingCredit = totalCredit - usedCredit;

  return (
    <label class="upload-credit-meter">
      {limitBytes === Infinity
        ? (
          <>
            Unlimited
            <meter value={1} />
          </>
        )
        : (
          <>
            {format(remainingCredit)} remaining
            <meter
              min={0}
              max={totalCredit}
              value={remainingCredit}
              optimum={totalCredit}
              low={0.2 * totalCredit}
              high={0.4 * totalCredit}
            />
          </>
        )}
    </label>
  );
}

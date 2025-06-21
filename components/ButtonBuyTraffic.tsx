import { PRICE_PER_GB_CENTS, STRIPE_PUB_KEY } from "../util/consts.ts";
import { asset } from "../util/url.ts";

interface Props {
  skipScript?: boolean;
}

export default function ButtonBuyTraffic(props: Props) {
  const { skipScript } = props;

  return (
    <>
      {!skipScript && <script type="module" src={asset("buy_traffic.js")} />}

      <button
        disabled
        id="show-buy-traffic"
        class="wait-disabled"
        data-stripe-pub-key={STRIPE_PUB_KEY}
        data-price-per-gb={PRICE_PER_GB_CENTS}
      >
        Buy upload quota ($1 per GB)
      </button>
    </>
  );
}

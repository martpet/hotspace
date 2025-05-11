import type { AppBudget, AppSettings } from "../../util/types.ts";
import { asset } from "../../util/url.ts";
import { BudgetFieldset } from "./BudgetFieldset.tsx";

interface Props {
  settings: AppSettings | null;
  budgetsLiveCosts: number[];
}

export function AppSettingsForm(props: Props) {
  const { isUploadEnabled, mediaConvertPricing, budgets = [] } =
    props.settings || {};
  const { budgetsLiveCosts } = props;

  const blankBudget: AppBudget = {
    maxCost: 0,
    period: 0,
    periodType: "hours",
    autoDisableUplaod: false,
  };

  const currenyFmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <>
      <script type="module" src={asset("admin/app_settings_form.js")} />

      <template id="blankBudget">
        <BudgetFieldset
          budget={blankBudget}
          liveCost={0}
          currenyFmt={currenyFmt}
          fieldIndex={budgets.length}
          isNew
        />
      </template>

      <form id="settings-form" method="post" action="/admin/settings">
        <label>
          <input
            type="checkbox"
            name="isUploadEnabled"
            checked={isUploadEnabled}
          />{" "}
          Upload enabled
        </label>

        <div class="budgets">
          {budgets.map((budget, i) => (
            <BudgetFieldset
              budget={budget}
              liveCost={budgetsLiveCosts[i]}
              currenyFmt={currenyFmt}
              fieldIndex={i}
              key={i}
            />
          ))}

          <button id="add-budget" type="button">New budget</button>
        </div>

        <fieldset>
          <legend>MediaConvert Price per minute</legend>
          <label>
            SD{" "}
            <input
              type="number"
              name="mediaConvertPricingSD"
              value={mediaConvertPricing?.SD}
              step="0.01"
              placeholder="0.03"
            />
          </label>

          <label>
            HD{" "}
            <input
              type="number"
              name="mediaConvertPricingHD"
              value={mediaConvertPricing?.HD}
              step="0.01"
              placeholder="0.06"
            />
          </label>

          <label>
            4K{" "}
            <input
              type="number"
              name="mediaConvertPricing4K"
              value={mediaConvertPricing?.["4K"]}
              step="0.01"
              placeholder="0.12"
            />
          </label>

          <label>
            Audio{" "}
            <input
              type="number"
              name="mediaConvertPricingAudio"
              value={mediaConvertPricing?.audio}
              step="0.01"
              placeholder="0.06"
            />
          </label>
        </fieldset>

        <button>Submit Settings</button>
      </form>
    </>
  );
}

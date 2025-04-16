import { BUDGET_PERIOD_TYPES } from "../../util/consts.ts";
import type { AppBudget } from "../../util/types.ts";

export function BudgetFieldset(
  props: {
    budget: AppBudget;
    liveCost: number;
    currenyFmt: Intl.NumberFormat;
    fieldIndex: number;
    isNew?: boolean;
  },
) {
  const { budget, fieldIndex, isNew, liveCost, currenyFmt } = props;
  const fieldName = (name: string) => `budgets_${fieldIndex}_${name}`;
  const isOverMaxCost = liveCost > budget.maxCost;
  const classes = ["budget-fieldset"];
  if (isNew) classes.push("new-budget");

  return (
    <fieldset class={classes.join(" ")}>
      <legend>{isNew && "New"} Budget</legend>

      <p>
        Cost for last {budget.period} {budget.periodType}:{" "}
        <span class={`live-cost ${isOverMaxCost ? "dager" : ""}`}>
          {currenyFmt.format(liveCost)}
        </span>
      </p>

      <label>
        Period{" "}
        <input
          name={fieldName("period")}
          type="number"
          min="1"
          value={budget?.period}
        />
        <select name={fieldName("periodType")}>
          {BUDGET_PERIOD_TYPES.map((type) => (
            <option value={type} selected={type === budget?.periodType}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <label>
        Max cost{" "}
        <input
          name={fieldName("maxCost")}
          type="number"
          min="1"
          value={budget?.maxCost}
        />
      </label>

      <p>
        <label>
          <input
            name={fieldName("autoDisableUplaod")}
            type="checkbox"
            checked={budget?.autoDisableUplaod}
          />{" "}
          Disable upload if max cost exceeded
        </label>
      </p>

      <button class="remove" type="button">
        X
      </button>
    </fieldset>
  );
}

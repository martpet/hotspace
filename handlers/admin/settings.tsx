import { GB } from "$util";
import { STATUS_CODE } from "@std/http/status";
import { METHOD } from "@std/http/unstable-method";
import Page from "../../components/pages/Page.tsx";
import { APP_ADMIN, GENERAL_ERR_MSG } from "../../util/consts.ts";
import { getSettings, setSettings } from "../../util/kv/settings.ts";
import type { AppContext } from "../../util/types.ts";

export default function adminSettingsHandler(ctx: AppContext) {
  const { user } = ctx.state;
  if (!user || user.username !== APP_ADMIN) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }
  if (ctx.req.method === METHOD.Get) return handleGet();
  if (ctx.req.method === METHOD.Post) return handlePost(ctx);
  return ctx.respond(null, STATUS_CODE.MethodNotAllowed);
}

async function handleGet() {
  const title = "Settings";
  const { value: settings } = await getSettings();
  const { initialUploadQuota } = settings || {};
  const initialUploadQuotaGb = (initialUploadQuota || 0) / 1_000_000_000;

  return (
    <Page title={title} header={{ breadcrumb: true }}>
      <h1>{title}</h1>
      <form method="post">
        <label>
          Initial upload quota:{" "}
          <input
            type="number"
            name="initialUploadQuota"
            value={initialUploadQuotaGb}
            step={0.001}
            min={0}
            max={10}
            required
          />{" "}
          GB
        </label>
        <button>Submit</button>
      </form>
    </Page>
  );
}

async function handlePost(ctx: AppContext) {
  const form = await ctx.req.formData();

  const commit = await setSettings({
    initialUploadQuota: GB * Number(form.get("initialUploadQuota")),
  });

  if (commit.ok) {
    ctx.setFlash("Saved settings");
  } else {
    ctx.setFlash({ type: "error", msg: GENERAL_ERR_MSG });
  }
  return ctx.redirectBack();
}

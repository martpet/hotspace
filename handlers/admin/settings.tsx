import { GB } from "$util";
import { STATUS_CODE } from "@std/http/status";
import { METHOD } from "@std/http/unstable-method";
import AdminPage from "../../components/pages/AdminPage.tsx";
import { type AdminContext, withAdmin } from "../../util/admin/with_admin.ts";
import { GENERAL_ERR_MSG } from "../../util/consts.ts";
import { getSettings, setSettings } from "../../util/kv/settings.ts";

export default withAdmin((ctx) => {
  if (ctx.req.method === METHOD.Get) return handleGet();
  if (ctx.req.method === METHOD.Post) return handlePost(ctx);
  return ctx.respond(null, STATUS_CODE.MethodNotAllowed);
});

async function handleGet() {
  const { value: settings } = await getSettings();
  const { initialUploadQuota } = settings || {};
  const initialUploadQuotaGb = (initialUploadQuota || 0) / 1_000_000_000;

  return (
    <AdminPage title="Settings">
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
    </AdminPage>
  );
}

async function handlePost(ctx: AdminContext) {
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

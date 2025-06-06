import { STATUS_CODE } from "@std/http/status";
import { METHOD } from "@std/http/unstable-method";
import { decodeTime } from "@std/ulid";
import AdminPage from "../../../components/pages/AdminPage.tsx";
import { GB } from "../../../mods/util/bytes.ts";
import { adminDateFmt } from "../../../util/admin/date.ts";
import {
  type AdminContext,
  withAdmin,
} from "../../../util/admin/with_admin.ts";
import { GENERAL_ERR_MSG } from "../../../util/consts.ts";
import {
  getRemainingUploadBytesByUser,
  setUserRemainingUploadBytes,
} from "../../../util/kv/upload_stats.ts";
import { getUserById } from "../../../util/kv/users.ts";

export default withAdmin((ctx) => {
  if (ctx.req.method === METHOD.Get) return handleGet(ctx);
  if (ctx.req.method === METHOD.Post) return handlePost(ctx);
  return ctx.respond(null, STATUS_CODE.MethodNotAllowed);
});

async function handleGet(ctx: AdminContext) {
  const { userId } = ctx.urlPatternResult.pathname.groups;

  if (!userId) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const { value: user } = await getUserById(userId);

  if (!user) {
    return <AdminPage title="User not found" />;
  }

  const uploadQuotaBytes = await getRemainingUploadBytesByUser(userId);
  const uploadQuotaGb = uploadQuotaBytes / 1_000_000_000;
  const uploadQuotaGbRounded = Math.round(uploadQuotaGb * 1000) / 1000;

  return (
    <AdminPage title={user.username}>
      <details>
        <summary>
          Created: {adminDateFmt.format(new Date(decodeTime(user.id)))}
        </summary>
        <pre class="basic">{JSON.stringify(user, null, 2)}</pre>
      </details>
      <form method="post">
        <label>
          Upload quota:{" "}
          <input
            type="number"
            name="uploadQuota"
            value={uploadQuotaGbRounded}
            min={0}
            max={100}
            step={0.1}
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

  const commit = await setUserRemainingUploadBytes({
    bytes: GB * Number(form.get("uploadQuota")),
    userId: ctx.state.user.id,
  });

  if (commit.ok) {
    ctx.setFlash("Saved");
  } else {
    ctx.setFlash({ type: "error", msg: GENERAL_ERR_MSG });
  }

  return ctx.redirectBack();
}

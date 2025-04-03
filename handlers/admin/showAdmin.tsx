import NotFoundPage from "../../snippets/pages/NotFoundPage.tsx";
import Page from "../../snippets/pages/Page.tsx";
import { APP_ADMIN } from "../../util/consts.ts";
import { getAppSettings } from "../../util/kv/app.ts";
import type { AppContext, AppSettings } from "../../util/types.ts";

export default async function showAdminHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!user || user.username !== APP_ADMIN) {
    return <NotFoundPage />;
  }

  const settings = (await getAppSettings()).value || {};

  return (
    <Page>
      <h1>Admin</h1>
      <AppSettings settings={settings} />
    </Page>
  );
}

function AppSettings(props: { settings: AppSettings }) {
  return (
    <form method="post" action="/admin/app_settings">
      <p>
        <label>
          <input
            type="checkbox"
            name="isUplaodEnabled"
            checked={props.settings.isUploadEnabled}
          />{" "}
          Enable Upload
        </label>
      </p>
      <button>Submit</button>
    </form>
  );
}

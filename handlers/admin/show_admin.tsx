import { AppSettingsForm } from "../../snippets/admin/AppSettingsForm.tsx";
import AdminPage from "../../snippets/pages/AdminPage.tsx";
import NotFoundPage from "../../snippets/pages/NotFoundPage.tsx";
import { getBudgetsLiveCosts } from "../../util/admin/budgets.ts";
import { isSuperAdmin } from "../../util/admin/utils.ts";
import { getAppSettings } from "../../util/kv/app_settings.ts";
import type { AppContext } from "../../util/types.ts";

export default async function showAdminHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!isSuperAdmin(user)) {
    return <NotFoundPage />;
  }

  const settings = (await getAppSettings()).value;
  const budgetsLiveCosts = await getBudgetsLiveCosts(settings?.budgets || []);

  return (
    <AdminPage>
      <h1>Admin</h1>
      <AppSettingsForm
        settings={settings}
        budgetsLiveCosts={budgetsLiveCosts}
      />
    </AdminPage>
  );
}

import AdminPage from "../../components/pages/AdminPage.tsx";
import { withAdmin } from "../../util/admin/with_admin.ts";

export default withAdmin(() => {
  return (
    <AdminPage title="Admin">
      <ul>
        <li>
          <a href="/admin/users">Users</a>
        </li>
        <li>
          <a href="/admin/settings">Settings</a>
        </li>
        <li>
          <a href="/admin/mime">Mime Types</a>
        </li>
      </ul>
    </AdminPage>
  );
});

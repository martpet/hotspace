import AdminPage from "../../components/pages/AdminPage.tsx";
import { withAdmin } from "../../util/admin/with_admin.ts";
import { MIMES } from "../../util/inodes/mime_conf.ts";
import { listMimeTypes } from "../../util/kv/upload_stats.ts";

export default withAdmin(async () => {
  const mimeTypes = await listMimeTypes();
  return (
    <AdminPage title="Mime Types">
      <table class="basic-table">
        <thead>
          <tr>
            <th>Count</th>
            <th>Name</th>
            <th>Conf.</th>
          </tr>
        </thead>
        {mimeTypes.map(({ name, count }) => (
          <tr>
            <td>{count}</td>
            <td>{name}</td>
            <td>{MIMES[name] ? "✓" : "❌"}</td>
          </tr>
        ))}
      </table>
    </AdminPage>
  );
});

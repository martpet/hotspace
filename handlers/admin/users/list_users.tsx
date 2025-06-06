import { decodeTime } from "@std/ulid";
import AdminPage from "../../../components/pages/AdminPage.tsx";
import { adminDateFmt } from "../../../util/admin/date.ts";
import { withAdmin } from "../../../util/admin/with_admin.ts";
import { listUsers } from "../../../util/kv/users.ts";

export default withAdmin(async () => {
  const users = await listUsers({
    consistency: "eventual",
    reverse: true,
  });

  return (
    <AdminPage title="Users">
      <table class="basic-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Created</th>
          </tr>
        </thead>
        {users.map((user) => (
          <tr>
            <td>
              <a href={`/admin/users/${user.id}`}>{user.username}</a>
            </td>
            <td>
              {adminDateFmt.format(new Date(decodeTime(user.id)))}
            </td>
          </tr>
        ))}
      </table>
    </AdminPage>
  );
});

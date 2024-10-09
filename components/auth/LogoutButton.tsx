export default function LogoutButton() {
  return (
    <form method="POST" action="/logout">
      <button>Sign Out</button>
    </form>
  );
}

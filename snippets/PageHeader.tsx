import type { AppContext } from "../util/types.ts";
import ButtonLogout from "./auth/ButtonLogout.tsx";
import LoginOrRegister from "./auth/LoginOrRegister.tsx";

export interface PageHeaderProps {
  skipReg?: boolean;
  siteNameIsHeading?: boolean;
}

export default function PageHeader(props: PageHeaderProps, ctx: AppContext) {
  const { skipReg, siteNameIsHeading } = props;
  const { user } = ctx.state;

  return (
    <header class="page-header">
      <SiteName isHeading={siteNameIsHeading} />
      {user
        ? <UserNav username={user.username} />
        : <LoginOrRegister skipReg={skipReg} />}
    </header>
  );
}

function SiteName(props: { isHeading?: boolean }) {
  const NameEl = props.isHeading ? "h1" : "p";
  return <NameEl class="site-name">HotSpace</NameEl>;
}

function UserNav(props: { username: string }, ctx: AppContext) {
  const { username } = props;
  const isHome = new URL(ctx.req.url).pathname === "/";
  return (
    <>
      {isHome ? username : <a href="/">{username}</a>}
      <ButtonLogout />
    </>
  );
}

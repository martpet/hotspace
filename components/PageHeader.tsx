import type { AppContext } from "../util/types.ts";
import ButtonLogout from "./auth/ButtonLogout.tsx";
import LoginOrRegister from "./auth/LoginOrRegister.tsx";
import Breadcrumb from "./Breadcrumb.tsx";

export interface PageHeaderProps {
  siteNameIsHeading?: boolean;
  siteNameIsLink?: boolean;
  breadcrumb?: boolean;
  skipLogin?: boolean;
  skipReg?: boolean;
}

export default function PageHeader(props: PageHeaderProps, ctx: AppContext) {
  const {
    siteNameIsHeading,
    siteNameIsLink,
    breadcrumb,
    skipLogin,
    skipReg,
  } = props;

  const { user } = ctx.state;

  return (
    <header id="page-header">
      {breadcrumb
        ? <Breadcrumb />
        : <SiteName isHeading={siteNameIsHeading} isLink={siteNameIsLink} />}
      {user
        ? <AccountNav username={user.username} />
        : <LoginOrRegister skipLogin={skipLogin} skipReg={skipReg} />}
    </header>
  );
}

function SiteName(props: { isHeading?: boolean; isLink?: boolean }) {
  return props.isHeading
    ? <h1 class="site-name">HotSpace</h1>
    : (
      <p class="site-name">
        {props.isLink ? <a href="/">HotSpace</a> : "HotSpace"}
      </p>
    );
}

function AccountNav(props: { username: string }, ctx: AppContext) {
  const { username } = props;
  const isAccountPage = new URL(ctx.req.url).pathname === "/account";
  return (
    <>
      {isAccountPage ? username : <a href="/account">{username}</a>}
      <ButtonLogout />
    </>
  );
}

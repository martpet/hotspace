import type { AppContext } from "../util/types.ts";
import ButtonLogout from "./auth/ButtonLogout.tsx";
import LoginOrRegister from "./auth/LoginOrRegister.tsx";
import Breadcrumb, { type BreadcrumbProps } from "./Breadcrumb.tsx";

export interface PageHeaderProps {
  siteNameIsHeading?: boolean;
  siteNameIsLink?: boolean;
  breadcrumb?: boolean;
  breadcrumbProps?: BreadcrumbProps;
  skipLogin?: boolean;
  skipReg?: boolean;
}

export default function PageHeader(props: PageHeaderProps, ctx: AppContext) {
  const {
    siteNameIsHeading,
    siteNameIsLink,
    breadcrumb,
    breadcrumbProps,
    skipLogin,
    skipReg,
  } = props;

  const { user } = ctx.state;

  return (
    <header id="page-header">
      {breadcrumb
        ? <Breadcrumb {...breadcrumbProps} />
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
  const { pathname } = new URL(ctx.req.url);
  const isAccountPage = pathname === "/account";
  const isAboutPage = pathname === "/about";
  return (
    <>
      {isAccountPage ? username : <a href="/account">{username}</a>}
      {!isAboutPage && <a href="/about" class="help-sign">?</a>}
      <ButtonLogout />
    </>
  );
}

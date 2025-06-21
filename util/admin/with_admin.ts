import { Context, type Handler } from "$server";
import notFoundHandler from "../../handlers/not_found.tsx";
import { APP_ADMIN } from "../consts.ts";
import type { AppContext, AppHandler, State } from "../types.ts";

export type AdminContext = Context<StateWithUser>;
type StateWithUser = Omit<State, "user"> & Required<Pick<State, "user">>;

export function withAdmin(handler: Handler<StateWithUser>): AppHandler {
  return (ctx) => {
    if (!isAdminContext(ctx)) {
      return notFoundHandler(ctx);
    }
    return handler(ctx);
  };
}

function isAdminContext(ctx: AppContext): ctx is AdminContext {
  return ctx.state.user?.username === APP_ADMIN;
}

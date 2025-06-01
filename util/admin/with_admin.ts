import { Context, type Handler } from "$server";
import notFoundHandler from "../../handlers/not_found.tsx";
import { APP_ADMIN } from "../consts.ts";
import type { AppContext, AppHandler, State } from "../types.ts";

type HandlerWithAdmin = Handler<AdminState>;
type AdminState = Omit<State, "user"> & Required<Pick<State, "user">>;
export type AdminContext = Context<AdminState>;

export function withAdmin(handler: HandlerWithAdmin): AppHandler {
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

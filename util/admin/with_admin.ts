import { Context, type Handler } from "$server";
import { STATUS_CODE } from "@std/http/status";
import { APP_ADMIN } from "../consts.ts";
import type { AppContext, AppHandler, State } from "../types.ts";

type HandlerWithAdmin = Handler<AdminState>;
type AdminState = Omit<State, "user"> & Required<Pick<State, "user">>;
export type AdminContext = Context<AdminState>;

export function withAdmin(handler: HandlerWithAdmin): AppHandler {
  return (ctx) => {
    if (!isAdminContext(ctx)) {
      return ctx.respond(null, STATUS_CODE.NotFound);
    }
    return handler(ctx);
  };
}

function isAdminContext(ctx: AppContext): ctx is AdminContext {
  return ctx.state.user?.username === APP_ADMIN;
}

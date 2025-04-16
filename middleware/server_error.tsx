import { accepts, STATUS_CODE } from "@std/http";
import ErrorPage from "../components/pages/ErrorPage.tsx";
import type { AppMiddleware } from "../util/types.ts";

export const errorMiddleware: AppMiddleware = async (ctx, next) => {
  try {
    return await next();
  } catch (error) {
    console.error(error);
    ctx.resp.status = STATUS_CODE.InternalServerError;
    if (!accepts(ctx.req).includes("text/html")) {
      return ctx.respond();
    }
    return ctx.jsx(<ErrorPage error={error} />);
  }
};

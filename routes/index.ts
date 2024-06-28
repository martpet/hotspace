import type { RouteHandler } from "../types.ts";
import { homepage } from "./homepage.ts";

export const routes: { [k: string]: RouteHandler } = {
  "/": homepage,
};

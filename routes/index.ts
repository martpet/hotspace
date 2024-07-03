import type { RouteHandler } from "../types.ts";
import { homepage } from "./homepage.ts";

export const routes: [URLPatternInput, RouteHandler][] = [
  ["/", homepage],
];

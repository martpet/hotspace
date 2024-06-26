import type { RoutesHandlers } from "../types.ts";
import { home } from "./home.tsx";

export const handlers: RoutesHandlers = {
  "/": home,
};

import type { HandlersByPathname } from "../types.ts";
import { home } from "./home.tsx";

export const handlers: HandlersByPathname = {
  "/": home,
};

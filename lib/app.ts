import type { Context, Middleware } from "./types.ts";
import { htmlDoc } from "../utils/htmlDoc.ts";

export default class App {
  #routes: [URLPatternInput, string][] = [];
  #middlewares: Middleware[] = [];

  addRoute(patternInput: URLPatternInput, filepath: string) {
    this.#routes.push([patternInput, filepath]);
  }

  addMiddleware(middleware: Middleware) {
    this.#middlewares.push(middleware);
  }

  listen() {
    Deno.serve((req) => {
      const url = new URL(req.url);
      const ctx: Context = { req, url };
      return this.#composeMiddlewares(ctx);
    });
  }

  #composeMiddlewares(ctx: Context) {
    return this.#router(ctx);
  }

  async #router(ctx: Context) {
    for (let [patternInput, filepath] of this.#routes) {
      if (typeof patternInput === "string") {
        patternInput = { pathname: patternInput };
      }
      const urlPattern = new URLPattern(patternInput);
      if (urlPattern.test(ctx.url.href)) {
        ctx.patternResult = urlPattern.exec(ctx.url);
        const { default: handler } = await import(`../routes/${filepath}.ts`);
        const respOrString = await handler(ctx);
        if (typeof respOrString === "string") {
          const body = htmlDoc(respOrString);
          return new Response(body, {
            headers: { "content-type": "text/html" },
          });
        }
        return respOrString;
      }
    }
    throw new Error(`No route matched "${ctx.req.url}"`);
  }
}

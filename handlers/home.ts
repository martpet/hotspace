import { regForm } from "../snippets/reg_form.ts";
import { htmlResp } from "../utils/html.ts";
import type { Context } from "../utils/types.ts";

export default function homeHandler({ state }: Context) {
  const { user } = state;

  return htmlResp(`
    <title>Hotspace</title>
    
    <!-- 
    <h1>Hello</h1>
    <h2>Create New Account</h2>
    -->

    ${user ? `<p>Hello ${user.username}</p>` : ""}

    ${regForm}
  `);
}

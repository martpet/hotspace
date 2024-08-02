import { regForm } from "../snippets/reg_form.ts";
import { htmlResp } from "../utils/html.ts";

export default function homeHandler() {
  return htmlResp(`
    <title>Hotspace</title>
    
    <!-- 
    <h1>Hello</h1>
    <h2>Create New Account</h2>
    -->

    ${regForm}
  `);
}

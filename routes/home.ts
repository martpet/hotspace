import regForm from "../snippets/reg-form.ts";

export default function homeHandler() {
  return `
    <title>Hotspace</title>
    <h1>Hello</h1>
    <h2>Create New Account</h2>
    ${regForm()}
  `;
}

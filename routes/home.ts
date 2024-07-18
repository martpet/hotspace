import registration from "../snippets/registration.ts";

export default function home() {
  return `
    <title>Hotspace</title>
    <h1>Hello</h1>
    <h2>Create New Account</h2>
    ${registration()}
  `;
}

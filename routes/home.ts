import registration from "../snippets/registration.ts";

export default function home() {
  return `
    <title>Hello World!</title>
    <h1>Hello World!</h1>
    ${registration()}
  `;
}

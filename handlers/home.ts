import { page } from "../layouts/page.ts";
import { regForm } from "../snippets/reg-form.ts";

export default page(() => {
  return `
    <title>Hotspace</title>
    ${regForm}
  `;
});

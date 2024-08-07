import { page } from "../layouts/page.ts";
import { regForm } from "../snippets/reg-form.ts";
import { SITE_NAME } from "../utils/consts.ts";

export default page(() => {
  return `
    <title>${SITE_NAME}</title>
    ${regForm}
  `;
});

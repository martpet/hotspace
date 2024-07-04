import App from "./lib/app.ts";

import spacepage from "./handlers/space.ts";
import homepage from "./handlers/home.ts";
import foobar from "./handlers/foobar.ts";

const app = new App();

app.addRoute({ pathname: "/", hostname: ":spacename.*" }, spacepage);
app.addRoute("/", homepage);
app.addRoute("/foobar", foobar);

app.listen();

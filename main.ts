import App from "./lib/app.ts";

import spacepage from "./routes/space.ts";
import homepage from "./routes/home.ts";
import foobar from "./routes/foobar.ts";

const app = new App();

app.addRoute({ pathname: "/", hostname: ":spacename.*" }, spacepage);
app.addRoute("/", homepage);
app.addRoute("/foobar", foobar);

app.listen();

import { replaceFragment } from "$main";

const button = document.getElementById("toggle-chat");
button.disabled = false;
button.classList.remove("wait-disabled");
button.onclick = toggleHidden;

async function toggleHidden() {
  button.disabled = true;
  button.classList.add("spinner");
  if (!(await sendDb()).ok) return;
  const rootEl = document.getElementById("chat");
  const isHidden = !rootEl.hidden;
  if (rootEl.hasChildNodes()) {
    rootEl.hidden = isHidden;
  } else {
    await insertHtml();
  }
  button.textContent = `${isHidden ? "Enable" : "Disable"} Chat`;
  button.disabled = false;
  button.classList.remove("spinner");
}

function sendDb() {
  const { pathname } = location;
  return fetch("/chat/toggle", {
    method: "post",
    body: JSON.stringify({ pathname }),
  });
}

async function insertHtml() {
  await replaceFragment("chat");
  const script = document.getElementById("chat-script");
  const newScript = document.createElement("script");
  newScript.src = script.src;
  newScript.type = script.type;
  script.replaceWith(newScript);
}

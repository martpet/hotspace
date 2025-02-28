import { replaceFragment } from "$main";

const button = document.getElementById("toggle-chat");
button.disabled = false;
button.classList.remove("wait-disabled");
button.onclick = toggle;

async function toggle() {
  setInProgress(true);
  if (!(await callDb()).ok) return;
  const rootEl = document.getElementById("chat");
  const isHidden = !rootEl.hidden;
  const isHtmlInserted = rootEl.hasChildNodes();
  if (isHtmlInserted) {
    rootEl.hidden = isHidden;
  } else {
    await replaceFragment("chat");
    runChatScript();
  }
  if (!isHidden) {
    const chatEl = document.getElementById("chat");
    chatEl.scrollIntoView({ behavior: "smooth" });
  }
  setInProgress(false);
  button.textContent = `${isHidden ? "Enable" : "Disable"} Chat`;
}

function setInProgress(inProgress) {
  button.disabled = inProgress;
  button.classList.toggle("spinner", inProgress);
}

function callDb() {
  return fetch("/chat/toggle", {
    method: "post",
    body: JSON.stringify({
      inodeId: button.dataset.inodeId,
    }),
  });
}

async function runChatScript() {
  const script = document.getElementById("chat-script");
  const newScript = document.createElement("script");
  newScript.src = script.src;
  newScript.type = script.type;
  script.replaceWith(newScript);
}

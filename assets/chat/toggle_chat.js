import { replaceFragment } from "$main";

const button = document.getElementById("toggle-chat");

button.disabled = false;
button.classList.remove("wait-disabled");

button.onclick = async function () {
  setInProgress(true);

  if (!(await callDb()).ok) return;

  const rootEl = document.getElementById("chat");
  const showChat = rootEl.hidden;
  const isHtmlInserted = rootEl.hasChildNodes();

  if (isHtmlInserted) {
    rootEl.hidden = !showChat;
  } else {
    await replaceFragment("chat");
    reinsertScript("chat-script");
  }

  if (showChat) {
    const chatEl = document.getElementById("chat");
    chatEl.scrollIntoView({ behavior: "smooth" });
  }

  button.childNodes[1].textContent = `${showChat ? "Disable" : "Enable"} Chat`;
  setInProgress(false);
};

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

async function reinsertScript(scriptId) {
  const script = document.getElementById(scriptId);
  const newScript = document.createElement("script");
  newScript.src = script.src;
  newScript.type = script.type;
  script.replaceWith(newScript);
}

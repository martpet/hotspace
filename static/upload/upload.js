const input = document.querySelector("input[type=file]");
const { workerPath } = input.dataset;
const worker = new Worker(workerPath, { type: "module" });

input.addEventListener("change", () => {
  const file = input.files[0];
  worker.postMessage(file);
});

setInterval(() => {
  console.log("hello11111");
}, 1000);

const text = document.getElementById("text");
window.addEventListener("message", (event) => {
  console.log(event.data);
  if (text) {
    text.innerText = event.data;
  }
});
const btn = document.getElementById("send");
btn.addEventListener('click', () => {
  const vscode = acquireVsCodeApi();
  vscode.postMessage("from webview");
});
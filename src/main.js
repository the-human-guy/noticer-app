const { invoke } = window.__TAURI__.core;
const { dialog } = window.__TAURI__;

let greetInputEl;
let greetMsgEl;

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  greetMsgEl.textContent = await invoke("greet", { name: greetInputEl.value });
}

window.addEventListener("DOMContentLoaded", () => {
  // greet();
});

async function pick_dir() {
  const file = await dialog.open({
    multiple: false,
    directory: true,
  });
  console.log(file);
}
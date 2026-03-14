// tauri
const { invoke } = window.__TAURI__.core;
const { fs, opener } = window.__TAURI__;

// alpine
const alp = Alpine

// sane aliases
window.$ = document.querySelector.bind(document)
window.$$ = document.querySelectorAll.bind(document)

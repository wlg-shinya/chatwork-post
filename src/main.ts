import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

// axios
import axios from "axios";
axios.defaults.baseURL = `${import.meta.env.VITE_BACKEND_URL}:${import.meta.env.VITE_BACKEND_PORT}`;

createApp(App).mount("#app");

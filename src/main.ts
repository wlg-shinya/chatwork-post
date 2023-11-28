import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

// axios
import axios from "axios";
axios.defaults.baseURL = `${import.meta.env.VITE_BASE_URL}:${import.meta.env.VITE_BACKEND_PORT}`;

// bootstrap
import * as bootstrap from "bootstrap";

createApp(App).use(bootstrap).mount("#app");

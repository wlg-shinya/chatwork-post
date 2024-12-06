import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

// axios
import axios from "axios";
axios.defaults.baseURL = `${import.meta.env.VITE_BASE_URL}`;

createApp(App).mount("#app");

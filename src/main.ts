import { createApp } from "vue";
import App from "./App.vue";

// axios
import axios from "axios";
axios.defaults.baseURL = `${import.meta.env.VITE_BASE_URL}:${import.meta.env.VITE_BACKEND_PORT}`;

// Vuetify
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
const vuetify = createVuetify({
  components,
  directives,
});

createApp(App).use(vuetify).mount("#app");

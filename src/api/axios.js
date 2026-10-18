import axios from "axios";

const api = axios.create({
  baseURL: "https://junior-inivtation.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

export default api;

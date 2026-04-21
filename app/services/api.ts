import axios from "axios";

// Creamos una instancia de axios con la configuración base
const baseURL = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/+$/, "") || "/api";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Opcional: Interceptor para agregar el Token si usas autenticación
/*
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // O cookies
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
*/

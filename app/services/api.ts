import axios from "axios";

// Creamos una instancia de axios con la configuración base
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
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
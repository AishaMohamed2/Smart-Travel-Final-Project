// Title: <Django & React Web App Tutorial - Authentication, Databases, Deployment & More...>
//Author: <Tech with Tim>
//Date: <26/03/2024>
//Code version: <n/a>
//Availability: <https://www.youtube.com/watch?v=c-QsfbznSXI> 
//REUSED ALL

import axios from "axios";
import { ACCESS_TOKEN } from "./constants";


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : apiUrl,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
// Configuration for different environments
const config = {
  development: {
    API_URL: "http://localhost:5000",
    SOCKET_URL: "http://localhost:5000",
  },
  production: {
    API_URL:
      import.meta.env.VITE_API_URL || "https://mentormate-backend.onrender.com",
    SOCKET_URL:
      import.meta.env.VITE_SOCKET_URL ||
      "https://mentormate-backend.onrender.com",
  },
};

const environment = import.meta.env.MODE || "development";

export const API_URL = config[environment].API_URL;
export const SOCKET_URL = config[environment].SOCKET_URL;

export default config[environment];

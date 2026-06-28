// Centralized API base URL helper
// En local: utilise VITE_API_URL depuis .env (http://localhost:8080)  
// En production (Vercel): VITE_API_URL pas defini -> "" -> requetes relatives -> proxy Vercel
const API_BASE = import.meta.env.VITE_API_URL ?? "";

export default API_BASE;

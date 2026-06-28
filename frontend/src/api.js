// Centralized API base URL helper
// In production (Vercel), requests go through Vercel's proxy to avoid CORS
// In development, requests go directly to localhost
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default API_BASE;

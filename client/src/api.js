const API = "/api";

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(url, options = {}) {
  const res = await fetch(API + url, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });
  const json = await res.json();
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    window.location.href = "/login";
    throw new Error("Sesi expired, silakan login ulang");
  }
  if (!res.ok) throw new Error(json.error || "Terjadi kesalahan");
  return json;
}

// Auth
export const login = (data) => request("/auth/login", { method: "POST", body: JSON.stringify(data) });
export const getMe = () => request("/auth/me");

// Dashboard
export const getDashboardStats = () => request("/dashboard/stats");

// Users
export const getUsers = (search = "") => request(`/users${search ? `?search=${encodeURIComponent(search)}` : ""}`);
export const getUser = (id) => request(`/users/${id}`);
export const createUser = (data) => request("/users", { method: "POST", body: JSON.stringify(data) });
export const updateUser = (id, data) => request(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteUser = (id) => request(`/users/${id}`, { method: "DELETE" });

// Admin Management
export const getAdmins = () => request("/admins");
export const createAdmin = (data) => request("/admins", { method: "POST", body: JSON.stringify(data) });
export const resetAdminPassword = (id, data) => request(`/admins/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteAdmin = (id) => request(`/admins/${id}`, { method: "DELETE" });

// Nilai
export const getNilaiList = (search = "") => request(`/nilai${search ? `?search=${encodeURIComponent(search)}` : ""}`);
export const getNilai = (id) => request(`/nilai/${id}`);
export const createNilai = (data) => request("/nilai", { method: "POST", body: JSON.stringify(data) });
export const updateNilai = (id, data) => request(`/nilai/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteNilai = (id) => request(`/nilai/${id}`, { method: "DELETE" });
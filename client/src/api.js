const BASE_URL = import.meta.env.VITE_API_URL || "https://pasyaproject-production.up.railway.app/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(method, path, body = null) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Terjadi kesalahan");
  return data;
}

// ==================== AUTH ====================

export function login(body) {
  return request("POST", "/auth/login", body);
}

export function getMe() {
  return request("GET", "/auth/me");
}

// ==================== ADMINS ====================

export function getAdmins() {
  return request("GET", "/admins");
}

export function createAdmin(body) {
  return request("POST", "/admins", body);
}

export function resetAdminPassword(id, body) {
  return request("PUT", `/admins/${id}`, body);
}

export function deleteAdmin(id) {
  return request("DELETE", `/admins/${id}`);
}

// ==================== DASHBOARD ====================

export function getDashboardStats() {
  return request("GET", "/dashboard/stats");
}

// ==================== USERS ====================

export function getUsers(search = "") {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return request("GET", `/users${query}`);
}

export function getUserById(id) {
  return request("GET", `/users/${id}`);
}

export function createUser(body) {
  return request("POST", "/users", body);
}

export function updateUser(id, body) {
  return request("PUT", `/users/${id}`, body);
}

export function deleteUser(id) {
  return request("DELETE", `/users/${id}`);
}

// ==================== NILAI ====================

export function getNilaiList(search = "", pertemuan = "") {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (pertemuan) params.set("pertemuan", pertemuan);
  const query = params.toString() ? `?${params.toString()}` : "";
  return request("GET", `/nilai${query}`);
}

export function getNilaiById(id) {
  return request("GET", `/nilai/${id}`);
}

export function createNilai(body) {
  return request("POST", "/nilai", body);
}

export function updateNilai(id, body) {
  return request("PUT", `/nilai/${id}`, body);
}

export function deleteNilai(id) {
  return request("DELETE", `/nilai/${id}`);
}
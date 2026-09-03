async function request(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.error || body.detail || detail;
    } catch {
      // non-json error
    }
    throw new Error(detail);
  }
  return res.json();
}

export const api = {
  projects: () => request("/api/projects"),
  createProject: (data) => request("/api/projects", { method: "POST", body: JSON.stringify(data) }),
  updateProject: (id, patch) => request(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteProject: (id) => request(`/api/projects/${id}`, { method: "DELETE" }),
  start: (id) => request(`/api/projects/${id}/start`, { method: "POST" }),
  stop: (id) => request(`/api/projects/${id}/stop`, { method: "POST" }),
  logs: (id, tail = 200) => request(`/api/projects/${id}/logs?tail=${tail}`),
  git: (id) => request(`/api/projects/${id}/git`),
  wishes: (id) => request(`/api/projects/${id}/wishes`),
  deleteWish: (id, wishId) => request(`/api/projects/${id}/wishes/${wishId}`, { method: "DELETE" }),
  sessions: () => request("/api/opencode/sessions"),
  files: (id, path = "") => request(`/api/projects/${id}/files?path=${encodeURIComponent(path)}`),
  file: (id, path) => request(`/api/projects/${id}/file?path=${encodeURIComponent(path)}`),
  saveFile: (id, path, content) =>
    request(`/api/projects/${id}/file`, { method: "PUT", body: JSON.stringify({ path, content }) }),
};

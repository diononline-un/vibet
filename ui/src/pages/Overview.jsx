import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

function ProjectForm({ onCreate, onCancel }) {
  const [fields, setFields] = useState({ name: "", path: "", devCommand: "npm run dev", devPort: 5173 });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.createProject(fields);
      onCreate();
    } catch (err) {
      setError(err.message);
    }
  };

  const set = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form className="form" onSubmit={submit}>
      <h2>New project</h2>
      <label>
        Name
        <input value={fields.name} onChange={set("name")} required autoFocus />
      </label>
      <label>
        Path (absolute)
        <input value={fields.path} onChange={set("path")} required placeholder="/home/you/Projekte/app" />
      </label>
      <label>
        Dev command (runs in container, cwd = project)
        <input value={fields.devCommand} onChange={set("devCommand")} />
      </label>
      <label>
        Dev port (inside container)
        <input type="number" value={fields.devPort} onChange={set("devPort")} />
      </label>
      {error && <div className="muted" style={{ color: "#c62828" }}>{error}</div>}
      <div className="row">
        <button className="primary" type="submit">Create</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function Overview() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      setProjects(await api.projects());
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, []);

  const toggle = async (p) => {
    try {
      if (p.container?.running) await api.stop(p.id);
      else await api.start(p.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete project ${p.name}? Container will be removed.`)) return;
    try {
      await api.deleteProject(p.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="topbar">
        <h1>vibet</h1>
        <span className="muted">{projects.length} projects</span>
        <div style={{ flex: 1 }} />
        <button className="primary" onClick={() => setCreating((c) => !c)}>
          {creating ? "Close" : "New project"}
        </button>
      </div>
      {error && <div className="content muted" style={{ color: "#c62828" }}>{error}</div>}
      {creating && (
        <ProjectForm
          onCreate={() => {
            setCreating(false);
            load();
          }}
          onCancel={() => setCreating(false)}
        />
      )}
      <div className="grid">
        {projects.map((p) => (
          <div key={p.id} className="card">
            <div className="row">
              <h2>{p.name}</h2>
              <span className={`badge ${p.container?.running ? "running" : "stopped"}`}>
                {p.container?.running ? "running" : "stopped"}
              </span>
              {p.hideAi && <span className="badge">AI hidden</span>}
            </div>
            <div className="path">{p.path}</div>
            <div className="row">
              {p.hostPort > 0 && (
                <a className="muted" href={`http://127.0.0.1:${p.hostPort}`} target="_blank" rel="noreferrer">
                  :{p.hostPort}
                </a>
              )}
              {p.git?.branch && <span className="badge">{p.git.branch}</span>}
              {p.git?.dirty && <span className="badge">dirty</span>}
            </div>
            <div className="row">
              <Link to={`/p/${p.id}`}>
                <button>Open</button>
              </Link>
              <button onClick={() => toggle(p)}>{p.container?.running ? "Stop" : "Start"}</button>
              <button className="danger" onClick={() => remove(p)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

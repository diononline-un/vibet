import { useEffect, useState, lazy, Suspense } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import Terminal from "../components/Terminal.jsx";

const MonacoLazy = lazy(() => import("../components/Editor.jsx"));

function Wishes({ id, refresh }) {
  const [wishes, setWishes] = useState([]);

  useEffect(() => {
    api.wishes(id).then(setWishes).catch(() => {});
  }, [id, refresh]);

  const remove = async (wishId) => {
    await api.deleteWish(id, wishId);
    api.wishes(id).then(setWishes);
  };

  if (!wishes.length) return <div className="muted">No wishes yet. Open live view, click Feedback, mark a spot.</div>;
  return wishes.map((w) => (
    <div key={w.id} className="wish">
      <div>{w.note}</div>
      {w.pin && (
        <div className="meta">
          {w.pin.element} @ {w.pin.x}%, {w.pin.y}% · {w.path}
        </div>
      )}
      <div className="meta">{new Date(w.createdAt).toLocaleString()}</div>
      <button className="danger" onClick={() => remove(w.id)}>Delete</button>
    </div>
  ));
}

function Files({ id }) {
  const [tree, setTree] = useState([]);
  const [cwd, setCwd] = useState("");
  const [openPath, setOpenPath] = useState(null);
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const loadTree = async (path = "") => {
    try {
      setTree(await api.files(id, path));
      setCwd(path);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadTree("");
  }, [id]);

  const open = async (path) => {
    try {
      const { content } = await api.file(id, path);
      setOpenPath(path);
      setContent(content);
      setSaved(false);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const save = async () => {
    try {
      await api.saveFile(id, openPath, content);
      setSaved(true);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const navigate = (item) => (item.dir ? loadTree(item.path) : open(item.path));
  const up = () => {
    const parent = cwd.split("/").slice(0, -1).join("/");
    loadTree(parent);
  };

  return (
    <div>
      {error && <div className="muted" style={{ color: "#c62828" }}>{error}</div>}
      <div className="filetree">
        <ul>
          <li onClick={up}>..</li>
          {tree.map((item) => (
            <li key={item.path} onClick={() => navigate(item)}>
              {item.dir ? "▸ " : "  "}
              {item.name}
            </li>
          ))}
        </ul>
        <div className="editor">
          {openPath ? (
            <>
              <div className="savebar">
                <span className="muted">{openPath}</span>
                <div style={{ flex: 1 }} />
                {saved && <span className="badge">saved</span>}
                <button className="primary" onClick={save}>Save</button>
              </div>
              <Editor content={content} onChange={setContent} path={openPath} />
            </>
          ) : (
            <div className="muted" style={{ padding: 10 }}>Select a file</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Editor({ content, onChange, path }) {
  return (
    <Suspense fallback={<div className="muted" style={{ padding: 10 }}>loading editor...</div>}>
      <MonacoLazy content={content} onChange={onChange} path={path} />
    </Suspense>
  );
}

function Git({ id }) {
  const [info, setInfo] = useState({ branch: null, commits: [], dirty: false, error: null });

  useEffect(() => {
    api.git(id).then(setInfo).catch((e) => setInfo({ error: e.message }));
  }, [id]);

  if (info.error) return <div className="muted">{info.error}</div>;
  return (
    <div>
      <div className="gitline">
        branch: <b>{info.branch}</b> {info.dirty ? "(dirty)" : "(clean)"}
      </div>
      <div style={{ height: 10 }} />
      {info.commits.map((c) => (
        <div key={c} className="gitline">{c}</div>
      ))}
    </div>
  );
}

function Logs({ id, refresh }) {
  const [logs, setLogs] = useState("");

  useEffect(() => {
    api.logs(id).then((r) => setLogs(r.logs)).catch(() => {});
  }, [id, refresh]);

  return (
    <pre className="gitline" style={{ whiteSpace: "pre-wrap", maxHeight: "calc(100vh - 220px)", overflow: "auto" }}>
      {logs || "(no logs)"}
    </pre>
  );
}

export default function Project() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tab, setTab] = useState("live");
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const load = async () => {
    try {
      const all = await api.projects();
      const found = all.find((p) => p.id === id);
      if (!found) throw new Error("project not found");
      setProject(found);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [id]);

  const action = async (fn) => {
    try {
      await fn(id);
      setRefresh((r) => r + 1);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleHide = async () => {
    try {
      await api.updateProject(id, { hideAi: !project.hideAi });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!project)
    return (
      <div className="content">
        <Link to="/">← back</Link>
        {error && <div className="muted" style={{ color: "#c62828" }}>{error}</div>}
      </div>
    );

  const running = Boolean(project.container?.running);

  const tabs = ["live", "terminal", "wishes", "files", "git", "logs"];

  return (
    <div>
      <div className="topbar">
        <Link to="/">←</Link>
        <h1>{project.name}</h1>
        <span className={`badge ${running ? "running" : "stopped"}`}>{running ? "running" : "stopped"}</span>
        {project.hideAi && <span className="badge">AI hidden</span>}
        {project.hostPort > 0 && (
          <a className="muted" href={`http://127.0.0.1:${project.hostPort}`} target="_blank" rel="noreferrer">
            :{project.hostPort}
          </a>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={toggleHide}>{project.hideAi ? "Show AI" : "Hide AI"}</button>
        <button onClick={() => action(running ? api.stop : api.start)}>{running ? "Stop" : "Start"}</button>
      </div>
      {error && <div className="content muted" style={{ color: "#c62828" }}>{error}</div>}
      <div className="tabs">
        {tabs.map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="content">
        {tab === "live" &&
          (running ? (
            <iframe className="liveframe" src={`/p/${project.id}/`} title="live" />
          ) : (
            <div className="muted">Project not running. Start it first.</div>
          ))}
        {tab === "terminal" && (running ? <Terminal projectId={project.id} /> : <div className="muted">Project not running.</div>)}
        {tab === "wishes" && <Wishes id={project.id} refresh={refresh} />}
        {tab === "files" && <Files id={project.id} />}
        {tab === "git" && <Git id={project.id} />}
        {tab === "logs" && <Logs id={project.id} refresh={refresh} />}
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function useToken() {
  const [token, setTokenState] = useState(() => localStorage.getItem("token") || "");

  const setToken = (value) => {
    setTokenState(value);
    if (value) {
      localStorage.setItem("token", value);
    } else {
      localStorage.removeItem("token");
    }
  };

  return [token, setToken];
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function App() {
  const [token, setToken] = useToken();
  const [mode, setMode] = useState("login");
  const [status, setStatus] = useState("");
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [taskForm, setTaskForm] = useState({ title: "", inputText: "", operation: "uppercase" });

  const isAuthed = useMemo(() => Boolean(token), [token]);

  const fetchTasks = async () => {
    if (!token) return;
    const res = await fetch(`${API_URL}/tasks`, {
      headers: { "Content-Type": "application/json", ...authHeaders(token) }
    });
    if (res.ok) {
      const data = await res.json();
      setTasks(data);
      if (selectedTask) {
        const fresh = data.find((t) => t._id === selectedTask._id);
        if (fresh) setSelectedTask(fresh);
      }
    }
  };

  useEffect(() => {
    if (token) {
      fetchTasks();
      const timer = setInterval(fetchTasks, 3000);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [token]);

  const submitAuth = async (event) => {
    event.preventDefault();
    setStatus("");
    const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
    const body = mode === "login"
      ? { email: authForm.email, password: authForm.password }
      : authForm;

    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
      setStatus(data.message || "Authentication failed");
      return;
    }

    setToken(data.token);
    setStatus("Logged in");
  };

  const submitTask = async (event) => {
    event.preventDefault();
    setStatus("");
    const res = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify(taskForm)
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.message || "Failed to create task");
      return;
    }
    setTaskForm({ title: "", inputText: "", operation: "uppercase" });
    setStatus("Task created");
    fetchTasks();
  };

  const runTask = async (taskId) => {
    setStatus("");
    const res = await fetch(`${API_URL}/tasks/${taskId}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) }
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.message || "Failed to run task");
      return;
    }
    setStatus("Task queued");
    fetchTasks();
  };

  const logout = () => {
    setToken("");
    setTasks([]);
    setSelectedTask(null);
  };

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">MERN + Worker + K3s</p>
          <h1>AI Task Processing Platform</h1>
          <p className="subtitle">Run string operations at scale with async workers.</p>
        </div>
        {isAuthed ? (
          <button className="btn ghost" onClick={logout}>Logout</button>
        ) : null}
      </header>

      <main className="grid">
        <section className="panel">
          <h2>{isAuthed ? "Create Task" : "Welcome"}</h2>
          {!isAuthed ? (
            <>
              <div className="tabs">
                <button
                  className={mode === "login" ? "tab active" : "tab"}
                  onClick={() => setMode("login")}
                >
                  Login
                </button>
                <button
                  className={mode === "register" ? "tab active" : "tab"}
                  onClick={() => setMode("register")}
                >
                  Register
                </button>
              </div>
              <form onSubmit={submitAuth} className="form">
                {mode === "register" ? (
                  <label>
                    Name
                    <input
                      value={authForm.name}
                      onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })}
                      placeholder="Ada Lovelace"
                      required
                    />
                  </label>
                ) : null}
                <label>
                  Email
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                    placeholder="you@company.com"
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                    placeholder="******"
                    required
                  />
                </label>
                <button className="btn" type="submit">{mode === "login" ? "Login" : "Create account"}</button>
              </form>
            </>
          ) : (
            <form onSubmit={submitTask} className="form">
              <label>
                Title
                <input
                  value={taskForm.title}
                  onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
                  placeholder="Weekly sync"
                  required
                />
              </label>
              <label>
                Input text
                <textarea
                  rows="4"
                  value={taskForm.inputText}
                  onChange={(event) => setTaskForm({ ...taskForm, inputText: event.target.value })}
                  placeholder="Paste the content to transform"
                  required
                />
              </label>
              <label>
                Operation
                <select
                  value={taskForm.operation}
                  onChange={(event) => setTaskForm({ ...taskForm, operation: event.target.value })}
                >
                  <option value="uppercase">Uppercase</option>
                  <option value="lowercase">Lowercase</option>
                  <option value="reverse">Reverse</option>
                  <option value="word_count">Word count</option>
                </select>
              </label>
              <button className="btn" type="submit">Create task</button>
            </form>
          )}

          {status ? <p className="status">{status}</p> : null}
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Tasks</h2>
            <button className="btn ghost" onClick={fetchTasks}>Refresh</button>
          </div>
          {tasks.length === 0 ? (
            <p className="empty">No tasks yet.</p>
          ) : (
            <ul className="task-list">
              {tasks.map((task) => (
                <li
                  key={task._id}
                  className={selectedTask?._id === task._id ? "task active" : "task"}
                  onClick={() => setSelectedTask(task)}
                >
                  <div>
                    <h3>{task.title}</h3>
                    <p className={`badge ${task.status}`}>{task.status}</p>
                  </div>
                  <p className="meta">{task.operation.replace("_", " ")}</p>
                  <button className="btn small" onClick={(event) => {
                    event.stopPropagation();
                    runTask(task._id);
                  }}>Run</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel wide">
          <h2>Task Details</h2>
          {!selectedTask ? (
            <p className="empty">Select a task to view details.</p>
          ) : (
            <div className="details">
              <div>
                <p className="label">Input</p>
                <p className="code-block">{selectedTask.inputText}</p>
              </div>
              <div>
                <p className="label">Result</p>
                <p className="code-block">{selectedTask.result || "-"}</p>
              </div>
              <div>
                <p className="label">Logs</p>
                <ul className="logs">
                  {(selectedTask.logs || []).map((log, index) => (
                    <li key={`${log}-${index}`}>{log}</li>
                  ))}
                </ul>
                {selectedTask.error ? <p className="error">{selectedTask.error}</p> : null}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

function App() {
    const [mode, setMode] = useState("login");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [user, setUser] = useState(null);

    const [task, setTask] = useState("");
    const [priority, setPriority] = useState("medium");
    const [deadline, setDeadline] = useState("");

    const [tasks, setTasks] = useState([]);

    const [editId, setEditId] = useState(null);
    const [editTask, setEditTask] = useState("");
    const [editPriority, setEditPriority] = useState("medium");
    const [editDeadline, setEditDeadline] = useState("");

    const [message, setMessage] = useState("");

    // =========================
    // Load Tasks
    // =========================

    const loadTasks = async (userId) => {
        try {
            const response = await fetch(
                `${API}/tasks?user_id=${userId}`
            );

            const data = await response.json();

            setTasks(data);
        } catch (error) {
            console.error(error);
        }
    };


    // =========================
    // Login
    // =========================

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(
                `${API}/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message);
                return;
            }

            setUser(data.user);

            await loadTasks(data.user.id);

            setMessage("");
        } catch (error) {
            setMessage("Server connection failed!");
        }
    };


    // =========================
    // Register
    // =========================

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(
                `${API}/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message);
                return;
            }

            setMessage(
                "Registration successful! Please login."
            );

            setMode("login");

            setName("");
            setPassword("");
        } catch (error) {
            setMessage("Server connection failed!");
        }
    };


    // =========================
    // Create Task
    // =========================

    const handleCreateTask = async (e) => {
        e.preventDefault();

        if (!task.trim()) {
            return;
        }

        try {
            const response = await fetch(
                `${API}/tasks`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        user_id: user.id,
                        title: task,
                        description:
                            "Task created from TaskFlow",
                        priority,
                        deadline: deadline || null
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message);
                return;
            }

            setTask("");
            setPriority("medium");
            setDeadline("");

            await loadTasks(user.id);
        } catch (error) {
            setMessage("Failed to create task!");
        }
    };


    // =========================
    // Update Task
    // =========================

    const handleUpdateTask = async (id) => {
        const currentTask = tasks.find(
            (item) => item.id === id
        );

        if (!currentTask) {
            return;
        }

        try {
            const response = await fetch(
                `${API}/tasks/${id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        title: editTask,
                        description:
                            currentTask.description,
                        status: currentTask.status,
                        priority: editPriority,
                        deadline:
                            editDeadline || null
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message);
                return;
            }

            setEditId(null);
            setEditTask("");
            setEditPriority("medium");
            setEditDeadline("");

            await loadTasks(user.id);
        } catch (error) {
            setMessage("Failed to update task!");
        }
    };


    // =========================
    // Change Status
    // =========================

    const handleStatusChange = async (
        id,
        newStatus
    ) => {
        const currentTask = tasks.find(
            (item) => item.id === id
        );

        if (!currentTask) {
            return;
        }

        try {
            await fetch(
                `${API}/tasks/${id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        title: currentTask.title,
                        description:
                            currentTask.description,
                        status: newStatus,
                        priority:
                            currentTask.priority || "medium",
                        deadline:
                            currentTask.deadline || null
                    })
                }
            );

            await loadTasks(user.id);
        } catch (error) {
            console.error(error);
        }
    };


    // =========================
    // Delete Task
    // =========================

    const handleDeleteTask = async (id) => {
        try {
            const response = await fetch(
                `${API}/tasks/${id}`,
                {
                    method: "DELETE"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message);
                return;
            }

            await loadTasks(user.id);
        } catch (error) {
            setMessage("Failed to delete task!");
        }
    };


    // =========================
    // Start Editing
    // =========================

    const startEdit = (item) => {
        setEditId(item.id);
        setEditTask(item.title);
        setEditPriority(
            item.priority || "medium"
        );

        setEditDeadline(
            item.deadline
                ? item.deadline.substring(0, 10)
                : ""
        );
    };


    // =========================
    // Logout
    // =========================

    const handleLogout = () => {
        setUser(null);
        setTasks([]);
        setEmail("");
        setPassword("");
        setMessage("");
    };


    // =========================
    // Statistics
    // =========================

    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(
        (item) => item.status === "completed"
    ).length;

    const pendingTasks = tasks.filter(
        (item) => item.status !== "completed"
    ).length;


    // =========================
    // Format Deadline
    // =========================

    const formatDeadline = (date) => {
        if (!date) {
            return "No deadline";
        }

        const deadlineDate = new Date(date);

        return deadlineDate.toLocaleDateString(
            "en-US",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );
    };


    // =========================
    // Login/Register Screen
    // =========================

    if (!user) {
        return (
            <div className="auth-page">

                <div className="auth-card">

                    <div className="brand">
                        <div className="brand-logo">
                            T
                        </div>

                        <div>
                            <h1>TaskFlow</h1>
                            <p>Smart task management</p>
                        </div>
                    </div>


                    <div className="auth-tabs">

                        <button
                            className={
                                mode === "login"
                                    ? "active"
                                    : ""
                            }
                            onClick={() => {
                                setMode("login");
                                setMessage("");
                            }}
                        >
                            Login
                        </button>

                        <button
                            className={
                                mode === "register"
                                    ? "active"
                                    : ""
                            }
                            onClick={() => {
                                setMode("register");
                                setMessage("");
                            }}
                        >
                            Register
                        </button>

                    </div>


                    {message && (
                        <div className="message">
                            {message}
                        </div>
                    )}


                    {mode === "login" ? (

                        <form
                            onSubmit={handleLogin}
                            className="auth-form"
                        >

                            <label>Email</label>

                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                required
                            />


                            <label>Password</label>

                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                required
                            />


                            <button
                                type="submit"
                                className="primary-btn"
                            >
                                Login
                            </button>

                        </form>

                    ) : (

                        <form
                            onSubmit={handleRegister}
                            className="auth-form"
                        >

                            <label>Name</label>

                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) =>
                                    setName(e.target.value)
                                }
                                required
                            />


                            <label>Email</label>

                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                required
                            />


                            <label>Password</label>

                            <input
                                type="password"
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                required
                            />


                            <button
                                type="submit"
                                className="primary-btn"
                            >
                                Create Account
                            </button>

                        </form>

                    )}

                </div>

            </div>
        );
    }


    // =========================
    // Dashboard
    // =========================

    return (
        <div className="app">

            <aside className="sidebar">

                <div className="sidebar-brand">

                    <div className="brand-logo">
                        T
                    </div>

                    <span>TaskFlow</span>

                </div>


                <nav>

                    <div className="nav-item active">
                        Dashboard
                    </div>

                    <div className="nav-item">
                        My Tasks
                    </div>

                </nav>


                <div className="sidebar-bottom">

                    <div className="user-mini">

                        <div className="avatar">
                            {user.name
                                ?.charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>
                            <strong>
                                {user.name}
                            </strong>

                            <small>
                                {user.email}
                            </small>
                        </div>

                    </div>


                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

            </aside>


            <main className="main">

                <header className="topbar">

                    <div>
                        <h2>
                            Welcome back, {user.name}
                        </h2>

                        <p>
                            Manage your tasks and stay productive.
                        </p>
                    </div>

                </header>


                {message && (
                    <div className="dashboard-message">
                        {message}
                    </div>
                )}


                {/* =========================
                    Statistics
                ========================= */}

                <section className="stats">

                    <div className="stat-card">

                        <span>Total Tasks</span>

                        <strong>
                            {totalTasks}
                        </strong>

                    </div>


                    <div className="stat-card">

                        <span>Pending</span>

                        <strong>
                            {pendingTasks}
                        </strong>

                    </div>


                    <div className="stat-card">

                        <span>Completed</span>

                        <strong>
                            {completedTasks}
                        </strong>

                    </div>

                </section>


                {/* =========================
                    Create Task
                ========================= */}

                <section className="create-section">

                    <div className="section-title">

                        <h3>Create New Task</h3>

                        <p>
                            Add a task with priority and deadline.
                        </p>

                    </div>


                    <form
                        className="create-form"
                        onSubmit={handleCreateTask}
                    >

                        <input
                            type="text"
                            placeholder="What needs to be done?"
                            value={task}
                            onChange={(e) =>
                                setTask(e.target.value)
                            }
                        />


                        <select
                            value={priority}
                            onChange={(e) =>
                                setPriority(e.target.value)
                            }
                        >

                            <option value="low">
                                Low Priority
                            </option>

                            <option value="medium">
                                Medium Priority
                            </option>

                            <option value="high">
                                High Priority
                            </option>

                        </select>


                        <input
                            type="date"
                            value={deadline}
                            onChange={(e) =>
                                setDeadline(e.target.value)
                            }
                        />


                        <button
                            type="submit"
                            className="primary-btn"
                        >
                            + Add Task
                        </button>

                    </form>

                </section>


                {/* =========================
                    Task List
                ========================= */}

                <section className="tasks-section">

                    <div className="section-title">

                        <h3>Your Tasks</h3>

                        <p>
                            {totalTasks} task
                            {totalTasks !== 1 ? "s" : ""}
                        </p>

                    </div>


                    {tasks.length === 0 ? (

                        <div className="empty-state">
                            <h3>No tasks yet</h3>

                            <p>
                                Create your first task above.
                            </p>
                        </div>

                    ) : (

                        <div className="task-list">

                            {tasks.map((item) => (

                                <div
                                    className="task-card"
                                    key={item.id}
                                >

                                    {editId === item.id ? (

                                        <div className="edit-area">

                                            <input
                                                type="text"
                                                value={editTask}
                                                onChange={(e) =>
                                                    setEditTask(
                                                        e.target.value
                                                    )
                                                }
                                            />


                                            <select
                                                value={editPriority}
                                                onChange={(e) =>
                                                    setEditPriority(
                                                        e.target.value
                                                    )
                                                }
                                            >

                                                <option value="low">
                                                    Low Priority
                                                </option>

                                                <option value="medium">
                                                    Medium Priority
                                                </option>

                                                <option value="high">
                                                    High Priority
                                                </option>

                                            </select>


                                            <input
                                                type="date"
                                                value={editDeadline}
                                                onChange={(e) =>
                                                    setEditDeadline(
                                                        e.target.value
                                                    )
                                                }
                                            />


                                            <div className="edit-actions">

                                                <button
                                                    className="save-btn"
                                                    onClick={() =>
                                                        handleUpdateTask(
                                                            item.id
                                                        )
                                                    }
                                                >
                                                    Save
                                                </button>

                                                <button
                                                    className="cancel-btn"
                                                    onClick={() =>
                                                        setEditId(null)
                                                    }
                                                >
                                                    Cancel
                                                </button>

                                            </div>

                                        </div>

                                    ) : (

                                        <>

                                            <div className="task-main">

                                                <h4>
                                                    {item.title}
                                                </h4>


                                                <div className="task-meta">

                                                    <span
                                                        className={`priority ${item.priority || "medium"}`}
                                                    >
                                                        {(
                                                            item.priority ||
                                                            "medium"
                                                        ).toUpperCase()}
                                                    </span>


                                                    <span className="deadline">

                                                        {item.deadline
                                                            ? `Due ${formatDeadline(
                                                                  item.deadline
                                                              )}`
                                                            : "No deadline"}

                                                    </span>

                                                </div>

                                            </div>


                                            <div className="task-actions">

                                                <select
                                                    value={
                                                        item.status ||
                                                        "pending"
                                                    }
                                                    onChange={(e) =>
                                                        handleStatusChange(
                                                            item.id,
                                                            e.target.value
                                                        )
                                                    }
                                                >

                                                    <option value="pending">
                                                        Pending
                                                    </option>

                                                    <option value="completed">
                                                        Completed
                                                    </option>

                                                </select>


                                                <button
                                                    className="edit-btn"
                                                    onClick={() =>
                                                        startEdit(item)
                                                    }
                                                >
                                                    Edit
                                                </button>


                                                <button
                                                    className="delete-btn"
                                                    onClick={() =>
                                                        handleDeleteTask(
                                                            item.id
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        </>

                                    )}

                                </div>

                            ))}

                        </div>

                    )}

                </section>

            </main>

        </div>
    );
}

export default App;
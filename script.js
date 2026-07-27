const toast = document.getElementById("toast");
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const taskCount = document.getElementById("taskCount");
const searchInput = document.getElementById("searchInput");
const prioritySelect = document.getElementById("prioritySelect");
const dateInput = document.getElementById("dateInput");
const filterButtons = document.querySelectorAll(".filter-btn");
const themeBtn = document.getElementById("themeBtn");
const sortSelect = document.getElementById("sortSelect");
const progressText = document.getElementById("progressText");
const remainingTasks = document.getElementById("remainingTasks");
const progressFill = document.getElementById("progressFill");
const totalTasksStat = document.getElementById("totalTasks");
const completedTasksStat = document.getElementById("completedTasks");
const pendingTasksStat = document.getElementById("pendingTasks");
const editModal = document.getElementById("editModal");
const editInput = document.getElementById("editInput");
const saveEditBtn = document.getElementById("saveEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const deleteModal = document.getElementById("deleteModal");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

const priorityOrder = { High: 3, Medium: 2, Low: 1 };
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";
let searchText = "";
let sortBy = "newest";
let editingTaskId = null;
let deletingTaskId = null;

function init() {
    addBtn.addEventListener("click", addTask);
    taskInput.addEventListener("keypress", event => {
        if (event.key === "Enter") {
            addTask();
        }
    });

    searchInput.addEventListener("input", () => {
        searchText = searchInput.value.toLowerCase();
        renderTasks();
    });

    sortSelect.addEventListener("change", () => {
        sortBy = sortSelect.value;
        renderTasks();
    });

    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            filterButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
            currentFilter = button.textContent.toLowerCase();
            renderTasks();
        });
    });

    saveEditBtn.addEventListener("click", saveEditedTask);
    cancelEditBtn.addEventListener("click", closeEditModal);
    confirmDeleteBtn.addEventListener("click", confirmDeleteTask);
    cancelDeleteBtn.addEventListener("click", cancelDeleteTask);

    editModal.addEventListener("click", event => {
        if (event.target === editModal) {
            closeEditModal();
        }
    });

    deleteModal.addEventListener("click", event => {
        if (event.target === deleteModal) {
            cancelDeleteTask();
        }
    });

    loadTheme();
    renderTasks();
}

function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === "") {
        showToast("Please enter a task!");
        return;
    }

    const newTask = {
        id: Date.now(),
        text: taskText,
        completed: false,
        priority: prioritySelect.value,
        date: dateInput.value
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    showToast("Task added successfully!");
    taskInput.value = "";
    dateInput.value = "";
}

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
    taskList.innerHTML = "";
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.text.toLowerCase().includes(searchText);
        const matchesFilter =
            currentFilter === "all" ||
            (currentFilter === "active" && !task.completed) ||
            (currentFilter === "completed" && task.completed);
        return matchesSearch && matchesFilter;
    });

    const sortedTasks = filteredTasks.slice().sort((a, b) => {
        if (sortBy === "newest") {
            return b.id - a.id;
        }
        if (sortBy === "oldest") {
            return a.id - b.id;
        }
        if (sortBy === "priority") {
            const diff = priorityOrder[b.priority] - priorityOrder[a.priority];
            return diff !== 0 ? diff : a.id - b.id;
        }
        if (sortBy === "date") {
            if (a.date && b.date) return new Date(a.date) - new Date(b.date);
            if (a.date) return -1;
            if (b.date) return 1;
            return a.id - b.id;
        }
        return b.id - a.id;
    });

    if (sortedTasks.length === 0) {
        taskList.appendChild(emptyState);
        emptyState.style.display = "block";
    } else {
        emptyState.style.display = "none";
        sortedTasks.forEach(task => {
            const taskItem = document.createElement("div");
            taskItem.classList.add("task-item");
            if (task.completed) {
                taskItem.classList.add("completed");
            }

            taskItem.innerHTML = `
                <div class="task-details">
                    <input type="checkbox" class="task-check" ${task.completed ? "checked" : ""}>
                    <div>
                        <h3 class="task-title">${task.text}</h3>
                        <p class="task-info">📅 ${task.date || "No due date"}</p>
                        <span class="priority-badge ${task.priority.toLowerCase()}">${task.priority}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="edit-btn" type="button">✏️</button>
                    <button class="delete-btn" type="button">🗑️</button>
                </div>
            `;

            const checkbox = taskItem.querySelector(".task-check");
            checkbox.addEventListener("change", () => {
                task.completed = checkbox.checked;
                saveTasks();
                renderTasks();
                showToast(task.completed ? "Task completed!" : "Task marked active!");
            });

            const deleteBtn = taskItem.querySelector(".delete-btn");
            deleteBtn.addEventListener("click", () => {
                deletingTaskId = task.id;
                deleteModal.style.display = "flex";
            });

            const editBtn = taskItem.querySelector(".edit-btn");
            editBtn.addEventListener("click", () => {
                editingTaskId = task.id;
                editInput.value = task.text;
                editModal.style.display = "flex";
            });

            taskList.appendChild(taskItem);
        });
    }

    updateCount();
}

function updateCount() {
    const completed = tasks.filter(task => task.completed).length;
    const pending = tasks.length - completed;
    const percentComplete = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

    taskCount.textContent = `Total: ${tasks.length} | Completed: ${completed}`;
    totalTasksStat.textContent = tasks.length;
    completedTasksStat.textContent = completed;
    pendingTasksStat.textContent = pending;
    progressText.textContent = `${percentComplete}% Completed`;
    remainingTasks.textContent = `${pending} Remaining`;
    progressFill.style.width = `${percentComplete}%`;
}

function saveEditedTask() {
    const updatedText = editInput.value.trim();
    if (updatedText === "") {
        showToast("Please enter a task description.");
        return;
    }
    const task = tasks.find(item => item.id === editingTaskId);
    if (!task) return;
    task.text = updatedText;
    saveTasks();
    renderTasks();
    closeEditModal();
    showToast("Task updated!");
}

function closeEditModal() {
    editingTaskId = null;
    editModal.style.display = "none";
}

function confirmDeleteTask() {
    if (deletingTaskId === null) return;
    tasks = tasks.filter(item => item.id !== deletingTaskId);
    saveTasks();
    renderTasks();
    deleteModal.style.display = "none";
    deletingTaskId = null;
    showToast("Task deleted!");
}

function cancelDeleteTask() {
    deletingTaskId = null;
    deleteModal.style.display = "none";
}

function toggleTheme() {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    themeBtn.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

function loadTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        themeBtn.textContent = "☀️ Light Mode";
    } else {
        document.body.classList.remove("dark-mode");
        themeBtn.textContent = "🌙 Dark Mode";
    }
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}

window.addEventListener("DOMContentLoaded", init);
window.addTask = addTask;
window.renderTasks = renderTasks;

const STORAGE_KEY = "todo-bot.tasks.v1";
const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const list = document.querySelector("#task-list");
const count = document.querySelector("#task-count");
const emptyState = document.querySelector("#empty-state");
const storageMessage = document.querySelector("#storage-message");
const clearCompleted = document.querySelector("#clear-completed");
const filterButtons = [...document.querySelectorAll("[data-filter]")];

let tasks = readTasks();
let activeFilter = "all";

function readTasks() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter(
      (task) =>
        task &&
        typeof task.id === "string" &&
        typeof task.title === "string" &&
        typeof task.completed === "boolean",
    );
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    storageMessage.textContent = "";
  } catch {
    storageMessage.textContent = "Could not save tasks on this device. Check available storage.";
  }
}

function makeTaskRow(task) {
  const row = document.createElement("li");
  row.className = `task-item${task.completed ? " is-complete" : ""}`;

  const check = document.createElement("button");
  check.className = "task-check";
  check.type = "button";
  check.setAttribute("aria-label", task.completed ? `Mark ${task.title} as to do` : `Complete ${task.title}`);
  check.setAttribute("aria-pressed", String(task.completed));
  check.addEventListener("click", () => {
    task.completed = !task.completed;
    saveTasks();
    render();
  });

  const content = document.createElement("div");
  content.className = "task-content";
  const title = document.createElement("div");
  title.className = "task-title";
  title.textContent = task.title;
  content.append(title);

  const remove = document.createElement("button");
  remove.className = "task-action";
  remove.type = "button";
  remove.textContent = "×";
  remove.setAttribute("aria-label", `Delete ${task.title}`);
  remove.addEventListener("click", () => {
    tasks = tasks.filter((item) => item.id !== task.id);
    saveTasks();
    render();
  });

  row.append(check, content, remove);
  return row;
}

function render() {
  const visibleTasks = tasks.filter((task) => {
    if (activeFilter === "active") return !task.completed;
    if (activeFilter === "completed") return task.completed;
    return true;
  });

  list.replaceChildren(...visibleTasks.map(makeTaskRow));
  emptyState.hidden = visibleTasks.length > 0;
  if (visibleTasks.length === 0) {
    const title = emptyState.querySelector(".empty-title");
    const copy = emptyState.querySelector(".empty-copy");
    if (tasks.length > 0 && activeFilter === "active") {
      title.textContent = "All caught up.";
      copy.textContent = "Switch to Done to revisit completed tasks.";
    } else if (tasks.length > 0 && activeFilter === "completed") {
      title.textContent = "Nothing completed yet.";
      copy.textContent = "Finish a task and it will show up here.";
    } else {
      title.textContent = "A fresh start.";
      copy.textContent = "Add a task above and take it one step at a time.";
    }
  }
  count.textContent = `${tasks.filter((task) => !task.completed).length} left`;
  clearCompleted.hidden = !tasks.some((task) => task.completed);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) {
    input.focus();
    return;
  }
  tasks.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title,
    completed: false,
  });
  saveTasks();
  form.reset();
  input.focus();
  render();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    render();
  });
});

clearCompleted.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  render();
});

if ("serviceWorker" in navigator && ["http:", "https:"].includes(location.protocol)) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}

render();

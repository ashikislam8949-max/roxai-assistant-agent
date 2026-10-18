const TASKS_KEY = "todo-bot.tasks.v1";
const CUSTOMERS_KEY = "todo-bot.customers.v1";
const AGE_KEY = "todo-bot.adult-confirmed.v1";
const LANGUAGE_KEY = "todo-bot.voice-language.v1";
const GITHUB_REPO_KEY = "todo-bot.github-repository.v1";
const GITHUB_REFRESH_INTERVAL = 15 * 60 * 1000;
const languages = {
  "en-SA": { speech: "en-SA", saved: (title) => `Task added: ${title}` },
  "bn-BD": { speech: "bn-BD", saved: (title) => `কাজ যোগ করা হয়েছে: ${title}` },
  "ar-SA": { speech: "ar-SA", saved: (title) => `تمت إضافة المهمة: ${title}` },
};

const ageGate = document.querySelector("#age-gate");
const ageBlocked = document.querySelector("#age-blocked");
const appShell = document.querySelector("#app-shell");
const birthDate = document.querySelector("#birth-date");
const ageError = document.querySelector("#age-error");
const verifyAge = document.querySelector("#verify-age");
const resetAge = document.querySelector("#reset-age");
const clearAllData = document.querySelector("#clear-all-data");
const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskDueDate = document.querySelector("#task-due-date");
const taskGitHubUrl = document.querySelector("#task-github-url");
const taskList = document.querySelector("#task-list");
const taskCount = document.querySelector("#task-count");
const emptyState = document.querySelector("#empty-state");
const storageMessage = document.querySelector("#storage-message");
const clearCompleted = document.querySelector("#clear-completed");
const filterButtons = [...document.querySelectorAll("[data-filter]")];
const viewButtons = [...document.querySelectorAll("[data-view]")];
const voiceLanguage = document.querySelector("#voice-language");
const voiceStatus = document.querySelector("#voice-status");
const voiceConfirm = document.querySelector("#voice-confirm");
const voiceTranscript = document.querySelector("#voice-transcript");
const voiceUseText = document.querySelector("#voice-use-text");
const voiceCancel = document.querySelector("#voice-cancel");
const appConfirm = document.querySelector("#app-confirm");
const appConfirmTitle = document.querySelector("#app-confirm-title");
const appConfirmCopy = document.querySelector("#app-confirm-copy");
const appConfirmAccept = document.querySelector("#app-confirm-accept");
const appConfirmCancel = document.querySelector("#app-confirm-cancel");
const customerForm = document.querySelector("#customer-form");
const customerList = document.querySelector("#customer-list");
const customerEmpty = document.querySelector("#customer-empty");
const customerSummary = document.querySelector("#customer-summary");
const customerError = document.querySelector("#customer-error");
const githubRepoForm = document.querySelector("#github-repo-form");
const githubRepoInput = document.querySelector("#github-repo");
const githubMessage = document.querySelector("#github-message");
const githubRefresh = document.querySelector("#github-refresh");
const githubTaskList = document.querySelector("#github-task-list");
const githubEmpty = document.querySelector("#github-empty");

function isValidDate(value) {
  if (value === "") return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && localDateString(date) === value;
}

function parseGitHubRef(value) {
  if (typeof value !== "string" || value.length > 500) return null;
  try {
    const url = new URL(value);
    const match = url.pathname.match(/^\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/(issues|pull)\/(\d+)\/?$/);
    if (
      url.protocol !== "https:" ||
      url.hostname.toLowerCase() !== "github.com" ||
      url.port ||
      url.username ||
      url.password ||
      !match ||
      match[1] === "." ||
      match[1] === ".." ||
      match[2] === "." ||
      match[2] === ".."
    ) return null;
    const number = Number(match[4]);
    if (!Number.isSafeInteger(number) || number < 1) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/i, ""), kind: match[3], number };
  } catch {
    return null;
  }
}

function normalizeGitHubRepository(value) {
  if (typeof value !== "string") return "";
  const repository = value.trim().replace(/\.git$/i, "");
  const [owner, repo, ...extra] = repository.split("/");
  if (
    extra.length ||
    !owner ||
    !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(owner) ||
    !repo ||
    !/^[A-Za-z0-9_.-]+$/.test(repo) ||
    repo === "." ||
    repo === ".."
  ) return "";
  return `${owner}/${repo}`;
}

function isTaskRecord(record) {
  return record &&
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.completed === "boolean" &&
    (record.dueDate === undefined || isValidDate(record.dueDate)) &&
    (record.githubUrl === undefined || record.githubUrl === "" || parseGitHubRef(record.githubUrl) !== null);
}

function isCustomerRecord(record) {
  return record &&
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.phone === "string" &&
    isValidDate(record.dueDate) &&
    record.dueDate !== "" &&
    typeof record.amount === "number" &&
    Number.isFinite(record.amount) &&
    record.amount >= 0 &&
    ["none", "call", "sms", "whatsapp"].includes(record.channel) &&
    typeof record.consent === "boolean" &&
    ["due", "paid"].includes(record.status);
}

let tasks = readRecords(TASKS_KEY, isTaskRecord).map((task) => ({ ...task, dueDate: task.dueDate ?? "" }));
let customers = readRecords(CUSTOMERS_KEY, isCustomerRecord);
let activeFilter = "all";
let pendingVoice = null;
let voiceTarget = null;
let voiceButton = null;
let githubStatusByTask = new Map();
let githubRepository = "";

try {
  const savedRepository = localStorage.getItem(GITHUB_REPO_KEY) ?? "";
  githubRepository = normalizeGitHubRepository(savedRepository);
} catch {
  githubRepository = "";
}
githubRepoInput.value = githubRepository;

function readRecords(key, isValid) {
  try {
    const records = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(records) ? records.filter(isValid) : [];
  } catch {
    return [];
  }
}

function saveRecords(key, records, errorTarget) {
  try {
    localStorage.setItem(key, JSON.stringify(records));
    errorTarget.textContent = "";
    return true;
  } catch {
    errorTarget.textContent = "Could not save on this device. Check available storage.";
    return false;
  }
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" })
    .format(new Date(year, month - 1, day));
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setView(viewName) {
  document.querySelectorAll(".view-panel").forEach((panel) => {
    panel.hidden = panel.id !== `view-${viewName}`;
  });
  viewButtons.forEach((button) => {
    const selected = button.dataset.view === viewName;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  if (viewName === "github") refreshGitHubStatus();
}

function makeAction(label, text, handler, className = "secondary-button") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", handler);
  return button;
}

function editTask(task) {
  taskForm.elements.task.value = task.title;
  taskForm.elements.dueDate.value = task.dueDate;
  taskForm.elements.githubUrl.value = task.githubUrl ?? "";
  taskForm.dataset.editId = task.id;
  taskForm.scrollIntoView({ behavior: "smooth", block: "center" });
  taskInput.focus();
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
    if (saveRecords(TASKS_KEY, tasks, storageMessage)) {
      renderTasks();
      renderGitHubTasks();
    }
  });

  const content = document.createElement("div");
  content.className = "task-content";
  const title = document.createElement("div");
  title.className = "task-title";
  title.textContent = task.title;
  content.append(title);
  if (task.dueDate) {
    const due = document.createElement("time");
    due.className = `task-date${!task.completed && task.dueDate < localDateString() ? " is-overdue" : ""}`;
    due.dateTime = task.dueDate;
    due.textContent = `Due ${formatDate(task.dueDate)}`;
    content.append(due);
  }
  if (task.githubUrl) {
    const status = githubStatusByTask.get(task.id);
    const githubLine = document.createElement("span");
    githubLine.className = "github-task-status";
    githubLine.textContent = status?.summary ?? "GitHub status not refreshed";
    content.append(githubLine);
  }

  const actions = document.createElement("div");
  actions.className = "row-actions";
  if (githubRepository) {
    const draft = document.createElement("a");
    draft.className = "secondary-button";
    draft.textContent = "Draft Issue";
    draft.href = makeIssueDraftUrl(githubRepository, task);
    actions.append(draft);
  }
  actions.append(
    makeAction(`Edit ${task.title}`, "Edit", () => editTask(task)),
    makeAction(`Delete ${task.title}`, "×", () => {
      tasks = tasks.filter((item) => item.id !== task.id);
      githubStatusByTask.delete(task.id);
      if (saveRecords(TASKS_KEY, tasks, storageMessage)) {
        renderTasks();
        renderGitHubTasks();
      }
    }, "task-action"),
  );
  row.append(check, content, actions);
  return row;
}

function renderTasks() {
  const visibleTasks = tasks.filter((task) => {
    if (activeFilter === "active") return !task.completed;
    if (activeFilter === "completed") return task.completed;
    return true;
  });
  taskList.replaceChildren(...visibleTasks.map(makeTaskRow));
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
  taskCount.textContent = `${tasks.filter((task) => !task.completed).length} left`;
  clearCompleted.hidden = !tasks.some((task) => task.completed);
  renderGitHubTasks();
}

function makeIssueDraftUrl(repository, task) {
  const [owner, repo] = repository.split("/");
  const url = new URL(`https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/new`);
  url.searchParams.set("title", task.title);
  const details = [
    "Created from a ToDO BoT task.",
    task.dueDate ? `Due date: ${task.dueDate}` : "",
    "",
    "Please review and submit this Issue on GitHub.",
  ].filter(Boolean);
  url.searchParams.set("body", details.join("\n"));
  return url.toString();
}

async function fetchGitHubStatus(task) {
  const reference = parseGitHubRef(task.githubUrl);
  if (!reference) return { summary: "Invalid GitHub Issue/PR URL" };
  const kind = reference.kind === "pull" ? "pulls" : "issues";
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(reference.owner)}/${encodeURIComponent(reference.repo)}/${kind}/${reference.number}`;
  try {
    const response = await fetch(apiUrl, {
      headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
      cache: "no-store",
    });
    if (response.status === 403 || response.status === 429) {
      return { summary: "GitHub public API rate limit reached" };
    }
    if (response.status === 404) {
      return { summary: "Not found or private repository (public repositories only)" };
    }
    if (!response.ok) return { summary: `GitHub status unavailable (HTTP ${response.status})` };
    const data = await response.json();
    const checkedAt = new Date().toISOString();
    let state = data.state === "closed" ? "Closed" : "Open";
    let title = typeof data.title === "string" ? data.title.slice(0, 200) : "";
    if (reference.kind === "pull") {
      state = data.merged ? "Merged" : data.state === "closed" ? "Closed" : "Open";
    } else if (data.pull_request) {
      const pullResponse = await fetch(apiUrl.replace("/issues/", "/pulls/"), {
        headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
        cache: "no-store",
      });
      if (pullResponse.ok) {
        const pull = await pullResponse.json();
        state = pull.merged ? "Merged" : pull.state === "closed" ? "Closed" : "Open";
      }
    }
    return {
      summary: `${reference.kind === "pull" || data.pull_request ? "Pull request" : "Issue"} #${reference.number} · ${state}${title ? ` · ${title}` : ""}`,
      checkedAt,
      state,
      title,
    };
  } catch {
    return { summary: "Could not reach GitHub. Check your connection and retry." };
  }
}

function renderGitHubTasks() {
  const linkedTasks = tasks.filter((task) => task.githubUrl);
  githubTaskList.replaceChildren();
  githubEmpty.hidden = linkedTasks.length > 0;
  for (const task of linkedTasks) {
    const row = document.createElement("li");
    row.className = "github-item";
    const details = document.createElement("div");
    details.className = "github-info";
    const taskTitle = document.createElement("strong");
    taskTitle.textContent = task.title;
    const status = document.createElement("span");
    const githubState = githubStatusByTask.get(task.id);
    status.textContent = githubState?.summary ?? "Not refreshed yet";
    const linkedUrl = document.createElement("a");
    linkedUrl.href = task.githubUrl;
    linkedUrl.textContent = "Open linked work on GitHub ↗";
    details.append(taskTitle, status, linkedUrl);
    row.append(details, makeAction(
      `Refresh GitHub status for ${task.title}`,
      "Refresh",
      () => refreshGitHubStatus([task], true),
    ));
    githubTaskList.append(row);
  }
}

async function refreshGitHubStatus(items = tasks.filter((task) => task.githubUrl), force = false) {
  const now = Date.now();
  const stale = items.filter((task) => {
    const cached = githubStatusByTask.get(task.id);
    return force || !cached?.checkedAt || now - Date.parse(cached.checkedAt) >= GITHUB_REFRESH_INTERVAL;
  });
  if (stale.length === 0) {
    githubMessage.textContent = "Public GitHub status is up to date.";
    return;
  }
  githubMessage.textContent = "Refreshing public GitHub status…";
  for (const task of stale.slice(0, 20)) {
    githubStatusByTask.set(task.id, await fetchGitHubStatus(task));
    renderGitHubTasks();
    renderTasks();
  }
  if (event.key === GITHUB_REPO_KEY) {
    githubRepository = normalizeGitHubRepository(event.newValue ?? "");
    githubRepoInput.value = githubRepository;
    renderTasks();
  }
  if (stale.length > 20) {
    githubMessage.textContent = "Refreshed 20 linked items. Refresh again for remaining items.";
  } else {
    githubMessage.textContent = "Public GitHub status updated.";
  }
}

function normalizePhone(value) {
  return value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
}

function whatsappNumber(value) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `966${digits.slice(1)}`;
  return digits.length >= 8 && digits.length <= 15 ? digits : "";
}

function contactUrl(customer) {
  const phone = normalizePhone(customer.phone);
  const digitCount = phone.replace(/\D/g, "").length;
  if (!phone || digitCount < 7 || digitCount > 15 || !customer.consent || customer.channel === "none") return "";
  if (customer.channel === "call") return `tel:${phone}`;
  if (customer.channel === "sms") {
    const message = `Hello ${customer.name}, a friendly reminder about your due on ${formatDate(customer.dueDate)}.`;
    return `sms:${phone}?body=${encodeURIComponent(message)}`;
  }
  if (customer.channel === "whatsapp") {
    const number = whatsappNumber(phone);
    if (!number) return "";
    const amount = customer.amount > 0 ? ` SAR ${customer.amount.toFixed(2)}` : "";
    const message = `Hello ${customer.name}, a friendly reminder about your${amount} due on ${formatDate(customer.dueDate)}.`;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }
  return "";
}

function makeCustomerRow(customer) {
  const row = document.createElement("li");
  const overdue = customer.status !== "paid" && customer.dueDate < localDateString();
  row.className = `customer-item${overdue ? " is-overdue" : ""}${customer.status === "paid" ? " is-paid" : ""}`;

  const info = document.createElement("div");
  info.className = "customer-info";
  const name = document.createElement("strong");
  name.textContent = customer.name;
  const detail = document.createElement("span");
  const amount = customer.amount > 0
    ? new Intl.NumberFormat(undefined, { style: "currency", currency: "SAR" }).format(customer.amount)
    : "Amount not set";
  detail.textContent = `${amount} · Due ${formatDate(customer.dueDate)} · ${customer.status === "paid" ? "Paid" : overdue ? "Overdue" : "Due"}`;
  info.append(name, detail);

  const actions = document.createElement("div");
  actions.className = "row-actions customer-actions";
  const url = contactUrl(customer);
  if (url) {
    const contact = document.createElement("a");
    contact.className = "secondary-button";
    contact.textContent = customer.channel === "call" ? "Call" : customer.channel === "sms" ? "Open SMS" : "Open WhatsApp";
    contact.href = url;
    actions.append(contact);
  }
  if (customer.status !== "paid") {
    actions.append(makeAction(`Mark ${customer.name} as paid`, "Mark paid", () => {
      customer.status = "paid";
      if (saveRecords(CUSTOMERS_KEY, customers, customerError)) renderCustomers();
    }));
  }
  actions.append(
    makeAction(`Edit ${customer.name}`, "Edit", () => editCustomer(customer)),
    makeAction(`Delete ${customer.name}`, "×", () => {
      customers = customers.filter((item) => item.id !== customer.id);
      if (saveRecords(CUSTOMERS_KEY, customers, customerError)) renderCustomers();
    }, "task-action"),
  );
  row.append(info, actions);
  return row;
}

function renderCustomers() {
  const sorted = [...customers].sort((a, b) =>
    Number(a.status === "paid") - Number(b.status === "paid") || a.dueDate.localeCompare(b.dueDate),
  );
  customerList.replaceChildren(...sorted.map(makeCustomerRow));
  customerEmpty.hidden = customers.length > 0;
  const open = customers.filter((customer) => customer.status !== "paid");
  const overdueCount = open.filter((customer) => customer.dueDate < localDateString()).length;
  const totalDue = open.reduce((total, customer) => total + customer.amount, 0);
  customerSummary.textContent = `${open.length} open · ${overdueCount} overdue · ${new Intl.NumberFormat(undefined, { style: "currency", currency: "SAR" }).format(totalDue)}`;
}

function editCustomer(customer) {
  customerForm.elements.name.value = customer.name;
  customerForm.elements.phone.value = customer.phone;
  customerForm.elements.amount.value = customer.amount || "";
  customerForm.elements.dueDate.value = customer.dueDate;
  customerForm.elements.channel.value = customer.channel;
  customerForm.elements.consent.checked = customer.consent;
  customerForm.dataset.editId = customer.id;
  customerForm.scrollIntoView({ behavior: "smooth", block: "center" });
  customerForm.elements.name.focus();
}

function askToConfirm(title, copy, action) {
  appConfirmTitle.textContent = title;
  appConfirmCopy.textContent = copy;
  appConfirm.showModal();
  appConfirmAccept.onclick = () => {
    appConfirm.close();
    action();
  };
}

function speakSavedTask(title) {
  const selected = languages[voiceLanguage.value] ?? languages["en-SA"];
  const message = selected.saved(title);
  if (window.AndroidVoice) {
    window.AndroidVoice.speak(message, selected.speech);
    return;
  }
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = selected.speech;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function startVoiceCapture(button, target) {
  voiceTarget = target;
  voiceButton = button;
  if (window.AndroidVoice) {
    button.disabled = true;
    voiceStatus.textContent = "Listening…";
    window.AndroidVoice.startListening(languages[voiceLanguage.value]?.speech ?? "en-SA");
    return;
  }
  const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!Recognition) {
    voiceStatus.textContent = "Voice input is not available in this browser. Type the text instead.";
    return;
  }
  const recognition = new Recognition();
  recognition.lang = languages[voiceLanguage.value]?.speech ?? "en-SA";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  button.disabled = true;
  voiceStatus.textContent = "Listening…";
  recognition.onresult = (event) => {
    const text = event.results?.[0]?.[0]?.transcript?.trim();
    handleVoiceTranscript(text ?? "");
  };
  recognition.onerror = (event) => {
    voiceStatus.textContent = event.error === "not-allowed"
      ? "Microphone permission was denied. You can type instead."
      : "Voice input ended without a result. Try again or type instead.";
  };
  recognition.onend = () => { button.disabled = false; };
  try {
    recognition.start();
  } catch {
    button.disabled = false;
    voiceStatus.textContent = "Could not start voice input. Try again or type instead.";
  }
}

window.todoBotVoiceResult = (result) => {
  if (voiceButton) voiceButton.disabled = false;
  if (result.status === "result" && result.text) {
    handleVoiceTranscript(result.text);
  } else {
    voiceStatus.textContent = result.message ?? "Voice input did not return a result. Type the text instead.";
  }
};

function handleVoiceTranscript(text) {
  const recognized = text.trim();
  if (!recognized) {
    voiceStatus.textContent = "No speech was recognized. Try again or type the text.";
    return;
  }
  if (!voiceTarget) return;
  pendingVoice = { text: recognized, target: voiceTarget };
  voiceTranscript.textContent = recognized;
  voiceConfirm.showModal();
  voiceStatus.textContent = "Review the recognized words before using them.";
}

function isAdult(birthValue) {
  if (!birthValue) return false;
  const date = new Date(`${birthValue}T00:00:00`);
  if (Number.isNaN(date.getTime()) || date > new Date()) return false;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  if (
    today.getMonth() < date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())
  ) age--;
  return age >= 18;
}

function openApp() {
  ageGate.hidden = true;
  ageBlocked.hidden = true;
  appShell.hidden = false;
  renderTasks();
  renderCustomers();
}

function initializeAgeGate() {
  try {
    if (localStorage.getItem(AGE_KEY) === "true") {
      openApp();
      return;
    }
  } catch {
    ageError.textContent = "Age confirmation needs browser storage. Enable storage to continue.";
  }
  ageGate.hidden = false;
}

verifyAge.addEventListener("click", () => {
  ageError.textContent = "";
  if (!isAdult(birthDate.value)) {
    ageGate.hidden = true;
    ageBlocked.hidden = false;
    return;
  }
  try {
    localStorage.setItem(AGE_KEY, "true");
  } catch {
    ageError.textContent = "Could not save this confirmation on your device.";
    return;
  }
  openApp();
});

resetAge.addEventListener("click", () => {
  try {
    localStorage.removeItem(AGE_KEY);
  } catch {
    ageError.textContent = "Could not clear the age confirmation from this device.";
    return;
  }
  appShell.hidden = true;
  ageBlocked.hidden = true;
  ageGate.hidden = false;
  birthDate.value = "";
  birthDate.focus();
});

clearAllData.addEventListener("click", () => {
  askToConfirm(
    "Erase all local records?",
    "This permanently clears tasks and customer dues from this device. This cannot be undone.",
    () => {
      tasks = [];
      customers = [];
      saveRecords(TASKS_KEY, tasks, storageMessage);
      saveRecords(CUSTOMERS_KEY, customers, customerError);
      customerForm.reset();
      taskForm.reset();
      delete taskForm.dataset.editId;
      delete customerForm.dataset.editId;
      renderTasks();
      renderCustomers();
    },
  );
});

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title) {
    taskInput.focus();
    return;
  }
  const githubUrl = taskGitHubUrl.value.trim();
  if (githubUrl && !parseGitHubRef(githubUrl)) {
    storageMessage.textContent = "Enter a valid GitHub Issue or Pull Request URL from github.com.";
    taskGitHubUrl.focus();
    return;
  }
  const editId = taskForm.dataset.editId;
  if (editId) {
    const task = tasks.find((item) => item.id === editId);
    if (task) {
      task.title = title;
      task.dueDate = taskDueDate.value;
      if (task.githubUrl !== githubUrl) githubStatusByTask.delete(task.id);
      task.githubUrl = githubUrl;
    }
    delete taskForm.dataset.editId;
  } else {
    tasks.unshift({ id: makeId(), title, dueDate: taskDueDate.value, githubUrl, completed: false });
  }
  if (!saveRecords(TASKS_KEY, tasks, storageMessage)) return;
  taskForm.reset();
  renderTasks();
  taskInput.focus();
  if (pendingVoice?.target === taskInput) {
    speakSavedTask(title);
    pendingVoice = null;
  }
});

githubRepoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const repository = normalizeGitHubRepository(githubRepoInput.value);
  if (!repository) {
    githubMessage.textContent = "Enter a GitHub repository as owner/repository.";
    githubRepoInput.focus();
    return;
  }
  try {
    localStorage.setItem(GITHUB_REPO_KEY, repository);
  } catch {
    githubMessage.textContent = "Could not save this repository on the device.";
    return;
  }
  githubRepository = repository;
  githubRepoInput.value = repository;
  githubMessage.textContent = `Draft Issues will use ${repository}.`;
  renderTasks();
});

githubRefresh.addEventListener("click", () => refreshGitHubStatus(undefined, true));

customerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  customerError.textContent = "";
  const formData = new FormData(customerForm);
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const channel = String(formData.get("channel") ?? "none");
  const amount = Number(formData.get("amount")) || 0;
  const consent = customerForm.elements.consent.checked;
  const phoneDigits = normalizePhone(phone).replace(/\D/g, "").length;
  if (channel !== "none" && (!phone || phoneDigits < 7 || phoneDigits > 15 || !consent)) {
    customerError.textContent = "Add a valid phone number and confirm you have permission before preparing a contact action.";
    return;
  }
  if (!Number.isFinite(amount) || amount < 0) {
    customerError.textContent = "Enter a valid, non-negative amount.";
    return;
  }
  const editId = customerForm.dataset.editId;
  const oldRecord = editId ? customers.find((item) => item.id === editId) : null;
  const record = {
    id: editId ?? makeId(),
    name: name.slice(0, 120),
    phone: phone.slice(0, 30),
    amount,
    dueDate: String(formData.get("dueDate")),
    channel,
    consent,
    status: oldRecord?.status ?? "due",
  };
  if (oldRecord) customers = customers.map((item) => item.id === editId ? record : item);
  else customers.unshift(record);
  if (!saveRecords(CUSTOMERS_KEY, customers, customerError)) return;
  customerForm.reset();
  delete customerForm.dataset.editId;
  renderCustomers();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    renderTasks();
  });
});

viewButtons.forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
clearCompleted.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.completed);
  if (saveRecords(TASKS_KEY, tasks, storageMessage)) renderTasks();
});
document.querySelector("#task-mic").addEventListener("click", (event) => startVoiceCapture(event.currentTarget, taskInput));
document.querySelector("#customer-mic").addEventListener("click", (event) => startVoiceCapture(event.currentTarget, customerForm.elements.name));
voiceCancel.addEventListener("click", () => voiceConfirm.close());
appConfirmCancel.addEventListener("click", () => appConfirm.close());
try {
  voiceLanguage.value = localStorage.getItem(LANGUAGE_KEY) ?? "en-SA";
} catch {
  voiceLanguage.value = "en-SA";
}
voiceLanguage.addEventListener("change", () => {
  try {
    localStorage.setItem(LANGUAGE_KEY, voiceLanguage.value);
  } catch {
    voiceStatus.textContent = "Could not save the language preference on this device.";
  }
});
voiceUseText.addEventListener("click", () => {
  if (!pendingVoice) return;
  pendingVoice.target.value = pendingVoice.text.slice(0, pendingVoice.target.maxLength || 160);
  pendingVoice.target.dispatchEvent(new Event("input", { bubbles: true }));
  pendingVoice.target.focus();
  pendingVoice = null;
  voiceConfirm.close();
});
voiceConfirm.addEventListener("close", () => { pendingVoice = null; });
window.addEventListener("storage", (event) => {
  if (event.key === TASKS_KEY) {
    tasks = readRecords(TASKS_KEY, isTaskRecord).map((task) => ({ ...task, dueDate: task.dueDate ?? "" }));
    renderTasks();
  }
  if (event.key === CUSTOMERS_KEY) {
    customers = readRecords(CUSTOMERS_KEY, isCustomerRecord);
    renderCustomers();
  }
});

if ("serviceWorker" in navigator && ["http:", "https:"].includes(location.protocol)) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}

window.addEventListener("online", () => {
  if (!document.querySelector("#view-github").hidden) refreshGitHubStatus(undefined, true);
});

initializeAgeGate();

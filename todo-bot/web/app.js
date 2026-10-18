const TASKS_KEY = "todo-bot.tasks.v1";
const CUSTOMERS_KEY = "todo-bot.customers.v1";
const AGE_KEY = "todo-bot.adult-confirmed.v1";
const LANGUAGE_KEY = "todo-bot.voice-language.v1";
const GITHUB_REPO_KEY = "todo-bot.github-repository.v1";
const GITHUB_REFRESH_INTERVAL = 15 * 60 * 1000;
const UI_LANGUAGE_KEY = "todo-bot.ui-language.v1";
const TEXT_SCALE_KEY = "todo-bot.text-scale.v1";
const REMINDER_PERMISSION_KEY = "todo-bot.reminders-enabled.v1";
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
const taskPriority = document.querySelector("#task-priority");
const taskCategory = document.querySelector("#task-category");
const taskRepeat = document.querySelector("#task-repeat");
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
const taskSearch = document.querySelector("#task-search");
const taskMonth = document.querySelector("#task-month");
const dueReminder = document.querySelector("#due-reminder");
const uiLanguage = document.querySelector("#ui-language");
const textScale = document.querySelector("#text-scale");
const enableReminders = document.querySelector("#enable-reminders");
const exportBackup = document.querySelector("#export-backup");
const exportCsv = document.querySelector("#export-csv");
const importBackup = document.querySelector("#import-backup");

function isValidDate(value) {
  if (value === "") return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && localDateString(date) === value;
}

function applyInterfaceLanguage(language) {
  const selected = interfaceText[language] ? language : "en";
  document.documentElement.lang = selected;
  document.documentElement.dir = selected === "ar" ? "rtl" : "ltr";
  document.documentElement.dataset.language = selected;
  const text = interfaceText[selected];
  const headline = document.querySelector("#page-title");
  const accent = document.createElement("span");
  accent.textContent = text.headlineAccent;
  headline.replaceChildren(document.createTextNode(`${text.headline}`), document.createElement("br"), accent);
  const translations = [
    [".app-nav [data-view=tasks]", text.navTasks],
    [".app-nav [data-view=customers]", text.navCustomers],
    [".app-nav [data-view=github]", text.navGitHub],
    [".app-nav [data-view=services]", text.navServices],
    [".app-nav [data-view=settings]", text.navSettings],
    [".intro .eyebrow", text.pageEyebrow],
    [".task-form button[type=submit] span:last-child", text.addTask],
    ["[data-filter=all]", text.all],
    ["[data-filter=active]", text.todo],
    ["[data-filter=completed]", text.done],
    ["#task-search", text.search],
    ["#view-customers h2", text.customerHeading],
    ["#view-services h2", text.servicesHeading],
    ["#view-settings h2", text.settingsHeading],
    ["#view-settings .settings-list .setting-item:nth-child(3) h3", text.backupHeading],
    ["#export-backup", text.exportBackup],
    ["#export-csv", text.exportCsv],
    ["#view-settings .import-button", text.importBackup],
    ["#enable-reminders", text.reminderButton],
    ["#clear-month", text.clearMonth],
  ];
  for (const [selector, value] of translations) {
    const element = document.querySelector(selector);
    if (!element) continue;
    if (element instanceof HTMLInputElement) element.placeholder = value;
    else element.textContent = value;
  }
  uiLanguage.value = selected;
}

function applyTextScale(value) {
  const scale = Math.min(140, Math.max(100, Number(value) || 100));
  document.documentElement.style.setProperty("--text-scale", String(scale / 100));
  textScale.value = String(scale);
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
    (record.priority === undefined || ["low", "normal", "high"].includes(record.priority)) &&
    (record.category === undefined || ["personal", "work", "errand", "other"].includes(record.category)) &&
    (record.repeat === undefined || ["none", "daily", "weekly", "monthly"].includes(record.repeat)) &&
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
    ["due", "paid"].includes(record.status) &&
    Array.isArray(record.payments ?? []) &&
    (record.payments ?? []).every((payment) =>
      payment && typeof payment.id === "string" && Number.isFinite(payment.amount) && payment.amount > 0 &&
      isValidDate(payment.date) && payment.date !== "",
    );
}

let tasks = readRecords(TASKS_KEY, isTaskRecord).map((task) => ({
  priority: "normal",
  category: "personal",
  repeat: "none",
  ...task,
  dueDate: task.dueDate ?? "",
}));
let customers = readRecords(CUSTOMERS_KEY, isCustomerRecord).map((customer) => ({
  ...customer,
  payments: customer.payments ?? [],
}));
let activeFilter = "all";
let pendingVoice = null;
let voiceTarget = null;
let voiceButton = null;
let githubStatusByTask = new Map();
let githubRepository = "";
let activeTaskMonth = "";
let dueNotificationShownFor = "";
const interfaceText = {
  en: {
    navTasks: "Tasks", navCustomers: "Customer dues", navGitHub: "GitHub", navServices: "Saudi services", navSettings: "Settings",
    pageEyebrow: "YOUR PERSONAL TASK SPACE", headline: "Make room for", headlineAccent: "what matters.",
    addTask: "Add task", all: "All", todo: "To do", done: "Done", search: "Search tasks",
    customerHeading: "Keep every due date in view.", servicesHeading: "Start with the official service.",
    settingsHeading: "Your data and adult settings.", backupHeading: "Local backup & reports",
    exportBackup: "Export backup", exportCsv: "Export CSV report", importBackup: "Import backup",
    reminderButton: "Enable notifications", clearMonth: "Clear date filter",
  },
  bn: {
    navTasks: "কাজ", navCustomers: "গ্রাহকের বকেয়া", navGitHub: "গিটহাব", navServices: "সৌদি সেবা", navSettings: "সেটিংস",
    pageEyebrow: "আপনার ব্যক্তিগত কাজের তালিকা", headline: "গুরুত্বপূর্ণ কাজের", headlineAccent: "জন্য সময় রাখুন।",
    addTask: "কাজ যোগ করুন", all: "সব", todo: "বাকি", done: "সম্পন্ন", search: "কাজ খুঁজুন",
    customerHeading: "সব বকেয়ার তারিখ দেখুন।", servicesHeading: "সরকারি সেবার পোর্টাল দেখুন।",
    settingsHeading: "আপনার তথ্য ও সেটিংস।", backupHeading: "স্থানীয় ব্যাকআপ ও রিপোর্ট",
    exportBackup: "ব্যাকআপ ডাউনলোড", exportCsv: "CSV রিপোর্ট ডাউনলোড", importBackup: "ব্যাকআপ আনুন",
    reminderButton: "নোটিফিকেশন চালু করুন", clearMonth: "তারিখ ফিল্টার মুছুন",
  },
  ar: {
    navTasks: "المهام", navCustomers: "مستحقات العملاء", navGitHub: "GitHub", navServices: "الخدمات السعودية", navSettings: "الإعدادات",
    pageEyebrow: "مساحة مهامك الشخصية", headline: "اترك مساحة", headlineAccent: "لما يهمك.",
    addTask: "إضافة مهمة", all: "الكل", todo: "قيد التنفيذ", done: "مكتمل", search: "البحث في المهام",
    customerHeading: "تابع جميع تواريخ الاستحقاق.", servicesHeading: "ابدأ من البوابة الرسمية.",
    settingsHeading: "بياناتك وإعداداتك.", backupHeading: "نسخة احتياطية وتقارير محلية",
    exportBackup: "تصدير نسخة احتياطية", exportCsv: "تصدير تقرير CSV", importBackup: "استيراد نسخة احتياطية",
    reminderButton: "تفعيل الإشعارات", clearMonth: "مسح تصفية التاريخ",
  },
};

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

function applyStoredPreferences() {
  let language = "en";
  let scale = 100;
  try {
    language = localStorage.getItem(UI_LANGUAGE_KEY) ?? "en";
    scale = Number(localStorage.getItem(TEXT_SCALE_KEY)) || 100;
  } catch {
    // Preferences remain usable for this session when storage is unavailable.
  }
  applyInterfaceLanguage(language);
  applyTextScale(scale);
}

function amountPaid(customer) {
  return (customer.payments ?? []).reduce((total, payment) => total + payment.amount, 0);
}

function amountRemaining(customer) {
  return Math.max(0, customer.amount - amountPaid(customer));
}

function renderDueReminder() {
  const today = localDateString();
  const dueTasks = tasks.filter((task) => !task.completed && task.dueDate && task.dueDate <= today);
  const dueCustomers = customers.filter((customer) => customer.status !== "paid" && amountRemaining(customer) > 0 && customer.dueDate <= today);
  const totalDue = dueTasks.length + dueCustomers.length;
  const overdue = dueTasks.filter((task) => task.dueDate < today).length +
    dueCustomers.filter((customer) => customer.dueDate < today).length;
  dueReminder.hidden = totalDue === 0;
  dueReminder.textContent = totalDue
    ? `${dueTasks.length} task${dueTasks.length === 1 ? "" : "s"} and ${dueCustomers.length} customer due${dueCustomers.length === 1 ? "" : "s"} due or overdue${overdue ? ` · ${overdue} overdue` : ""}.`
    : "";
  if (!totalDue || typeof Notification === "undefined" || Notification.permission !== "granted") return;
  let enabled = false;
  try {
    enabled = localStorage.getItem(REMINDER_PERMISSION_KEY) === "true";
    if (localStorage.getItem("todo-bot.last-reminder-date.v1") === today) return;
  } catch {
    return;
  }
  if (!enabled || dueNotificationShownFor === today) return;
  dueNotificationShownFor = today;
  try {
    new Notification("ToDO BoT reminders", {
      body: `${dueTasks.length} task${dueTasks.length === 1 ? "" : "s"} and ${dueCustomers.length} customer due${dueCustomers.length === 1 ? "" : "s"}.`,
      tag: `todo-bot-${today}`,
    });
    localStorage.setItem("todo-bot.last-reminder-date.v1", today);
  } catch {
    dueNotificationShownFor = "";
  }
}

function nextOccurrence(value, repeat) {
  if (!value || repeat === "none") return "";
  const [year, month, day] = value.split("-").map(Number);
  const nextMonth = repeat === "monthly" ? month : month - 1;
  const base = new Date(year, month - 1, day);
  if (repeat === "daily") base.setDate(base.getDate() + 1);
  if (repeat === "weekly") base.setDate(base.getDate() + 7);
  if (repeat === "monthly") {
    base.setDate(1);
    base.setMonth(month);
    const target = new Date(year, month + 1, 0).getDate();
    base.setDate(Math.min(day, target));
  }
  return localDateString(base);
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
  taskForm.elements.priority.value = task.priority ?? "normal";
  taskForm.elements.category.value = task.category ?? "personal";
  taskForm.elements.repeat.value = task.repeat ?? "none";
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
    const nextDue = task.completed ? nextOccurrence(task.dueDate, task.repeat) : "";
    if (nextDue && !tasks.some((item) => item.id !== task.id && item.title === task.title && item.dueDate === nextDue && item.repeat === task.repeat)) {
      tasks.unshift({
        id: makeId(),
        title: task.title,
        dueDate: nextDue,
        githubUrl: task.githubUrl ?? "",
        completed: false,
        priority: task.priority ?? "normal",
        category: task.category ?? "personal",
        repeat: task.repeat,
      });
    }
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
  const meta = document.createElement("span");
  meta.className = `task-meta priority-${task.priority ?? "normal"}`;
  meta.textContent = `${task.category ?? "personal"} · ${task.priority ?? "normal"}${task.repeat && task.repeat !== "none" ? ` · ${task.repeat}` : ""}`;
  content.append(meta);
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
  const query = taskSearch.value.trim().toLocaleLowerCase();
  const visibleTasks = tasks.filter((task) => {
    if (activeFilter === "active") return !task.completed;
    if (activeFilter === "completed") return task.completed;
    return true;
  }).filter((task) =>
    (!activeTaskMonth || task.dueDate.startsWith(activeTaskMonth)) &&
    (!query || `${task.title} ${task.category ?? ""}`.toLocaleLowerCase().includes(query)),
  );
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
  renderDueReminder();
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
  const currency = new Intl.NumberFormat(undefined, { style: "currency", currency: "SAR" });
  const paid = amountPaid(customer);
  const remaining = amountRemaining(customer);
  const amount = customer.amount > 0
    ? `${currency.format(remaining)} remaining of ${currency.format(customer.amount)}`
    : "Amount not set";
  detail.textContent = `${amount} · Due ${formatDate(customer.dueDate)} · ${customer.status === "paid" || remaining === 0 ? "Paid" : overdue ? "Overdue" : "Due"}`;
  info.append(name, detail);
  if (paid > 0) {
    const history = document.createElement("span");
    history.textContent = `Payments: ${(customer.payments ?? []).map((payment) => `${currency.format(payment.amount)} on ${formatDate(payment.date)}`).join(", ")}`;
    info.append(history);
  }

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
  if (customer.status !== "paid" && remaining > 0 && customer.amount > 0) {
    const paymentAmount = document.createElement("input");
    paymentAmount.className = "payment-input";
    paymentAmount.type = "number";
    paymentAmount.min = "0.01";
    paymentAmount.max = String(remaining);
    paymentAmount.step = "0.01";
    paymentAmount.placeholder = "Payment";
    paymentAmount.setAttribute("aria-label", `Payment amount for ${customer.name}`);
    const recordPayment = makeAction(`Record payment for ${customer.name}`, "Record payment", () => {
      const value = Number(paymentAmount.value);
      if (!Number.isFinite(value) || value <= 0 || value > remaining || !/^\d+(?:\.\d{1,2})?$/.test(paymentAmount.value)) {
        customerError.textContent = "Enter a payment greater than zero and no more than the remaining balance.";
        paymentAmount.focus();
        return;
      }
      customer.payments ??= [];
      customer.payments.push({ id: makeId(), amount: value, date: localDateString() });
      if (amountRemaining(customer) === 0) customer.status = "paid";
      if (saveRecords(CUSTOMERS_KEY, customers, customerError)) renderCustomers();
    });
    actions.append(paymentAmount, recordPayment);
  }
  if (customer.status !== "paid" && remaining > 0) {
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
  const totalDue = open.reduce((total, customer) => total + amountRemaining(customer), 0);
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

function downloadFile(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value) {
  let text = String(value ?? "");
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function exportCustomerCsvRows() {
  return customers.map((customer) => [
    "customer", customer.id, "", customer.name, customer.phone,
    customer.amount, amountPaid(customer), amountRemaining(customer), customer.dueDate, customer.status,
    "", "", "", (customer.payments ?? []).map(({ amount, date }) => `${date}:${amount}`).join(";"),
  ]);
}

function exportCsvReport() {
  const header = ["type", "id", "title", "name", "phone", "amountDueSAR", "paidSAR", "balanceSAR", "dueDate", "status", "priority", "category", "repeat", "paymentHistory"];
  const taskRows = tasks.map((task) => [
    "task", task.id, task.title, "", "", "", "", "", task.dueDate, task.completed ? "completed" : "open",
    task.priority ?? "normal", task.category ?? "personal", task.repeat ?? "none", "",
  ]);
  const csv = [header, ...taskRows, ...exportCustomerCsvRows()].map((row) => row.map(csvCell).join(",")).join("\r\n");
  downloadFile(`todo-bot-report-${localDateString()}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8");
}

function exportJsonBackup() {
  const backup = {
    format: "todo-bot-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks,
    customers,
  };
  downloadFile(`todo-bot-backup-${localDateString()}.json`, JSON.stringify(backup, null, 2), "application/json");
}

async function importJsonBackup(file) {
  if (!file || file.size > 5 * 1024 * 1024) {
    storageMessage.textContent = "Choose a backup file smaller than 5 MB.";
    return;
  }
  try {
    const backup = JSON.parse(await file.text());
    if (
      backup?.format !== "todo-bot-backup" ||
      backup.version !== 1 ||
      !Array.isArray(backup.tasks) ||
      !Array.isArray(backup.customers) ||
      backup.tasks.length > 10000 ||
      backup.customers.length > 10000 ||
      !backup.tasks.every(isTaskRecord) ||
      !backup.customers.every(isCustomerRecord)
    ) throw new Error("invalid backup");

    askToConfirm(
      "Replace local records?",
      "Importing this backup replaces all current tasks and customer records on this device. Export a copy first if needed.",
      () => {
        const previousTasks = localStorage.getItem(TASKS_KEY);
        const previousCustomers = localStorage.getItem(CUSTOMERS_KEY);
        try {
          localStorage.setItem(TASKS_KEY, JSON.stringify(backup.tasks));
          localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(backup.customers));
          tasks = backup.tasks.map((task) => ({
            priority: "normal", category: "personal", repeat: "none", ...task, dueDate: task.dueDate ?? "",
          }));
          customers = backup.customers.map((customer) => ({ ...customer, payments: customer.payments ?? [] }));
          storageMessage.textContent = "";
          customerError.textContent = "";
          renderTasks();
          renderCustomers();
        } catch {
          if (previousTasks === null) localStorage.removeItem(TASKS_KEY);
          else localStorage.setItem(TASKS_KEY, previousTasks);
          if (previousCustomers === null) localStorage.removeItem(CUSTOMERS_KEY);
          else localStorage.setItem(CUSTOMERS_KEY, previousCustomers);
          storageMessage.textContent = "Could not import the backup. Existing records were kept.";
        }
      },
    );
  } catch {
    storageMessage.textContent = "This file is not a valid ToDO BoT backup.";
  }
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
      task.priority = taskPriority.value;
      task.category = taskCategory.value;
      task.repeat = taskRepeat.value;
    }
    delete taskForm.dataset.editId;
  } else {
    tasks.unshift({
      id: makeId(),
      title,
      dueDate: taskDueDate.value,
      githubUrl,
      completed: false,
      priority: taskPriority.value,
      category: taskCategory.value,
      repeat: taskRepeat.value,
    });
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
    status: oldRecord?.status === "paid" && oldRecord.amount === amount ? "paid" : "due",
    payments: oldRecord?.payments ?? [],
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

taskSearch.addEventListener("input", renderTasks);
taskMonth.addEventListener("change", () => {
  activeTaskMonth = taskMonth.value;
  renderTasks();
});
document.querySelector("#clear-month").addEventListener("click", () => {
  taskMonth.value = "";
  activeTaskMonth = "";
  renderTasks();
});

uiLanguage.addEventListener("change", () => {
  try {
    localStorage.setItem(UI_LANGUAGE_KEY, uiLanguage.value);
  } catch {
    storageMessage.textContent = "Could not save the language preference on this device.";
  }
  applyInterfaceLanguage(uiLanguage.value);
});

textScale.addEventListener("input", () => {
  applyTextScale(textScale.value);
  try {
    localStorage.setItem(TEXT_SCALE_KEY, textScale.value);
  } catch {
    storageMessage.textContent = "Could not save the text-size preference on this device.";
  }
});

exportBackup.addEventListener("click", exportJsonBackup);
exportCsv.addEventListener("click", exportCsvReport);
importBackup.addEventListener("change", async () => {
  const file = importBackup.files?.[0];
  importBackup.value = "";
  await importJsonBackup(file);
});

enableReminders.addEventListener("click", async () => {
  if (typeof Notification === "undefined" || !isSecureContext) {
    voiceStatus.textContent = "Browser notifications are unavailable here. Due reminders still appear while the app is open.";
    return;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      voiceStatus.textContent = "Notification permission was not granted. Due reminders still appear while the app is open.";
      return;
    }
    localStorage.setItem(REMINDER_PERMISSION_KEY, "true");
    voiceStatus.textContent = "Notifications enabled. They are checked while the app is open; background delivery is not guaranteed.";
    renderDueReminder();
  } catch {
    voiceStatus.textContent = "Could not enable notifications. Due reminders still appear while the app is open.";
  }
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
    customers = readRecords(CUSTOMERS_KEY, isCustomerRecord).map((customer) => ({
      ...customer,
      payments: customer.payments ?? [],
    }));
    renderCustomers();
  }
  if (event.key === GITHUB_REPO_KEY) {
    githubRepository = normalizeGitHubRepository(event.newValue ?? "");
    githubRepoInput.value = githubRepository;
    renderTasks();
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

applyStoredPreferences();
initializeAgeGate();
setInterval(renderDueReminder, 60_000);

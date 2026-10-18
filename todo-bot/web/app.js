const TASKS_KEY = "todo-bot.tasks.v1";
const CUSTOMERS_KEY = "todo-bot.customers.v1";
const AGE_KEY = "todo-bot.adult-confirmed.v1";
const LANGUAGE_KEY = "todo-bot.voice-language.v1";
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

let tasks = readRecords(TASKS_KEY, (record) =>
  record &&
  typeof record.id === "string" &&
  typeof record.title === "string" &&
  typeof record.completed === "boolean" &&
  (record.dueDate === undefined || typeof record.dueDate === "string"),
).map((task) => ({ ...task, dueDate: task.dueDate ?? "" }));
let customers = readRecords(CUSTOMERS_KEY, (record) =>
  record &&
  typeof record.id === "string" &&
  typeof record.name === "string" &&
  typeof record.phone === "string" &&
  typeof record.dueDate === "string" &&
  typeof record.amount === "number" &&
  typeof record.channel === "string" &&
  typeof record.consent === "boolean" &&
  typeof record.status === "string",
);
let activeFilter = "all";
let pendingVoice = null;
let voiceTarget = null;
let voiceButton = null;

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
    if (saveRecords(TASKS_KEY, tasks, storageMessage)) renderTasks();
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

  const actions = document.createElement("div");
  actions.className = "row-actions";
  actions.append(
    makeAction(`Edit ${task.title}`, "Edit", () => editTask(task)),
    makeAction(`Delete ${task.title}`, "×", () => {
      tasks = tasks.filter((item) => item.id !== task.id);
      if (saveRecords(TASKS_KEY, tasks, storageMessage)) renderTasks();
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
  if (!phone || !customer.consent || customer.channel === "none") return "";
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
    if (url.startsWith("https:")) {
      contact.target = "_blank";
      contact.rel = "noopener noreferrer";
    }
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
  localStorage.removeItem(AGE_KEY);
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
  const editId = taskForm.dataset.editId;
  if (editId) {
    const task = tasks.find((item) => item.id === editId);
    if (task) {
      task.title = title;
      task.dueDate = taskDueDate.value;
    }
    delete taskForm.dataset.editId;
  } else {
    tasks.unshift({ id: makeId(), title, dueDate: taskDueDate.value, completed: false });
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

customerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  customerError.textContent = "";
  const formData = new FormData(customerForm);
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const channel = String(formData.get("channel") ?? "none");
  const consent = customerForm.elements.consent.checked;
  if (channel !== "none" && (!phone || !consent)) {
    customerError.textContent = "Add a phone number and confirm you have permission before preparing a contact action.";
    return;
  }
  const editId = customerForm.dataset.editId;
  const oldRecord = editId ? customers.find((item) => item.id === editId) : null;
  const record = {
    id: editId ?? makeId(),
    name: name.slice(0, 120),
    phone: phone.slice(0, 30),
    amount: Number(formData.get("amount")) || 0,
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
    tasks = readRecords(TASKS_KEY, (record) =>
      record && typeof record.id === "string" && typeof record.title === "string" && typeof record.completed === "boolean",
    ).map((task) => ({ ...task, dueDate: task.dueDate ?? "" }));
    renderTasks();
  }
  if (event.key === CUSTOMERS_KEY) {
    customers = readRecords(CUSTOMERS_KEY, (record) =>
      record && typeof record.id === "string" && typeof record.name === "string" && typeof record.dueDate === "string",
    );
    renderCustomers();
  }
});

if ("serviceWorker" in navigator && ["http:", "https:"].includes(location.protocol)) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}

initializeAgeGate();

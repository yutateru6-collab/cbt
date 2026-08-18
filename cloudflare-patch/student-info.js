"use strict";

const READY_MESSAGE = "tg-lesson-student-info-ready";
const PROFILE_FIELDS = [
  "schoolGrade",
  "firstChoice",
  "otherChoices",
  "admissionType",
  "currentStatus",
  "academicStatus",
  "currentChallenge",
  "teachingPolicy",
  "nextAction",
  "summary",
  "freeMemo"
];

const studentListView = document.getElementById("student-list-view");
const studentDetailView = document.getElementById("student-detail-view");
const studentSearch = document.getElementById("student-search");
const studentList = document.getElementById("student-list");
const emptyList = document.getElementById("empty-list");
const statusMessage = document.getElementById("status-message");
const backButton = document.getElementById("back-button");
const editButton = document.getElementById("edit-button");
const studentNameElement = document.getElementById("student-name");
const studentFuriganaElement = document.getElementById("student-furigana");
const updatedAtElement = document.getElementById("updated-at");
const profileDisplay = document.getElementById("profile-display");
const profileEditor = document.getElementById("profile-editor");
const cancelEditButton = document.getElementById("cancel-edit-button");
const saveProfileButton = document.getElementById("save-profile-button");
const saveMessage = document.getElementById("save-message");

const summaryTargets = {
  firstChoice: document.getElementById("summary-first-choice"),
  admissionType: document.getElementById("summary-admission-type"),
  currentStatus: document.getElementById("summary-current-status"),
  currentChallenge: document.getElementById("summary-current-challenge"),
  nextAction: document.getElementById("summary-next-action")
};

const displayTargets = {
  schoolGrade: document.getElementById("display-school-grade"),
  firstChoice: document.getElementById("display-first-choice"),
  otherChoices: document.getElementById("display-other-choices"),
  admissionType: document.getElementById("display-admission-type"),
  currentStatus: document.getElementById("display-current-status"),
  academicStatus: document.getElementById("display-academic-status"),
  currentChallenge: document.getElementById("display-current-challenge"),
  teachingPolicy: document.getElementById("display-teaching-policy"),
  nextAction: document.getElementById("display-next-action"),
  summary: document.getElementById("display-summary"),
  freeMemo: document.getElementById("display-free-memo")
};

const editorFields = Object.fromEntries(
  PROFILE_FIELDS.map((field) => [field, profileEditor.elements.namedItem(field)])
);

let students = [];
let selectedStudent = null;
let editing = false;
let editBaseline = "";
let loading = false;
let lastLoadedAt = 0;

function normalizeSearch(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\s\u3000]+/g, "")
    .toLocaleLowerCase("ja-JP");
}

function emptyProfile() {
  return Object.fromEntries(PROFILE_FIELDS.map((field) => [field, ""]));
}

function sanitizeStudent(value) {
  const profile = { ...emptyProfile(), ...(value?.profile || {}) };
  return {
    id: String(value?.id || ""),
    familyName: String(value?.familyName || ""),
    furigana: String(value?.furigana || ""),
    profile,
    profileRevision: Number.isInteger(value?.profileRevision)
      ? value.profileRevision
      : 0,
    profileUpdatedAt:
      typeof value?.profileUpdatedAt === "string" ? value.profileUpdatedAt : null
  };
}

function formatUpdatedAt(value) {
  if (!value) {
    return "生徒情報はまだ未登録です";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "更新日時不明";
  }
  return `最終更新 ${new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date)}`;
}

function setStatus(message, tone = "") {
  statusMessage.textContent = message;
  statusMessage.dataset.tone = tone;
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    cache: "no-store",
    credentials: "same-origin",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `HTTP ${response.status}`);
    error.code = data.code || "request_failed";
    error.details = data.details;
    throw error;
  }
  return data;
}

async function loadStudents({ quiet = false } = {}) {
  if (loading) return;
  loading = true;
  if (!quiet) setStatus("生徒情報を読み込んでいます…");
  try {
    const data = await requestJson("/api/student-profiles");
    students = Array.isArray(data.students)
      ? data.students.map(sanitizeStudent).filter((student) => student.id && student.familyName)
      : [];
    students.sort((left, right) => {
      const byName = left.familyName.localeCompare(right.familyName, "ja-JP");
      if (byName !== 0) return byName;
      return left.furigana.localeCompare(right.furigana, "ja-JP");
    });
    lastLoadedAt = Date.now();
    if (!quiet) setStatus(`${students.length}人を読み込みました。`);
    renderStudentList();

    if (selectedStudent) {
      const refreshed = students.find((student) => student.id === selectedStudent.id);
      if (refreshed) {
        selectedStudent = refreshed;
        if (!editing) renderSelectedStudent();
      }
    }
  } catch (error) {
    setStatus(`読み込みできませんでした：${error.message}`, "error");
  } finally {
    loading = false;
  }
}

function studentSearchText(student) {
  return normalizeSearch(
    `${student.familyName} ${student.furigana} ${student.profile.firstChoice} ${student.profile.schoolGrade}`
  );
}

function renderStudentList() {
  const query = normalizeSearch(studentSearch.value);
  const visible = students.filter((student) => !query || studentSearchText(student).includes(query));
  studentList.replaceChildren();
  emptyList.hidden = visible.length > 0;

  for (const student of visible) {
    const button = document.createElement("button");
    const text = document.createElement("span");
    const name = document.createElement("span");
    const meta = document.createElement("span");
    const arrow = document.createElement("span");

    button.type = "button";
    button.className = "student-row-button";
    text.className = "student-row-text";
    name.className = "student-row-name";
    meta.className = "student-row-meta";
    arrow.className = "student-row-arrow";

    name.textContent = student.familyName;
    const parts = [];
    if (student.furigana) parts.push(student.furigana);
    if (student.profile.firstChoice) parts.push(student.profile.firstChoice);
    if (parts.length === 0) parts.push(formatUpdatedAt(student.profileUpdatedAt));
    meta.textContent = parts.join("・");
    arrow.textContent = "›";

    text.append(name, meta);
    button.append(text, arrow);
    button.addEventListener("click", () => openStudent(student));
    studentList.append(button);
  }
}

function openStudent(student) {
  selectedStudent = student;
  editing = false;
  studentListView.hidden = true;
  studentDetailView.hidden = false;
  renderSelectedStudent();
}

function renderSelectedStudent() {
  if (!selectedStudent) return;
  const profile = selectedStudent.profile || emptyProfile();
  studentNameElement.textContent = selectedStudent.familyName;
  studentFuriganaElement.textContent = selectedStudent.furigana || "";
  updatedAtElement.textContent = formatUpdatedAt(selectedStudent.profileUpdatedAt);

  for (const [field, target] of Object.entries(summaryTargets)) {
    target.textContent = profile[field] || "未登録";
  }
  for (const [field, target] of Object.entries(displayTargets)) {
    target.textContent = profile[field] || "未登録";
  }

  profileDisplay.hidden = editing;
  profileEditor.hidden = !editing;
  editButton.hidden = editing;
}

function collectEditorProfile() {
  return Object.fromEntries(
    PROFILE_FIELDS.map((field) => [
      field,
      String(editorFields[field]?.value ?? "").replace(/\r\n?/g, "\n").trim()
    ])
  );
}

function serializeEditor() {
  return JSON.stringify(collectEditorProfile());
}

function startEditing() {
  if (!selectedStudent) return;
  editing = true;
  for (const field of PROFILE_FIELDS) {
    editorFields[field].value = selectedStudent.profile[field] || "";
  }
  editBaseline = serializeEditor();
  saveMessage.textContent = "";
  saveMessage.dataset.tone = "";
  renderSelectedStudent();
  editorFields.summary.focus();
}

function hasUnsavedChanges() {
  return editing && serializeEditor() !== editBaseline;
}

function confirmDiscard() {
  return !hasUnsavedChanges() || window.confirm("保存していない変更を破棄しますか？");
}

function cancelEditing() {
  if (!confirmDiscard()) return;
  editing = false;
  saveMessage.textContent = "";
  renderSelectedStudent();
}

async function saveProfile(event) {
  event.preventDefault();
  if (!selectedStudent) return;

  const profile = collectEditorProfile();
  saveProfileButton.disabled = true;
  saveProfileButton.textContent = "保存中…";
  saveMessage.textContent = "Cloudflareへ保存しています…";
  saveMessage.dataset.tone = "";

  try {
    const data = await requestJson(`/api/student-profiles/${encodeURIComponent(selectedStudent.id)}`, {
      method: "PUT",
      body: JSON.stringify({
        expectedRevision: selectedStudent.profileRevision,
        requestId: crypto.randomUUID(),
        profile
      })
    });
    const saved = sanitizeStudent(data.student);
    const index = students.findIndex((student) => student.id === saved.id);
    if (index >= 0) students[index] = saved;
    selectedStudent = saved;
    editing = false;
    editBaseline = "";
    renderSelectedStudent();
    renderStudentList();
    saveMessage.textContent = "";
  } catch (error) {
    if (error.code === "profile_revision_conflict") {
      saveMessage.textContent = "別の画面で先に更新されています。最新を読み込み直してから、内容を確認してください。";
    } else {
      saveMessage.textContent = `保存できませんでした：${error.message}`;
    }
    saveMessage.dataset.tone = "error";
  } finally {
    saveProfileButton.disabled = false;
    saveProfileButton.textContent = "クラウドに保存";
  }
}

studentSearch.addEventListener("input", renderStudentList);
backButton.addEventListener("click", () => {
  if (!confirmDiscard()) return;
  selectedStudent = null;
  editing = false;
  studentDetailView.hidden = true;
  studentListView.hidden = false;
  studentSearch.focus();
});
editButton.addEventListener("click", startEditing);
cancelEditButton.addEventListener("click", cancelEditing);
profileEditor.addEventListener("submit", saveProfile);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && Date.now() - lastLoadedAt > 10000 && !editing) {
    void loadStudents({ quiet: true });
  }
});

window.addEventListener("beforeunload", (event) => {
  if (!hasUnsavedChanges()) return;
  event.preventDefault();
  event.returnValue = "";
});

window.parent.postMessage({ type: READY_MESSAGE, protocol: 1 }, "*");
void loadStudents();

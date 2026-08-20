const { useEffect, useMemo, useRef, useState } = React;
const { motion, AnimatePresence } = Motion;
const html = htm.bind(React.createElement);

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "assignments", label: "Assignments" },
  { id: "routine", label: "Your Routine" },
  { id: "ask", label: "Ask VIRELI" },
  { id: "calendar", label: "Calendar" },
  { id: "daily-log", label: "Daily Log" },
  { id: "improve", label: "How can we improve" },
  { id: "settings", label: "Settings" },
];

const PRIMARY_NAV_ITEMS = NAV_ITEMS.filter((item) =>
  ["home", "assignments", "routine", "ask", "calendar", "daily-log"].includes(item.id),
);
const MOBILE_NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "assignments", label: "Assignments" },
  { id: "ask", label: "Ask" },
  { id: "calendar", label: "Calendar" },
  { id: "more", label: "More" },
];

const CLASS_STORAGE_KEY = "vireli.savedClasses.v1";
const HOMEWORK_STORAGE_KEY = "vireli.homework.v1";
const PROFILE_STORAGE_KEY = "vireli.profile.v1";
const SCENARIO_AGENT_STORAGE_KEY = "vireli.scenarioAgent.v1";
const ASK_HISTORY_STORAGE_KEY = "vireli.askHistory.v1";
const DAILY_LOG_STORAGE_KEY = "vireli.dailyLog.v1";
const FEEDBACK_STORAGE_KEY = "vireli.feedback.v1";
const RECOMMENDATION_STORAGE_KEY = "vireli.recommendations.v1";
const CALENDAR_TASK_STORAGE_KEY = "vireli.calendarTasks.v1";
const CALENDAR_PREFERENCES_STORAGE_KEY = "vireli.calendarPreferences.v1";
const ROUTINE_STORAGE_KEY = "vireli.routine.v1";
const THOUGHT_STORAGE_KEY = "vireli.thoughts.v1";
const EMAIL_AUTH_CODE_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_CLASS_OPTIONS = [
  { id: "math", label: "Math" },
  { id: "science", label: "Science" },
  { id: "social-studies", label: "Social Studies" },
  { id: "language-arts", label: "Language Arts" },
  { id: "other", label: "Other" },
];

const MOOD_OPTIONS = [
  { id: "good", label: "Good", text: "Bright, lifted, and ready enough." },
  { id: "ok", label: "Okay", text: "Steady, neutral, or still waking up." },
  { id: "bad", label: "Bad", text: "Heavy, tired, stressed, or low." },
];

const RESPONSE_TYPE_OPTIONS = [
  { id: "mental-health", label: "Mental Health" },
  { id: "homework", label: "Homework" },
  { id: "conversation", label: "Conversation" },
];

const EMPTY_HOMEWORK_DRAFT = {
  classId: "",
  classLabel: "",
  title: "",
  topic: "",
  details: "",
  notes: "",
  dueDate: "",
  dueTime: "",
  scheduledDate: "",
  scheduledTime: "",
  estimatedMinutes: "",
  priority: "Normal",
  type: "Task",
  frequency: "One time",
  steps: [],
  scheduledFor: "",
  customSchedule: "",
  attachmentName: "",
  attachmentType: "",
  attachmentPreview: "",
};

const EMPTY_PROFILE = {
  connected: false,
  guest: false,
  name: "",
  email: "",
  picture: "",
  googleSub: "",
  password: "",
  authMode: "",
  classSetupSkipped: false,
  routineSetupSkipped: false,
  primaryUse: "",
  setupComplete: false,
  setupStep: 0,
  timezone: "",
  schedulingPreferences: {
    breakPreference: "Balanced",
    earliestFlexibleTime: "",
    latestFlexibleTime: "",
    defaultDurationBehavior: "Estimate from task",
    automaticRescheduling: true,
    askBeforeMoving: true,
    moodAffectsScheduling: true,
  },
  createdAt: "",
  updatedAt: "",
};

const EMPTY_ROUTINE_DRAFT = {
  wakeTime: "",
  bedTime: "",
  dailyActivities: [],
  mealTimes: [],
  preferredDailyWorkloadMinutes: "",
  preferredWorkloadLabel: "",
  weekdayWorkloadMinutes: "",
  weekendWorkloadMinutes: "",
  createdAt: "",
  updatedAt: "",
};

const EMPTY_CALENDAR_TASK_DRAFT = {
  title: "",
  subject: "",
  itemType: "Task",
  flexible: true,
  fixed: false,
  days: "One time",
  preferredTime: "",
  scheduledDate: "",
  scheduledTime: "",
  endTime: "",
  durationMinutes: "",
  allDay: false,
  repeat: false,
  dueDate: "",
  dueTime: "",
  estimatedMinutes: "",
  priority: "Normal",
  frequency: "Never",
  notes: "",
  completed: false,
};

const EMPTY_THOUGHT_DRAFT = "";

const EMPTY_CALENDAR_PREFERENCES = {
  remindersEnabled: true,
  reminderTiming: "At planned time",
  noGuiltLanguage: true,
};

const EMPTY_DAILY_LOG_DRAFT = {
  id: "",
  rating: "",
  couldBeBetter: "",
  activities: [""],
  activitiesLocked: false,
  wentWell: "",
  didNotGoWell: "",
  highlight: "",
  createdAt: "",
  updatedAt: "",
};

const EMPTY_FEEDBACK_DRAFT = {
  area: "",
  text: "",
};

const APP_VERSION = "day12-intelligent-scheduling-20260820b";
const INTRO_ANIMATION_SECONDS = 0.35;
const INTRO_SCREEN_DURATION_MS = 0;
const THEME_TRANSITION_DURATION_MS = 2000;
const DAY_MODE_START_HOUR = 3;
const REFLECTION_MODE_START_HOUR = 15;
const CHAT_RESPONSE_DELAY_MS = 720;
const ASK_HISTORY_LIMIT = 16;
const ASK_RECENT_WINDOW_DAYS = 7;

const DAILY_LOG_RATINGS = ["Great", "Good", "OK", "Bad", "Miserable"];
const SCHEDULE_OPTIONS = ["Morning", "Afternoon", "Evening", "Custom"];
const PRIORITY_OPTIONS = ["Low", "Normal", "High"];
const HOMEWORK_TYPE_OPTIONS = ["Task", "Event"];
const PLAN_FREQUENCY_OPTIONS = ["Never", "Daily", "Weekdays", "Weekly", "Monthly", "Custom"];
const WORKLOAD_OPTIONS = [
  { id: "light", label: "Light", minutes: 120 },
  { id: "balanced", label: "Balanced", minutes: 180 },
  { id: "focused", label: "Focused", minutes: 240 },
  { id: "custom", label: "Custom", minutes: "" },
];
const PRIMARY_USE_OPTIONS = ["School", "Work", "Other"];
const ROUTINE_DAY_OPTIONS = ["Every day", "Weekdays", "Weekends", "Custom"];
const SETUP_STEPS = ["About You", "Mood Pulse", "Schedule Basics", "Your Routine"];
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const REMINDER_TIMING_OPTIONS = [
  "At planned time",
  "10 minutes before",
  "30 minutes before",
  "1 hour before",
];
const ASK_SCHEDULING_FILLER_PHRASES = [
  "can you",
  "could you",
  "would you",
  "please",
  "what if",
  "should i",
  "when",
  "where",
  "how",
  "why",
  "add",
  "schedule",
  "remove",
  "delete",
  "cancel",
  "move",
  "reschedule",
  "change",
  "shift",
  "put",
  "create",
  "remind me",
  "plan",
  "take off",
  "find time for",
  "best time for",
  "what time should i",
  "when should i",
  "every day",
  "every weekday",
  "every week",
  "daily",
  "weekly",
  "weekdays",
  "every morning",
  "every afternoon",
  "every evening",
  "every night",
];
const WEEKDAY_LOOKUP = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};
const RECOVERY_OPTIONS = [
  {
    id: "passkey",
    title: "Passkey",
    copy: "Use a saved device passkey when real authentication is connected.",
  },
  {
    id: "qr",
    title: "QR code",
    copy: "Scan a QR code from another signed-in device in a future secure login flow.",
  },
  {
    id: "email",
    title: "Verification email",
    copy: "Send a recovery email after real email verification is added.",
  },
  {
    id: "backup",
    title: "Backup method",
    copy: "Use a trusted backup recovery option when accounts are live.",
  },
];
const FEEDBACK_AREAS = [
  "Something didn’t work",
  "VIRELI misunderstood me",
  "Scheduling problem",
  "Feature idea",
  "Design feedback",
];

const MOOD_DETAILS = {
  unchecked: {
    label: "Not set",
    heading: "You can still make a calm plan for today.",
    copy:
      "If naming the feeling feels like too much right now, start with one small plan instead.",
    support:
      "You can always come back later. One honest next step is enough for now.",
    quote: '"You do not need perfect clarity to take one decent step."',
    quoteNote:
      "Planning first can still be a kind way to begin when feelings are hard to name.",
    reflection: "What would make today feel more manageable?",
  },
  good: {
    label: "Good",
    heading: "You have some lift to work with today.",
    copy:
      "Let the good energy help you begin, but do not turn it into pressure or overpacking.",
    support:
      "Use the energy gently. One meaningful start is better than turning a good feeling into a packed schedule.",
    quote:
      '"You are allowed to enjoy a good moment without turning it into pressure."',
    quoteNote:
      "Let the lift stay soft enough to last instead of demanding that it prove something.",
    reflection: "What feels exciting, light, or possible right now?",
  },
  ok: {
    label: "Ok",
    heading: "Today feels workable, and workable is enough.",
    copy:
      "A steady day does not need drama. Build around one clear goal and one kind reset.",
    support:
      "Keep the expectations honest. A clear finish line and a little breathing room can hold the whole day together.",
    quote:
      '"Not every day has to be extraordinary to still be worth showing up for."',
    quoteNote:
      "Steady is still real progress. You can move without forcing a bigger feeling than the day is giving you.",
    reflection: "What would make today feel 10% easier?",
  },
  bad: {
    label: "Bad",
    heading: "Today might need to stay soft, small, and safe.",
    copy:
      "Lower the pressure first. The goal is not to force a big day out of a low-energy one.",
    support:
      "Make the first step so gentle it stops feeling like a demand. Being tender with yourself is part of moving through it.",
    quote:
      '"Some days are only about getting through gently, and that still counts as strength."',
    quoteNote:
      "You do not need to sound brave today. You only need enough softness to stay with yourself.",
    reflection: "What is the smallest supportive thing you need first?",
  },
  overwhelmed: {
    label: "Overwhelmed",
    heading: "There is a lot pressing on you right now.",
    copy:
      "When everything feels loud, the next job is to make the day smaller, slower, and easier to trust.",
    support:
      "Do not sort out the whole day at once. Name one next thing, let the rest wait outside the room, and come back only when you can.",
    quote:
      '"When everything feels loud, choosing one quiet next step is enough."',
    quoteNote:
      "A full mind does not mean you are failing. It means you deserve less noise and more gentleness.",
    reflection: "What feels the heaviest, and what can be made smaller first?",
  },
};

function buildInitialMessages(mood = "ok") {
  const opener =
    {
      good: "Hi, I'm VIRELI. Tell me a task, and I will find a good time for it.",
      ok: "Hi, I'm VIRELI. Give me one task, and I will look for a realistic opening.",
      bad: "Hi, I'm VIRELI. We can keep this small. Tell me one task, and I will find a gentle time for it.",
      overwhelmed: "Hi, I'm VIRELI. Name one task, and I will help place it somewhere manageable.",
    }[mood] || "Hi, I'm VIRELI. Give me one task, and I will look for a realistic opening.";

  return [
    {
      id: makeId("assistant-intro"),
      role: "assistant",
      content: opener,
      createdAt: new Date().toISOString(),
    },
  ];
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function isHardMood(mood) {
  return mood === "bad" || mood === "overwhelmed";
}

function getMoodTheme(mood) {
  return (
    {
      good: "good",
      ok: "ok",
      bad: "bad",
      overwhelmed: "overwhelmed",
    }[mood] || "default"
  );
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function canUseLocalStorage() {
  try {
    return typeof window !== "undefined" && Boolean(window.localStorage);
  } catch (error) {
    return false;
  }
}

function readPersistentArray(storageKey) {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    return [];
  }
}

function writePersistentArray(storageKey, items) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(items));
}

function readPersistentObject(storageKey, fallbackValue = {}) {
  if (!canUseLocalStorage()) {
    return fallbackValue;
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey);
    const parsedValue = storedValue ? JSON.parse(storedValue) : fallbackValue;
    return parsedValue && typeof parsedValue === "object" && !Array.isArray(parsedValue)
      ? { ...fallbackValue, ...parsedValue }
      : fallbackValue;
  } catch (error) {
    return fallbackValue;
  }
}

function writePersistentObject(storageKey, value) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(value));
}

function normalizeClassName(name) {
  return name.trim().replace(/\s+/g, " ");
}

function createClass(label) {
  const normalizedLabel = normalizeClassName(label);

  return {
    id: makeId("class"),
    label: normalizedLabel,
  };
}

function dedupeClasses(classes) {
  const seenLabels = new Set();

  return classes
    .map((item) => ({
      id: item.id || makeId("class"),
      label: normalizeClassName(item.label || item.name || ""),
    }))
    .filter((item) => {
      const key = item.label.toLowerCase();

      if (!item.label || seenLabels.has(key)) {
        return false;
      }

      seenLabels.add(key);
      return true;
    });
}

function loadSavedClasses() {
  return dedupeClasses(readPersistentArray(CLASS_STORAGE_KEY));
}

function loadSavedHomework() {
  return readPersistentArray(HOMEWORK_STORAGE_KEY)
    .map((item) => {
      const title = item.title || item.assignmentName || item.topic || "";
      const details = item.details || item.notes || "";
      const scheduledTime =
        item.scheduledTime ||
        (item.scheduledFor === "Custom" ? item.customSchedule : item.scheduledFor) ||
        "";

      return {
        id: item.id || makeId("homework"),
        classId: item.classId || "",
        classLabel: item.classLabel || item.subject || "",
        title,
        topic: item.topic || title,
        details,
        notes: item.notes || details,
        dueDate: item.dueDate || "",
        dueTime: item.dueTime || "",
        scheduledDate: item.scheduledDate || "",
        scheduledTime,
        estimatedMinutes: item.estimatedMinutes || "",
        priority: item.priority || "Normal",
        type: item.type || "Assignment",
        frequency: item.frequency || "One time",
        steps: Array.isArray(item.steps) ? item.steps : [],
        scheduledFor: item.scheduledFor || "",
        customSchedule: item.customSchedule || "",
        attachmentName: item.attachmentName || "",
        attachmentType: item.attachmentType || "",
        attachmentPreview: item.attachmentPreview || "",
        guidance: item.guidance || "",
        completed: Boolean(item.completed),
        completedAt: item.completedAt || "",
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
      };
    })
    .filter((item) => item.title);
}

function loadProfile() {
  const profile = readPersistentObject(PROFILE_STORAGE_KEY, EMPTY_PROFILE);
  return {
    ...EMPTY_PROFILE,
    ...profile,
    connected: Boolean(profile.connected),
    guest: Boolean(profile.guest),
    classSetupSkipped: Boolean(profile.classSetupSkipped),
    routineSetupSkipped: Boolean(profile.routineSetupSkipped),
    picture: profile.picture || "",
    googleSub: profile.googleSub || "",
    password: "",
  };
}

function normalizeRoutineEntry(entry = {}) {
  const rawActivities = Array.isArray(entry.dailyActivities)
    ? entry.dailyActivities
    : String(entry.dailyActivities || "")
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  const dailyActivities = rawActivities
    .map((item, index) => {
      if (typeof item === "object" && item !== null) {
        return {
          id: item.id || makeId("routine-activity"),
          name: String(item.name || item.label || "").trim(),
          durationMinutes: String(item.durationMinutes || "").trim(),
          usualTime: String(item.usualTime || item.time || "").trim(),
          days: String(item.days || "Weekdays").trim(),
          fixed: item.fixed !== false,
          flexible: Boolean(item.flexible),
          active: item.active !== false,
        };
      }

      return {
        id: makeId(`routine-activity-${index}`),
        name: String(item || "").trim(),
        durationMinutes: "",
        usualTime: "",
        days: "Weekdays",
        fixed: true,
        flexible: false,
        active: true,
      };
    })
    .filter((item) => item.name || item.durationMinutes || item.usualTime)
    .slice(0, 8);

  return {
    ...EMPTY_ROUTINE_DRAFT,
    ...entry,
    wakeTime: String(entry.wakeTime || ""),
    bedTime: String(entry.bedTime || ""),
    dailyActivities,
    mealTimes: [],
    preferredDailyWorkloadMinutes: String(entry.preferredDailyWorkloadMinutes || ""),
    preferredWorkloadLabel: String(entry.preferredWorkloadLabel || ""),
    weekdayWorkloadMinutes: String(entry.weekdayWorkloadMinutes || entry.preferredDailyWorkloadMinutes || ""),
    weekendWorkloadMinutes: String(entry.weekendWorkloadMinutes || entry.preferredDailyWorkloadMinutes || ""),
    createdAt: entry.createdAt || "",
    updatedAt: entry.updatedAt || "",
  };
}

function loadRoutine() {
  return normalizeRoutineEntry(readPersistentObject(ROUTINE_STORAGE_KEY, EMPTY_ROUTINE_DRAFT));
}

function hasSavedRoutine(routine) {
  return Boolean(
    routine.wakeTime ||
      routine.bedTime ||
      (routine.dailyActivities || []).some((item) =>
        typeof item === "string"
          ? item.trim()
          : item.name || item.durationMinutes || item.usualTime,
      ),
  );
}

function hasCompleteRoutine(routine) {
  return Boolean(routine?.wakeTime && routine?.bedTime && routine?.preferredDailyWorkloadMinutes);
}

function saveRoutine(routineDraft) {
  const now = new Date().toISOString();
  const nextRoutine = normalizeRoutineEntry({
    ...routineDraft,
    dailyActivities: (routineDraft.dailyActivities || [])
      .map((item) => ({
        ...item,
        name: String(item.name || "").trim(),
        durationMinutes: String(item.durationMinutes || "").trim(),
        usualTime: String(item.usualTime || "").trim(),
        days: String(item.days || "Weekdays").trim(),
        fixed: item.fixed !== false,
        flexible: Boolean(item.flexible),
        active: item.active !== false,
      }))
      .filter((item) => item.name || item.durationMinutes || item.usualTime),
    mealTimes: [],
    preferredDailyWorkloadMinutes: String(routineDraft.preferredDailyWorkloadMinutes || "").trim(),
    preferredWorkloadLabel: String(routineDraft.preferredWorkloadLabel || "").trim(),
    weekdayWorkloadMinutes: String(routineDraft.weekdayWorkloadMinutes || routineDraft.preferredDailyWorkloadMinutes || "").trim(),
    weekendWorkloadMinutes: String(routineDraft.weekendWorkloadMinutes || routineDraft.preferredDailyWorkloadMinutes || "").trim(),
    createdAt: routineDraft.createdAt || now,
    updatedAt: now,
  });

  writePersistentObject(ROUTINE_STORAGE_KEY, nextRoutine);
  return nextRoutine;
}

function normalizeCalendarTask(task = {}) {
  const itemType = task.itemType || task.type || "Task";
  return {
    ...EMPTY_CALENDAR_TASK_DRAFT,
    ...task,
    id: task.id || makeId("task"),
    title: task.title || "Untitled task",
    itemType: itemType === "Event" ? "Event" : "Task",
    frequency: task.frequency && task.frequency !== "One time" ? task.frequency : "Never",
    allDay: Boolean(task.allDay),
    repeat: Boolean(task.repeat || (task.frequency && task.frequency !== "Never" && task.frequency !== "One time")),
    durationMinutes: String(task.durationMinutes || task.estimatedMinutes || ""),
    completed: Boolean(task.completed),
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || task.createdAt || new Date().toISOString(),
  };
}

function loadCalendarTasks() {
  return readPersistentArray(CALENDAR_TASK_STORAGE_KEY)
    .map(normalizeCalendarTask)
    .filter((task) => task.title)
    .slice(0, 60);
}

function loadCalendarPreferences() {
  return {
    ...EMPTY_CALENDAR_PREFERENCES,
    ...readPersistentObject(CALENDAR_PREFERENCES_STORAGE_KEY, EMPTY_CALENDAR_PREFERENCES),
  };
}

function getScheduleLabel(item) {
  if (item.scheduledDate || item.scheduledTime) {
    return [item.scheduledDate, item.scheduledTime].filter(Boolean).join(" at ") || "Planned";
  }

  if (item.scheduledFor === "Custom") {
    return item.customSchedule || "Custom time";
  }

  return item.scheduledFor || "Unscheduled";
}

function loadAskHistory() {
  return [];
}

function saveAskHistory(entries) {
  writePersistentArray(ASK_HISTORY_STORAGE_KEY, []);
}

function isRecentChat(entry, now = new Date()) {
  const updatedAt = new Date(entry.updatedAt || entry.createdAt || 0);

  if (Number.isNaN(updatedAt.getTime())) {
    return false;
  }

  return now.getTime() - updatedAt.getTime() <= ASK_RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

function getRecentAskHistory(entries) {
  return entries.filter((entry) => isRecentChat(entry));
}

function getArchivedAskHistory(entries) {
  return entries.filter((entry) => !isRecentChat(entry));
}

function normalizeDailyLogEntry(entry = {}) {
  const didTodayText = typeof entry.didToday === "string" ? entry.didToday.trim() : "";
  const activities = Array.isArray(entry.activities)
    ? entry.activities.map((activity) => String(activity || "")).slice(0, 8)
    : didTodayText
      ? [didTodayText]
      : [""];

  return {
    ...EMPTY_DAILY_LOG_DRAFT,
    ...entry,
    id: entry.id || makeId("daily-log"),
    activities: activities.length ? activities : ["", "", ""],
    activitiesLocked: Boolean(entry.activitiesLocked),
    createdAt: entry.createdAt || entry.updatedAt || new Date().toISOString(),
    updatedAt: entry.updatedAt || entry.createdAt || new Date().toISOString(),
  };
}

function loadDailyLogs() {
  return readPersistentArray(DAILY_LOG_STORAGE_KEY)
    .map(normalizeDailyLogEntry)
    .slice(0, 20);
}

function loadDailyLog() {
  const savedLogs = loadDailyLogs();
  return normalizeDailyLogEntry(savedLogs[0] || EMPTY_DAILY_LOG_DRAFT);
}

function saveDailyLog(logDraft, existingLogs = loadDailyLogs()) {
  const now = new Date().toISOString();
  const nextLog = normalizeDailyLogEntry({
    ...logDraft,
    id: logDraft.id || makeId("daily-log"),
    createdAt: logDraft.createdAt || now,
    updatedAt: now,
    activities: (logDraft.activities || []).map((activity) => activity.trim()).filter(Boolean),
  });
  const nextLogs = [
    nextLog,
    ...existingLogs.filter((log) => log.id !== nextLog.id),
  ].slice(0, 20);

  writePersistentArray(DAILY_LOG_STORAGE_KEY, nextLogs);
  return nextLogs;
}

function loadFeedbackEntries() {
  return readPersistentArray(FEEDBACK_STORAGE_KEY);
}

function getClassLabel(classes, classId, fallback = "Class") {
  return classes.find((item) => item.id === classId)?.label || fallback;
}

function normalizePromptForMatch(prompt) {
  return prompt.trim().replace(/\s+/g, " ").toLowerCase();
}

function getTimeOfDayMode(date = new Date()) {
  const hour = date.getHours();

  return hour >= DAY_MODE_START_HOUR && hour < REFLECTION_MODE_START_HOUR
    ? "day"
    : "night";
}

function getPlanTodayTitle(timeMode) {
  return "Plans";
}

function getDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysToDateValue(dateValue, dayCount) {
  const date = dateValue ? new Date(`${dateValue}T12:00:00`) : new Date();
  date.setDate(date.getDate() + dayCount);
  return getDateInputValue(date);
}

function getMonthLabel(date) {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function getMonthGridDates(anchorDate) {
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date,
      value: getDateInputValue(date),
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: getDateInputValue(date) === getDateInputValue(),
    };
  });
}

function getWeekDates(anchorDate = new Date()) {
  const start = new Date(anchorDate);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      value: getDateInputValue(date),
      day: date.getDate(),
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      isToday: getDateInputValue(date) === getDateInputValue(),
    };
  });
}

function formatShortDate(dateValue) {
  if (!dateValue) {
    return "No date";
  }

  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTimeLabel(timeValue) {
  if (!timeValue) {
    return "";
  }

  const [hourText, minuteText] = timeValue.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText || 0);

  if (!Number.isFinite(hour)) {
    return timeValue;
  }

  return new Date(2026, 0, 1, hour, minute).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeToMinutes(timeValue) {
  if (!timeValue) {
    return null;
  }

  const [hourText, minuteText = "0"] = String(timeValue).split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  return hour * 60 + minute;
}

function minutesToTimeValue(totalMinutes) {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatDurationFromMinutes(totalMinutes) {
  const minutes = Math.max(0, Math.round(Number(totalMinutes) || 0));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours && remainder) {
    return `${hours}h ${remainder}m`;
  }

  if (hours) {
    return `${hours}h`;
  }

  return `${remainder}m`;
}

function parseLooseTimeToMinutes(timeText) {
  const text = String(timeText || "").trim();
  const direct = timeToMinutes(text);

  if (direct !== null) {
    return direct;
  }

  const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === "PM" && hour < 12) {
    hour += 12;
  }

  if (meridiem === "AM" && hour === 12) {
    hour = 0;
  }

  return hour * 60 + minute;
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getFriendlyDateLabel(dateValue) {
  const today = getDateInputValue();
  const tomorrow = addDaysToDateValue(today, 1);

  if (dateValue === today) {
    return "today";
  }

  if (dateValue === tomorrow) {
    return "tomorrow";
  }

  return formatShortDate(dateValue);
}

function getNextWeekdayDateValue(weekdayIndex, fromDate = new Date()) {
  const nextDate = new Date(fromDate);
  const todayIndex = nextDate.getDay();
  const daysUntil = (weekdayIndex - todayIndex + 7) % 7;
  nextDate.setDate(nextDate.getDate() + daysUntil);
  return getDateInputValue(nextDate);
}

function detectAskSchedulingIntent(prompt) {
  const normalized = String(prompt || "").toLowerCase();

  if (/\b(remove|delete|cancel|take off)\b/.test(normalized)) {
    return "remove";
  }

  if (/\b(move|reschedule|change|shift)\b/.test(normalized)) {
    return "move";
  }

  if (/\b(when should i|what time should i|find time|best time)\b/.test(normalized)) {
    return "suggest-time";
  }

  if (/\b(add|schedule|put|create|remind me|plan)\b/.test(normalized)) {
    return "add";
  }

  return "";
}

function detectAskScheduleDate(prompt) {
  const normalized = String(prompt || "").toLowerCase();

  if (/\btomorrow\b/.test(normalized)) {
    return addDaysToDateValue(getDateInputValue(), 1);
  }

  const weekdayName = Object.keys(WEEKDAY_LOOKUP).find((day) =>
    new RegExp(`\\b${day}\\b`).test(normalized),
  );

  if (weekdayName) {
    return getNextWeekdayDateValue(WEEKDAY_LOOKUP[weekdayName]);
  }

  return getDateInputValue();
}

function detectAskScheduleTime(prompt, { routine = EMPTY_ROUTINE_DRAFT } = {}) {
  const normalized = String(prompt || "").toLowerCase();
  const explicitTimeMatch = normalized.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)\b/i);

  if (explicitTimeMatch) {
    return minutesToTimeValue(parseLooseTimeToMinutes(explicitTimeMatch[0]));
  }

  const looseAtTimeMatch = normalized.match(/\b(?:at|around)\s+(\d{1,2})(?::(\d{2}))?\b/i);

  if (looseAtTimeMatch) {
    let hour = Number(looseAtTimeMatch[1]);
    const minute = Number(looseAtTimeMatch[2] || 0);

    if (/\bmorning\b/.test(normalized) && hour === 12) {
      hour = 0;
    } else if (!/\bmorning\b/.test(normalized) && hour > 0 && hour <= 7) {
      hour += 12;
    }

    return minutesToTimeValue(hour * 60 + minute);
  }

  if (/\b(after school)\b/.test(normalized)) {
    return "16:00";
  }

  if (/\b(before bed)\b/.test(normalized)) {
    const { bedMinutes } = getRoutineAwakeRange(routine);
    return minutesToTimeValue(Math.max(0, bedMinutes - 60));
  }

  if (/\b(morning)\b/.test(normalized)) {
    return "09:00";
  }

  if (/\b(afternoon)\b/.test(normalized)) {
    return "15:00";
  }

  if (/\b(evening|tonight)\b/.test(normalized)) {
    return "19:00";
  }

  return "";
}

function detectAskFrequency(prompt) {
  const normalized = String(prompt || "").toLowerCase();
  const weekdayName = Object.keys(WEEKDAY_LOOKUP).find((day) =>
    new RegExp(`\\bevery\\s+${day}\\b`).test(normalized),
  );

  if (weekdayName) {
    return `Every ${weekdayName.charAt(0).toUpperCase()}${weekdayName.slice(1)}`;
  }

  if (/\b(monday through friday|monday to friday|school days|school day)\b/.test(normalized)) {
    return "Weekdays";
  }

  if (/\b(every day|daily)\b/.test(normalized)) {
    return "Daily";
  }

    if (/\b(every weekday|weekdays|weekday)\b/.test(normalized)) {
    return "Weekdays";
  }

  if (/\b(every week|weekly)\b/.test(normalized)) {
    return "Weekly";
  }

  if (/\bevery\s+(morning|afternoon|evening|night)\b/.test(normalized)) {
    const [, period] = normalized.match(/\bevery\s+(morning|afternoon|evening|night)\b/) || [];
    return `Every ${period}`;
  }

  return "One time";
}

function getFrequencyLabel(frequency) {
  return frequency && frequency !== "One time" && frequency !== "Never" ? frequency : "";
}

function cleanAskTaskTitle(prompt) {
  let title = String(prompt || "").toLowerCase();

  ASK_SCHEDULING_FILLER_PHRASES.forEach((phrase) => {
    title = title.replace(new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "gi"), " ");
  });

  title = title
    .replace(/\b(today|tomorrow|tonight|morning|afternoon|evening|after school|before bed)\b/gi, " ")
    .replace(/\bevery\s+(day|weekday|week|morning|afternoon|evening|night|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi, " ")
    .replace(/\b(daily|weekly|weekdays|weekday)\b/gi, " ")
    .replace(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi, " ")
    .replace(/\b(?:at|around)\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?\b/gi, " ")
    .replace(/\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/gi, " ")
    .replace(/[?!.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(to|for|on)\s+/i, "")
    .replace(/\s+(to|for|on|at)$/i, "")
    .trim();

  if (!title) {
    return "";
  }

  return title
    .split(" ")
    .map((word) =>
      /^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/.test(word)
        ? word.toUpperCase()
        : word,
    )
    .join(" ");
}

function getCalendarTaskMatch(prompt, calendarTasks = []) {
  const cleanedTitle = cleanAskTaskTitle(prompt);
  const normalizedPrompt = String(prompt || "").toLowerCase();
  const searchText = cleanedTitle || normalizedPrompt;

  return calendarTasks.find((task) => {
    const taskTitle = String(task.title || "").toLowerCase();
    return taskTitle && (searchText.includes(taskTitle) || taskTitle.includes(searchText));
  }) || calendarTasks.find((task) => {
    const taskWords = String(task.title || "")
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3);
    return taskWords.length && taskWords.some((word) => normalizedPrompt.includes(word));
  });
}

function getRoutineAwakeRange(routine = EMPTY_ROUTINE_DRAFT) {
  const wakeMinutes = timeToMinutes(routine.wakeTime) ?? 7 * 60;
  let bedMinutes = timeToMinutes(routine.bedTime) ?? 22 * 60;

  if (bedMinutes <= wakeMinutes) {
    bedMinutes += 24 * 60;
  }

  return { wakeMinutes, bedMinutes };
}

function getTodayScheduleBlocks({
  routine = EMPTY_ROUTINE_DRAFT,
  homeworkItems = [],
  calendarTasks = [],
  dateValue = getDateInputValue(),
}) {
  const { wakeMinutes, bedMinutes } = getRoutineAwakeRange(routine);
  const routineBlocks = (routine.dailyActivities || [])
    .filter((activity) => activity.active !== false)
    .map((activity) => {
      const startMinutes = parseLooseTimeToMinutes(activity.usualTime);
      const duration = Number(activity.durationMinutes);

      if (startMinutes === null || !Number.isFinite(duration) || duration <= 0 || !activity.name) {
        return null;
      }

      const adjustedStart = startMinutes < wakeMinutes ? startMinutes + 24 * 60 : startMinutes;
      return {
        id: activity.id || makeId("routine-block"),
        source: "routine",
        title: activity.name,
        fixed: activity.fixed !== false,
        startMinutes: adjustedStart,
        endMinutes: adjustedStart + duration,
      };
    })
    .filter(Boolean);
  const taskBlocks = calendarTasks
    .filter((task) => !task.completed && task.scheduledDate === dateValue && task.scheduledTime)
    .map((task) => {
      const startMinutes = timeToMinutes(task.scheduledTime);
      if (startMinutes === null) {
        return null;
      }

      const adjustedStart = startMinutes < wakeMinutes ? startMinutes + 24 * 60 : startMinutes;
      return {
        id: task.id,
        source: "calendar",
        title: task.title,
        startMinutes: adjustedStart,
        endMinutes: adjustedStart + getCalendarItemDuration(task),
      };
    })
    .filter(Boolean);
  const planBlocks = homeworkItems
    .filter((item) => !item.completed && (item.scheduledDate || item.dueDate) === dateValue)
    .map((item, index) => {
      const explicitStart = timeToMinutes(item.scheduledTime);
      const startMinutes = explicitStart === null
        ? Math.min(bedMinutes - 30, wakeMinutes + 60 + index * 45)
        : explicitStart < wakeMinutes
          ? explicitStart + 24 * 60
          : explicitStart;

      return {
        id: item.id,
        source: "plan",
        title: item.title,
        startMinutes,
        endMinutes: Math.min(bedMinutes, startMinutes + getAssignmentDuration(item)),
      };
    });
  const busyBlocks = [...routineBlocks, ...taskBlocks, ...planBlocks]
    .map((block) => ({
      ...block,
      startMinutes: Math.max(wakeMinutes, block.startMinutes),
      endMinutes: Math.min(bedMinutes, block.endMinutes),
    }))
    .filter((block) => block.endMinutes > block.startMinutes)
    .sort((a, b) => a.startMinutes - b.startMinutes);
  const timelineBlocks = [];
  let cursor = wakeMinutes;

  busyBlocks.forEach((block) => {
    if (block.startMinutes > cursor) {
      timelineBlocks.push({
        id: `free-${cursor}-${block.startMinutes}`,
        source: "free",
        title: "Open time",
        startMinutes: cursor,
        endMinutes: block.startMinutes,
      });
    }

    timelineBlocks.push(block);
    cursor = Math.max(cursor, block.endMinutes);
  });

  if (cursor < bedMinutes) {
    timelineBlocks.push({
      id: `free-${cursor}-${bedMinutes}`,
      source: "free",
      title: "Open time",
      startMinutes: cursor,
      endMinutes: bedMinutes,
    });
  }

  const freeMinutes = timelineBlocks
    .filter((block) => block.source === "free")
    .reduce((total, block) => total + block.endMinutes - block.startMinutes, 0);

  return { wakeMinutes, bedMinutes, timelineBlocks, freeMinutes };
}

function getRemainingSchedule(schedule, date = new Date()) {
  const currentMinutesRaw = date.getHours() * 60 + date.getMinutes();
  const currentMinutes = currentMinutesRaw < schedule.wakeMinutes
    ? currentMinutesRaw + 24 * 60
    : currentMinutesRaw;
  const clippedStart = Math.max(schedule.wakeMinutes, Math.min(currentMinutes, schedule.bedMinutes));
  const timelineBlocks = schedule.timelineBlocks
    .map((block) => ({
      ...block,
      startMinutes: Math.max(block.startMinutes, clippedStart),
    }))
    .filter((block) => block.endMinutes > block.startMinutes);
  const freeMinutes = timelineBlocks
    .filter((block) => block.source === "free")
    .reduce((total, block) => total + block.endMinutes - block.startMinutes, 0);

  return {
    wakeMinutes: clippedStart,
    bedMinutes: schedule.bedMinutes,
    timelineBlocks,
    freeMinutes,
  };
}

function getFreeTimeQuestion(freeMinutes) {
  if (freeMinutes >= 240) {
    return "What do you want to make progress on today?";
  }

  if (freeMinutes >= 90) {
    return "What is one task worth finishing today?";
  }

  return "What can VIRELI help you fit in carefully?";
}

function getChartSegments(schedule) {
  const totalMinutes = Math.max(1, schedule.bedMinutes - schedule.wakeMinutes);
  return schedule.timelineBlocks.slice(0, 18).map((block) => ({
    id: block.id,
    source: block.source,
    title: block.title,
    width: Math.max(3, ((block.endMinutes - block.startMinutes) / totalMinutes) * 100),
  }));
}

function getFreeTimeWindows(schedule) {
  return schedule.timelineBlocks
    .filter((block) => block.source === "free" && block.endMinutes - block.startMinutes >= 15)
    .map((block) => ({
      ...block,
      label: `${formatTimeLabel(minutesToTimeValue(block.startMinutes))}-${formatTimeLabel(minutesToTimeValue(block.endMinutes))}`,
      durationLabel: formatDurationFromMinutes(block.endMinutes - block.startMinutes),
    }));
}

function getPreferredWorkloadMinutes(routine = EMPTY_ROUTINE_DRAFT) {
  const minutes = Number(routine.preferredDailyWorkloadMinutes);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 180;
}

function getScheduledWorkMinutes(homeworkItems = [], dateValue = getDateInputValue()) {
  return homeworkItems
    .filter((item) => !item.completed && (item.scheduledDate || item.dueDate) === dateValue)
    .reduce((total, item) => total + getAssignmentDuration(item), 0);
}

function getDayWorkloadLabel({ routine = EMPTY_ROUTINE_DRAFT, homeworkItems = [], calendarTasks = [], dateValue = getDateInputValue() }) {
  const schedule = getTodayScheduleBlocks({ routine, homeworkItems, calendarTasks, dateValue });
  const freeMinutes = getFreeTimeWindows(schedule).reduce((total, block) => total + block.endMinutes - block.startMinutes, 0);
  const workMinutes = getScheduledWorkMinutes(homeworkItems, dateValue);
  const limit = getPreferredWorkloadMinutes(routine);

  if (workMinutes > Math.min(freeMinutes, limit) + 30) {
    return "Overloaded";
  }
  if (workMinutes > limit * 0.85) {
    return "Busy";
  }
  if (workMinutes > limit * 0.45) {
    return "Comfortable";
  }
  return "Light";
}

function getAssignmentStatus(item, today = getDateInputValue()) {
  if (item.completed) {
    return "Completed";
  }
  if (item.dueDate && item.dueDate < today) {
    return "Overdue";
  }
  if (item.inProgress) {
    return "In Progress";
  }
  if (item.scheduledDate || item.scheduledTime) {
    return "Planned";
  }
  return "Not Started";
}

function getCalendarItemDuration(item) {
  if (item.allDay) {
    return 24 * 60;
  }
  const explicitDuration = Number(item.durationMinutes || item.estimatedMinutes);
  if (Number.isFinite(explicitDuration) && explicitDuration > 0) {
    return explicitDuration;
  }
  const start = timeToMinutes(item.scheduledTime);
  const end = timeToMinutes(item.endTime);
  if (start !== null && end !== null && end > start) {
    return end - start;
  }
  return item.itemType === "Event" ? 60 : 45;
}

function getCalendarTaskEndTime(task) {
  if (task.endTime) {
    return task.endTime;
  }
  const start = timeToMinutes(task.scheduledTime);
  if (start === null) {
    return "";
  }
  return minutesToTimeValue(start + getCalendarItemDuration(task));
}

function detectScheduleConflict(draft, { routine = EMPTY_ROUTINE_DRAFT, homeworkItems = [], calendarTasks = [], ignoreId = "" }) {
  const dateValue = draft.scheduledDate;
  const start = timeToMinutes(draft.scheduledTime);
  if (!dateValue || start === null || draft.allDay) {
    return null;
  }
  const end = start + getCalendarItemDuration(draft);
  const schedule = getTodayScheduleBlocks({
    routine,
    homeworkItems: homeworkItems.filter((item) => item.id !== ignoreId),
    calendarTasks: calendarTasks.filter((item) => item.id !== ignoreId),
    dateValue,
  });
  const conflict = schedule.timelineBlocks.find((block) =>
    block.source !== "free" && start < block.endMinutes && end > block.startMinutes,
  );

  if (!conflict) {
    return null;
  }

  return {
    title: conflict.title,
    source: conflict.source,
    message: `This overlaps with ${conflict.title}.`,
  };
}

function normalizeThought(entry = {}) {
  return {
    id: entry.id || makeId("thought"),
    text: String(entry.text || entry.thought || "").trim(),
    status: entry.status || "open",
    archived: Boolean(entry.archived),
    createdAt: entry.createdAt || new Date().toISOString(),
    updatedAt: entry.updatedAt || entry.createdAt || new Date().toISOString(),
  };
}

function loadThoughts() {
  return readPersistentArray(THOUGHT_STORAGE_KEY)
    .map(normalizeThought)
    .filter((thought) => thought.text)
    .slice(0, 40);
}

function getOpenThoughts(thoughts = []) {
  return thoughts.filter((thought) => !thought.archived && thought.status !== "handled");
}

function getChronologicalDayItems({ routine = EMPTY_ROUTINE_DRAFT, homeworkItems = [], calendarTasks = [], dateValue = getDateInputValue(), savedClasses = [] }) {
  const schedule = getTodayScheduleBlocks({ routine, homeworkItems, calendarTasks, dateValue });
  return schedule.timelineBlocks.map((block) => ({
    id: block.id,
    source: block.source,
    title: block.title,
    timeLabel: `${formatTimeLabel(minutesToTimeValue(block.startMinutes))} - ${formatTimeLabel(minutesToTimeValue(block.endMinutes))}`,
    durationLabel: formatDurationFromMinutes(block.endMinutes - block.startMinutes),
    subject: block.source === "plan"
      ? getAssignmentSubject(homeworkItems.find((item) => item.id === block.id) || {}, savedClasses)
      : "",
  }));
}

function getAssignmentSubject(item, classes = []) {
  return item.classLabel || (item.classId ? getClassLabel(classes, item.classId, "") : "") || "Assignment";
}

function getAssignmentDuration(item) {
  const minutes = Number(item.estimatedMinutes);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 45;
}

function estimateAssignmentMinutes(title = "", details = "") {
  const source = `${title} ${details}`.toLowerCase();

  if (/\b(project|presentation|research)\b/.test(source)) {
    return 120;
  }

  if (/\b(essay|draft|write|writing|paper)\b/.test(source)) {
    return 90;
  }

  if (/\b(read|chapter|chapters|novel|book)\b/.test(source)) {
    return 60;
  }

  if (/\b(study|test|quiz|review)\b/.test(source)) {
    return 50;
  }

  if (/\b(worksheet|problem|practice|homework)\b/.test(source)) {
    return 40;
  }

  return 45;
}

function getMoodAdjustedDuration(item, mood = "") {
  const base = getAssignmentDuration(item);

  if (mood === "bad") {
    return Math.min(base, 35);
  }

  return base;
}

function findBestFreeWindow(schedule, durationMinutes = 45) {
  const freeWindows = getFreeTimeWindows(schedule);
  return freeWindows.find((windowBlock) => windowBlock.endMinutes - windowBlock.startMinutes >= durationMinutes)
    || freeWindows[0]
    || null;
}

function getNextAssignmentRecommendation({
  homeworkItems = [],
  routine = EMPTY_ROUTINE_DRAFT,
  calendarTasks = [],
  mood = "",
  now = new Date(),
}) {
  const today = getDateInputValue(now);
  const schedule = getTodayScheduleBlocks({ routine, homeworkItems, calendarTasks, dateValue: today });
  const remainingSchedule = getRemainingSchedule(schedule, now);
  const activeItems = homeworkItems
    .filter((item) => !item.completed)
    .sort((a, b) => {
      const aDate = getItemCalendarDate(a) || "9999-12-31";
      const bDate = getItemCalendarDate(b) || "9999-12-31";
      return `${aDate} ${a.scheduledTime || ""}`.localeCompare(`${bDate} ${b.scheduledTime || ""}`);
    });
  const scheduledNow = activeItems.find((item) => {
    if ((item.scheduledDate || item.dueDate) !== today || !item.scheduledTime) {
      return false;
    }

    const start = timeToMinutes(item.scheduledTime);
    if (start === null) {
      return false;
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return currentMinutes >= start && currentMinutes <= start + getAssignmentDuration(item);
  });
  const nextItem = scheduledNow || activeItems[0] || null;

  if (!nextItem) {
    return {
      item: null,
      schedule,
      remainingSchedule,
      freeWindows: getFreeTimeWindows(remainingSchedule),
      startTime: "",
      duration: 0,
    };
  }

  const duration = getMoodAdjustedDuration(nextItem, mood);
  const bestWindow = findBestFreeWindow(remainingSchedule, duration);
  const startTime = nextItem.scheduledTime || (bestWindow ? minutesToTimeValue(bestWindow.startMinutes) : "");

  return {
    item: nextItem,
    schedule,
    remainingSchedule,
    freeWindows: getFreeTimeWindows(remainingSchedule),
    startTime,
    duration,
  };
}

function getTodayProgress(homeworkItems = []) {
  const today = getDateInputValue();
  const todayItems = homeworkItems.filter((item) => (item.scheduledDate || item.dueDate) === today);
  const completed = todayItems.filter((item) => item.completed).length;

  return {
    total: todayItems.length,
    completed,
    remaining: Math.max(0, todayItems.length - completed),
    percent: todayItems.length ? Math.round((completed / todayItems.length) * 100) : 0,
  };
}

function getTimeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 18) {
    return "Good afternoon";
  }
  return "Good evening";
}

function getFirstName(profile = EMPTY_PROFILE) {
  return String(profile.name || "").trim().split(/\s+/)[0] || "there";
}

function getStarterTasks(primaryUse = "School") {
  const use = String(primaryUse || "School").toLowerCase();
  if (use === "work") {
    return ["Add one deadline", "Block a meeting", "Plan a focus session"];
  }
  if (use === "other") {
    return ["Add one task", "Block one routine", "Pick one thing for today"];
  }
  return ["Add one assignment", "Add your school day", "Plan a study block"];
}

function getTomorrowPreview({ homeworkItems = [], calendarTasks = [], routine = EMPTY_ROUTINE_DRAFT }) {
  const tomorrow = addDaysToDateValue(getDateInputValue(), 1);
  const schedule = getTodayScheduleBlocks({ routine, homeworkItems, calendarTasks, dateValue: tomorrow });
  const openItems = [
    ...homeworkItems.filter((item) => !item.completed && getItemCalendarDate(item) === tomorrow),
    ...calendarTasks.filter((task) => !task.completed && getItemCalendarDate(task) === tomorrow),
  ].slice(0, 3);
  return {
    dateValue: tomorrow,
    freeWindows: getFreeTimeWindows(schedule).slice(0, 2),
    items: openItems,
  };
}

function getUpcomingDeadlines(homeworkItems = []) {
  const today = getDateInputValue();
  return homeworkItems
    .filter((item) => !item.completed && item.dueDate && item.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);
}

function getWorkloadWarnings(homeworkItems = [], routine = EMPTY_ROUTINE_DRAFT, calendarTasks = []) {
  const warnings = [];
  const today = getDateInputValue();

  for (let offset = 0; offset <= 7; offset += 1) {
    const dateValue = addDaysToDateValue(today, offset);
    const schedule = getTodayScheduleBlocks({ routine, homeworkItems, calendarTasks, dateValue });
    const freeMinutes = getFreeTimeWindows(schedule).reduce(
      (total, block) => total + block.endMinutes - block.startMinutes,
      0,
    );
    const workload = homeworkItems
      .filter((item) => !item.completed && (item.scheduledDate || item.dueDate) === dateValue)
      .reduce((total, item) => total + getAssignmentDuration(item), 0);

    if (workload > freeMinutes + 30) {
      warnings.push({
        dateValue,
        message: `${formatShortDate(dateValue)} is overloaded by about ${formatDurationFromMinutes(workload - freeMinutes)}.`,
      });
    }
  }

  return warnings.slice(0, 2);
}

function getMissedAssignments(homeworkItems = [], now = new Date()) {
  const today = getDateInputValue(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return homeworkItems
    .filter((item) => {
      if (item.completed || item.notificationDismissedDate === today || item.scheduledDate !== today || !item.scheduledTime) {
        return false;
      }

      const start = timeToMinutes(item.scheduledTime);
      return start !== null && start + getAssignmentDuration(item) < currentMinutes;
    })
    .slice(0, 3);
}

function getItemCalendarDate(item) {
  return item.scheduledDate || item.dueDate || "";
}

function getUpcomingWeekItem({ homeworkItems = [], calendarTasks = [] }) {
  const today = getDateInputValue();
  const weekEnd = addDaysToDateValue(today, 7);
  const upcomingItems = [
    ...homeworkItems.map((item) => ({
      title: item.title,
      date: getItemCalendarDate(item),
      time: item.scheduledTime || item.dueTime || "",
      completed: item.completed,
    })),
    ...calendarTasks.map((task) => ({
      title: task.title,
      date: getItemCalendarDate(task),
      time: task.scheduledTime || task.dueTime || "",
      completed: task.completed,
    })),
  ]
    .filter((item) => item.title && item.date && !item.completed && item.date >= today && item.date <= weekEnd)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  if (!upcomingItems.length) {
    return {
      label: "Next 7 days",
      detail: "Nothing coming up",
    };
  }

  const nextItem = upcomingItems[0];
  return {
    label: "Next 7 days",
    detail: `Next: ${nextItem.title} - ${formatShortDate(nextItem.date)}`,
  };
}

function getActivePlanNotifications(homeworkItems = [], today = getDateInputValue()) {
  return homeworkItems
    .filter((item) => !item.completed && item.notificationDismissedDate !== today)
    .slice(0, 4);
}

function getTodayActivitySummary(schedule, date = new Date()) {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const adjustedCurrentMinutes = currentMinutes < schedule.wakeMinutes
    ? currentMinutes + 24 * 60
    : currentMinutes;
  const currentBlock = schedule.timelineBlocks.find(
    (block) =>
      adjustedCurrentMinutes >= block.startMinutes &&
      adjustedCurrentMinutes < block.endMinutes,
  );
  const nextBlock = schedule.timelineBlocks.find(
    (block) => block.startMinutes > adjustedCurrentMinutes && block.source !== "free",
  );

  if (currentBlock && currentBlock.source !== "free") {
    return {
      label: "Now",
      detail: `${currentBlock.title} until ${formatTimeLabel(minutesToTimeValue(currentBlock.endMinutes))}`,
    };
  }

  if (nextBlock) {
    return {
      label: "Next",
      detail: `${nextBlock.title} at ${formatTimeLabel(minutesToTimeValue(nextBlock.startMinutes))}`,
    };
  }

  return {
    label: "Today",
    detail: `${formatDurationFromMinutes(schedule.freeMinutes)} free`,
  };
}

function getIntelligentStatus({ routine = EMPTY_ROUTINE_DRAFT, homeworkItems = [], calendarTasks = [], savedClasses = [] }) {
  const now = new Date();
  const today = getDateInputValue(now);
  const schedule = getRemainingSchedule(getTodayScheduleBlocks({ routine, homeworkItems, calendarTasks, dateValue: today }), now);
  const freeWindows = getFreeTimeWindows(schedule).slice(0, 4);
  const openTasks = homeworkItems.filter((item) => !item.completed);
  const missed = getMissedAssignments(homeworkItems, now);
  const conflicts = calendarTasks
    .filter((task) => task.scheduledDate === today && !task.completed)
    .filter((task) => detectScheduleConflict(task, { routine, homeworkItems, calendarTasks: calendarTasks.filter((item) => item.id !== task.id) }));
  const nextCalendarItem = getChronologicalDayItems({ routine, homeworkItems, calendarTasks, dateValue: today, savedClasses })
    .find((item) => item.source !== "free" && parseLooseTimeToMinutes(item.timeLabel) !== null);

  if (conflicts.length) {
    return {
      label: `${conflicts.length} conflict${conflicts.length === 1 ? "" : "s"}`,
      detail: "Calendar conflict needs attention.",
      freeWindows,
    };
  }
  if (missed.length) {
    return {
      label: `${missed.length} missed`,
      detail: "A work session needs rescheduling.",
      freeWindows,
    };
  }
  if (freeWindows[0]) {
    return {
      label: `Free until ${formatTimeLabel(minutesToTimeValue(freeWindows[0].endMinutes))}`,
      detail: `${freeWindows[0].durationLabel} open right now.`,
      freeWindows,
    };
  }
  if (nextCalendarItem) {
    return {
      label: `Next: ${nextCalendarItem.title}`,
      detail: nextCalendarItem.timeLabel,
      freeWindows,
    };
  }
  return {
    label: `${openTasks.length} task${openTasks.length === 1 ? "" : "s"} left`,
    detail: openTasks.length ? "Open tasks are waiting in Calendar." : "Your day is open.",
    freeWindows,
  };
}

function getNotifications({ routine = EMPTY_ROUTINE_DRAFT, homeworkItems = [], calendarTasks = [] }) {
  const today = getDateInputValue();
  const notifications = [];
  getMissedAssignments(homeworkItems).forEach((item) => {
    notifications.push({
      id: `missed-${item.id}`,
      title: "Missed work",
      message: `${item.title} needs a new time.`,
    });
  });
  homeworkItems
    .filter((item) => !item.completed && isWithinNextDays(item.dueDate, 2))
    .slice(0, 3)
    .forEach((item) => {
      notifications.push({
        id: `due-${item.id}`,
        title: "Deadline soon",
        message: `${item.title} is due ${formatShortDate(item.dueDate)}.`,
      });
    });
  calendarTasks
    .filter((task) => task.scheduledDate === today && !task.completed)
    .filter((task) => detectScheduleConflict(task, { routine, homeworkItems, calendarTasks: calendarTasks.filter((item) => item.id !== task.id) }))
    .slice(0, 2)
    .forEach((task) => {
      notifications.push({
        id: `conflict-${task.id}`,
        title: "Schedule conflict",
        message: `${task.title} overlaps another block.`,
      });
    });
  return notifications.slice(0, 6);
}

function isDueBeforeToday(item, today = getDateInputValue()) {
  return Boolean(item.dueDate && item.dueDate < today && !item.completed);
}

function isDueToday(item, today = getDateInputValue()) {
  return Boolean(item.dueDate && item.dueDate === today && !item.completed);
}

function isUpcomingHomework(item, today = getDateInputValue()) {
  return Boolean(!item.completed && (!item.dueDate || item.dueDate > today));
}

function isWithinNextDays(dateValue, days, today = getDateInputValue()) {
  if (!dateValue) {
    return false;
  }

  return dateValue >= today && dateValue <= addDaysToDateValue(today, days);
}

function hasMissedScheduledWork(item, now = new Date()) {
  if (item.completed || !item.scheduledDate || !item.scheduledTime) {
    return false;
  }

  const scheduledAt = new Date(`${item.scheduledDate}T${item.scheduledTime}`);
  return !Number.isNaN(scheduledAt.getTime()) && scheduledAt < now;
}

function getHomeworkSummaryMeta(item) {
  return [
    item.scheduledDate || item.scheduledTime
      ? `${formatShortDate(item.scheduledDate)}${item.scheduledTime ? `, ${formatTimeLabel(item.scheduledTime)}` : ""}`
      : item.dueDate
        ? `Saved for ${formatShortDate(item.dueDate)}`
        : "No date",
    getFrequencyLabel(item.frequency),
  ]
    .filter(Boolean)
    .join(" · ");
}

function getPlanSummaryMeta(item) {
  return [
    item.scheduledDate ? formatShortDate(item.scheduledDate) : item.dueDate ? formatShortDate(item.dueDate) : "No date",
    item.scheduledTime ? formatTimeLabel(item.scheduledTime) : "",
    getFrequencyLabel(item.frequency),
  ]
    .filter(Boolean)
    .join(" · ");
}

function createHomeworkSteps(title, details = "") {
  const source = `${title} ${details}`.toLowerCase();

  if (source.includes("essay") || source.includes("write")) {
    return ["Read the prompt", "Make a short outline", "Write one section", "Check your answer"];
  }

  if (source.includes("test") || source.includes("quiz") || source.includes("study")) {
    return ["List the topics", "Review notes", "Practice a few questions", "Mark what still feels confusing"];
  }

  return ["Open the assignment", "Do the first small part", "Check directions", "Submit or pack it"];
}

function getPlanTodayLead(timeMode, mood) {
  const daytime = timeMode === "day";

  if (mood === "bad" || mood === "overwhelmed") {
    return daytime
      ? "Keep the plan small, clear, and kind enough to actually begin."
      : "Let the day land softly before choosing what still needs care.";
  }

  if (mood === "good") {
    return daytime
      ? "Use the lift gently, with enough space for the day to stay breathable."
      : "Notice what worked today without turning it into pressure for tomorrow.";
  }

  return daytime
    ? "Shape the next few hours around one honest priority and one reset."
    : "Look back with enough softness to learn from the day without judging it.";
}

function getMsUntilNextTimeModeBoundary(date = new Date()) {
  const nextBoundary = new Date(date);
  const hour = date.getHours();
  const boundaryHour =
    hour >= DAY_MODE_START_HOUR && hour < REFLECTION_MODE_START_HOUR
      ? REFLECTION_MODE_START_HOUR
      : DAY_MODE_START_HOUR;

  nextBoundary.setHours(boundaryHour, 0, 0, 0);

  if (nextBoundary <= date) {
    nextBoundary.setDate(nextBoundary.getDate() + 1);
  }

  return nextBoundary.getTime() - date.getTime();
}

function hashText(text) {
  return Array.from(text).reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
    7,
  );
}

function pickVariant(options, seed) {
  return options[Math.abs(seed) % options.length];
}

const MOOD_NOTE_SAFETY_PATTERNS = [
  /\bkill myself\b/i,
  /\bwant to die\b/i,
  /\bdon't want to live\b/i,
  /\bdont want to live\b/i,
  /\bend my life\b/i,
  /\bend it all\b/i,
  /\bbetter off dead\b/i,
  /\bsuicid(?:e|al)\b/i,
  /\bhurt myself\b/i,
  /\bself[- ]?harm\b/i,
  /\boverdos(?:e|ing)\b/i,
  /\bcan't stay safe\b/i,
  /\bcant stay safe\b/i,
  /\bnot safe\b/i,
  /\bno reason to live\b/i,
];

const MOOD_NOTE_VAGUE_PATTERNS = [
  "idk",
  "i don't know",
  "i dont know",
  "dont know",
  "don't know",
  "meh",
  "ugh",
  "just stuff",
  "a lot",
  "everything",
  "nothing",
  "life",
  "just life",
  "stuff",
];

const MOOD_NOTE_TOPICS = [
  {
    id: "school",
    pileLabel: "school",
    patterns: [
      "school",
      "homework",
      "hw",
      "class",
      "classes",
      "classwork",
      "study",
      "studying",
      "grades",
      "grade",
      "exam",
      "exams",
      "test",
      "tests",
      "quiz",
      "quizzes",
      "deadline",
      "deadlines",
      "assignment",
      "assignments",
      "teacher",
      "teachers",
      "professor",
      "professors",
      "project",
      "projects",
      "paper",
      "essay",
      "final",
      "finals",
      "semester",
      "college",
      "campus",
    ],
    replies: {
      positive: "Getting through school stuff can feel really relieving.",
      neutral: "School can sit with you even on an okay day.",
      hard: "School pressure can take up a lot of room.",
    },
    mixed: "It makes sense for school to feel relieving and stressful at once.",
  },
  {
    id: "friends",
    pileLabel: "people stuff",
    patterns: [
      "friend",
      "friends",
      "friendship",
      "roommate",
      "roommates",
      "boyfriend",
      "girlfriend",
      "partner",
      "relationship",
      "relationships",
      "dating",
      "breakup",
      "left out",
      "ignored",
      "lonely",
      "alone",
      "social",
      "group chat",
      "friend group",
    ],
    replies: {
      positive: "Feeling steadier with people around you can shift a whole day.",
      neutral: "People stuff can stay in the background even on an okay day.",
      hard: "Stuff with people can hurt more than it looks.",
    },
    mixed: "It makes sense for people stuff to feel complicated all at once.",
  },
  {
    id: "family",
    pileLabel: "home pressure",
    patterns: [
      "mom",
      "dad",
      "mother",
      "father",
      "parent",
      "parents",
      "family",
      "sister",
      "brother",
      "home",
      "house",
      "household",
      "cousin",
      "aunt",
      "uncle",
    ],
    replies: {
      positive: "A steadier moment at home can mean a lot.",
      neutral: "Home stuff can stay with you quietly.",
      hard: "Home and family pressure can follow you everywhere.",
    },
    mixed: "It makes sense for home stuff to bring more than one feeling with it.",
  },
  {
    id: "rest",
    pileLabel: "being tired",
    patterns: [
      "tired",
      "exhausted",
      "drained",
      "sleep",
      "sleepy",
      "burnout",
      "burned out",
      "burnt out",
      "low energy",
      "no energy",
      "fatigue",
      "fatigued",
      "insomnia",
      "rested",
      "rest",
      "nap",
    ],
    replies: {
      positive: "Getting some rest can change the whole feel of a day.",
      neutral: "Low energy can sit underneath everything else.",
      hard: "Being this tired can make everything feel heavier.",
    },
    mixed: "It makes sense for your energy to feel uneven right now.",
  },
  {
    id: "motivation",
    pileLabel: "feeling stuck",
    patterns: [
      "stuck",
      "motivation",
      "motivated",
      "unmotivated",
      "focus",
      "focused",
      "distracted",
      "procrastinating",
      "procrastination",
      "avoid",
      "avoiding",
      "can't start",
      "cant start",
      "can't focus",
      "cant focus",
      "lazy",
      "behind",
    ],
    replies: {
      positive: "Even a small start can feel big when you've felt stuck.",
      neutral: "Feeling off can make it hard to get started.",
      hard: "Feeling stuck can make even small things feel big.",
    },
    mixed: "It makes sense to feel pulled both ways when starting feels hard.",
  },
  {
    id: "pressure",
    pileLabel: "everything on your plate",
    patterns: [
      "stress",
      "stressed",
      "pressure",
      "pressured",
      "too much",
      "busy",
      "swamped",
      "workload",
      "packed",
      "schedule",
      "tomorrow",
      "future",
      "so much",
      "cant keep up",
      "can't keep up",
      "falling behind",
    ],
    replies: {
      positive:
        "A little breathing room can feel huge when a lot has been hanging over you.",
      neutral: "When a lot is sitting in the background, the day can feel noisy.",
      hard: "When a lot is piling up, it can feel really loud.",
    },
    mixed: "It makes sense for pressure to muddy a better moment.",
  },
  {
    id: "health",
    pileLabel: "health stuff",
    patterns: [
      "sick",
      "ill",
      "pain",
      "hurt",
      "body",
      "headache",
      "migraine",
      "period",
      "cramps",
      "doctor",
      "health",
      "eating",
      "food",
      "weight",
      "body image",
      "medicine",
      "medication",
    ],
    replies: {
      positive: "Any bit of relief in your body can feel big.",
      neutral: "Body and health stuff can quietly shape the whole day.",
      hard: "Body and health stress can drain a lot out of you.",
    },
    mixed: "It makes sense for body and health stuff to feel complicated.",
  },
  {
    id: "self",
    pileLabel: "self-pressure",
    patterns: [
      "confidence",
      "confident",
      "insecure",
      "insecurity",
      "self worth",
      "worthless",
      "ugly",
      "failure",
      "failing",
      "self esteem",
      "hate myself",
      "not enough",
      "identity",
      "who i am",
      "embarrassed",
      "ashamed",
      "guilty",
      "guilt",
    ],
    replies: {
      positive: "Feeling a little steadier with yourself matters.",
      neutral: "The way you're carrying this with yourself still matters.",
      hard: "That kind of self-pressure can wear you down.",
    },
    mixed: "It makes sense to feel split when self-pressure is in the room.",
  },
  {
    id: "work_money",
    pileLabel: "work or money pressure",
    patterns: [
      "shift",
      "job",
      "boss",
      "coworker",
      "money",
      "broke",
      "rent",
      "paycheck",
      "paid",
      "tuition",
      "financial",
      "finances",
      "bill",
      "bills",
    ],
    replies: {
      positive: "Getting through work or money stress can bring real relief.",
      neutral: "Work or money pressure can sit with you even on an okay day.",
      hard: "Work or money pressure can feel nonstop.",
    },
    mixed: "It makes sense for work or money stress to keep tugging at you.",
  },
];

const MOOD_NOTE_TONES = [
  {
    id: "positive",
    patterns: [
      "good",
      "happy",
      "better",
      "lighter",
      "excited",
      "great",
      "nice",
      "fun",
      "smile",
      "smiling",
      /\bwent well\b/i,
      /\bgoing well\b/i,
      "enjoy",
      "enjoying",
      "love",
      "loved",
      "hopeful",
    ],
  },
  {
    id: "relieved",
    patterns: [
      "relieved",
      "finally",
      "worked out",
      "got through",
      "finished",
      "done",
      "over with",
      "made it through",
    ],
  },
  {
    id: "proud",
    patterns: [
      "proud",
      "accomplished",
      "achievement",
      "did it",
      "made it",
      "pulled it off",
    ],
  },
  {
    id: "calm",
    patterns: [
      "calm",
      "peaceful",
      "steady",
      "settled",
      "fine now",
      "okay now",
      "rested",
    ],
  },
  {
    id: "unsure",
    patterns: [
      "idk",
      "i don't know",
      "i dont know",
      "dont know",
      "don't know",
      "not sure",
      "meh",
      "whatever",
      "i guess",
      "kind of",
      "sort of",
      "just off",
      /\bfeel off\b/i,
      /\boff today\b/i,
      "weird",
    ],
  },
  {
    id: "tired",
    patterns: [
      "tired",
      "exhausted",
      "drained",
      "sleepy",
      "worn out",
      "burned out",
      "burnt out",
      "fatigued",
      "no energy",
      "low energy",
    ],
  },
  {
    id: "stressed",
    patterns: [
      "stress",
      "stressed",
      "pressure",
      "anxious",
      "anxiety",
      "panic",
      "panicked",
      "nervous",
      "tense",
      "a lot on me",
      "too much on me",
      "on my plate",
    ],
  },
  {
    id: "sad",
    patterns: [
      "bad",
      "sad",
      "down",
      "low",
      "empty",
      "cry",
      "crying",
      "depressed",
      "miserable",
      "rough",
      "hard",
      "heavy",
    ],
  },
  {
    id: "hurt",
    patterns: [
      "hurt",
      "rejected",
      "betrayed",
      "heartbroken",
      "disappointed",
      "let down",
    ],
  },
  {
    id: "angry",
    patterns: ["angry", "mad", "pissed", "furious", "heated"],
  },
  {
    id: "lonely",
    patterns: ["lonely", "alone", "isolated", "left out", "ignored"],
  },
  {
    id: "overwhelmed",
    patterns: [
      "overwhelmed",
      "too much",
      "can't keep up",
      "cant keep up",
      "drowning",
      "swamped",
      "so much",
    ],
  },
  {
    id: "frustrated",
    patterns: ["frustrated", "annoyed", "irritated", "fed up", "ugh"],
  },
  {
    id: "scared",
    patterns: ["scared", "afraid", "worried", "fear", "terrified", "freaked out"],
  },
  {
    id: "discouraged",
    patterns: [
      "hopeless",
      "discouraged",
      "defeated",
      "giving up",
      "can't do this",
      "cant do this",
      "stuck",
    ],
  },
];

const POSITIVE_TONE_IDS = ["positive", "relieved", "proud", "calm"];
const HARD_TONE_IDS = [
  "tired",
  "stressed",
  "sad",
  "hurt",
  "angry",
  "lonely",
  "overwhelmed",
  "frustrated",
  "scared",
  "discouraged",
];

function normalizeMoodNote(note) {
  return note.toLowerCase().replace(/[’]/g, "'").replace(/\s+/g, " ").trim();
}

function textMatchesPattern(text, pattern) {
  return pattern instanceof RegExp ? pattern.test(text) : text.includes(pattern);
}

function countPatternMatches(text, patterns) {
  return patterns.reduce(
    (count, pattern) => count + (textMatchesPattern(text, pattern) ? 1 : 0),
    0,
  );
}

function joinWithAnd(items) {
  if (items.length <= 1) {
    return items[0] || "";
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function analyzeMoodNote(note) {
  const normalized = normalizeMoodNote(note);
  const words = normalized.match(/[a-z0-9']+/g) || [];
  const toneScores = Object.fromEntries(
    MOOD_NOTE_TONES.map((tone) => [tone.id, countPatternMatches(normalized, tone.patterns)]),
  );
  const positiveScore = POSITIVE_TONE_IDS.reduce(
    (score, toneId) => score + (toneScores[toneId] || 0),
    0,
  );
  const hardScore = HARD_TONE_IDS.reduce(
    (score, toneId) => score + (toneScores[toneId] || 0),
    0,
  );
  const unsureScore = toneScores.unsure || 0;
  const hasContrastLanguage =
    normalized.includes(" but ") ||
    normalized.includes("though") ||
    normalized.includes("even though") ||
    normalized.includes("not really");
  const mixedSignals =
    positiveScore > 0 &&
    (hardScore > 0 || unsureScore > 0) &&
    (hasContrastLanguage || hardScore + positiveScore + unsureScore > 2);
  const topicMatches = MOOD_NOTE_TOPICS.map((topic) => ({
    ...topic,
    score: countPatternMatches(normalized, topic.patterns),
  }))
    .filter((topic) => topic.score > 0)
    .sort((a, b) => b.score - a.score);
  const dominantToneEntry = Object.entries(toneScores).sort((a, b) => b[1] - a[1])[0];
  const dominantTone =
    mixedSignals
      ? "mixed"
      : dominantToneEntry && dominantToneEntry[1] > 0
        ? dominantToneEntry[0]
        : normalized
          ? "neutral"
          : "empty";
  const isNonSubstantive = Boolean(normalized) && !/[a-z0-9]/i.test(normalized);
  const isVague =
    !isNonSubstantive &&
    (MOOD_NOTE_VAGUE_PATTERNS.includes(normalized) ||
      (words.length <= 3 && positiveScore === 0 && hardScore === 0 && topicMatches.length === 0));
  const intensityScore =
    countPatternMatches(normalized, [
      "really",
      "so ",
      "too much",
      "can't keep up",
      "cant keep up",
      "everything",
      "always",
      "never",
      "completely",
      "totally",
    ]) + hardScore;
  const sentimentGroup =
    mixedSignals
      ? "mixed"
      : positiveScore > hardScore && positiveScore > 0
        ? "positive"
        : hardScore > 0
          ? "hard"
          : isVague || unsureScore > 0
            ? "uncertain"
            : "neutral";

  return {
    normalized,
    wordCount: words.length,
    hasText: Boolean(normalized),
    isNonSubstantive,
    isVague,
    isVeryShort: words.length > 0 && words.length <= 2,
    isLong: words.length >= 28 || normalized.length >= 170,
    isSafetySensitive: MOOD_NOTE_SAFETY_PATTERNS.some((pattern) =>
      pattern.test(normalized),
    ),
    sentimentGroup,
    dominantTone,
    positiveScore,
    hardScore,
    topicMatches,
    primaryTopic: topicMatches[0] || null,
    intensity: intensityScore >= 3 || normalized.includes("right now") ? "high" : "low",
  };
}

function buildMoodAcknowledgement(analysis) {
  if (analysis.isNonSubstantive) {
    return "Even a small check-in still counts.";
  }

  if (analysis.isVague) {
    if (analysis.sentimentGroup === "hard" || analysis.dominantTone === "unsure") {
      return "It sounds hard to pin down right now.";
    }

    return "It does not have to be perfectly clear right now.";
  }

  if (analysis.sentimentGroup === "uncertain" && analysis.topicMatches.length === 0) {
    return analysis.isVeryShort
      ? "It sounds a little hard to name."
      : "It sounds like something feels a little off.";
  }

  if (analysis.dominantTone === "mixed") {
    if (analysis.primaryTopic?.mixed) {
      return analysis.primaryTopic.mixed;
    }

    return "It makes sense for more than one feeling to be here at once.";
  }

  if (analysis.topicMatches.length > 1) {
    const labels = analysis.topicMatches.slice(0, 2).map((topic) => topic.pileLabel);

    if (analysis.sentimentGroup === "positive") {
      return `It sounds like ${joinWithAnd(labels)} are both helping shape today.`;
    }

    return `It sounds like ${joinWithAnd(labels)} are both pressing on you.`;
  }

  if (analysis.primaryTopic) {
    const bucket =
      analysis.sentimentGroup === "positive"
        ? "positive"
        : analysis.sentimentGroup === "hard"
          ? "hard"
          : "neutral";

    return analysis.primaryTopic.replies[bucket];
  }

  if (analysis.sentimentGroup === "positive") {
    return analysis.isVeryShort
      ? "That sounds like a bright spot."
      : "That sounds like a real bright spot.";
  }

  if (analysis.dominantTone === "tired") {
    return "That kind of tired can color everything.";
  }

  if (analysis.isLong && analysis.sentimentGroup !== "positive") {
    return "It sounds like a lot has been piling up at once.";
  }

  if (analysis.sentimentGroup === "hard") {
    return analysis.intensity === "high"
      ? "That sounds like a lot to carry right now."
      : "That sounds heavy to sit with.";
  }

  return analysis.isVeryShort
    ? "Even a few words can say a lot."
    : "That gives a real picture of how today feels.";
}

function buildMoodSupportLine(analysis, mood) {
  if (analysis.sentimentGroup === "positive") {
    return (
      {
        good: "You are allowed to let that be enough for today.",
        ok: "It is okay if that is one steady part of today.",
        bad: "Even one lighter thing can still count today.",
        overwhelmed: "One steady thing still matters when a lot is going on.",
      }[mood] || "It is okay to let that be one steady part of today."
    );
  }

  if (analysis.isVague || analysis.sentimentGroup === "uncertain") {
    return (
      {
        good: "You do not have to explain it perfectly.",
        ok: "We do not need perfect words to keep this honest.",
        bad: "You do not need perfect words for this to count.",
        overwhelmed: "We can hold this one piece at a time.",
      }[mood] || "You do not need perfect words for this to count."
    );
  }

  if (analysis.dominantTone === "mixed") {
    return (
      {
        good: "You can let both feelings be true without forcing the day.",
        ok: "Both things can be true, and we can still keep it simple.",
        bad: "Both things can be true, and we can still keep today gentle.",
        overwhelmed:
          "Both things can be true, and we still do not need to solve all of it at once.",
      }[mood] || "Both things can be true at the same time."
    );
  }

  if (analysis.dominantTone === "tired") {
    if (mood === "good") {
      return "Try not to spend all of your energy at once.";
    }

    if (mood === "bad") {
      return "Rest still counts as part of getting through today.";
    }

    if (mood === "overwhelmed") {
      return "Rest still counts as part of the plan.";
    }

    return "Rest still counts as part of the day.";
  }

  if (
    analysis.dominantTone === "stressed" ||
    analysis.dominantTone === "overwhelmed" ||
    analysis.intensity === "high"
  ) {
    return (
      {
        good: "You do not have to solve the whole list right now.",
        ok: "We can keep the next step small from here.",
        bad: "We can let the next step be very small.",
        overwhelmed: "Let's not carry the whole thing at once.",
      }[mood] || "We can keep the next step small."
    );
  }

  if (analysis.dominantTone === "lonely" || analysis.dominantTone === "hurt") {
    return mood === "good"
      ? "Let yourself keep whatever feels supportive around you."
      : "You deserve softness around that.";
  }

  if (analysis.dominantTone === "scared") {
    return "Let's keep the next step close and simple.";
  }

  if (
    analysis.dominantTone === "angry" ||
    analysis.dominantTone === "frustrated"
  ) {
    return "We can keep today from getting any bigger than it needs to be.";
  }

  if (analysis.dominantTone === "discouraged") {
    return mood === "good"
      ? "A small win still matters."
      : "You do not have to be hard on yourself to keep moving.";
  }

  return (
    {
      good: "Let that stay light today.",
      ok: "We can keep things simple from here.",
      bad: "We can keep today small and gentle from here.",
      overwhelmed: "We can take this one small step at a time.",
    }[mood] || "We can keep things gentle from here."
  );
}

function formatDate() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function getPromptIntent(normalizedPrompt) {
  if (/(reflect|review|went|today was|felt|feel about|process)/i.test(normalizedPrompt)) {
    return "reflection";
  }

  if (/(stress|overwhelm|anx|panic|too much|pressure)/i.test(normalizedPrompt)) {
    return "grounding";
  }

  if (/(focus|distract|study|homework|start|procrastinat|stuck)/i.test(normalizedPrompt)) {
    return "focus";
  }

  if (/(plan|schedule|routine|organize|priorit|tomorrow|tonight)/i.test(normalizedPrompt)) {
    return "planning";
  }

  if (/(motivat|lazy|discouraged|accountab|keep going)/i.test(normalizedPrompt)) {
    return "motivation";
  }

  if (/(confused|unsure|don't know|dont know|idk|what should)/i.test(normalizedPrompt)) {
    return "uncertainty";
  }

  if (/(sleep|tired|exhaust|burned out|burnt out|rest)/i.test(normalizedPrompt)) {
    return "recovery";
  }

  return normalizedPrompt.split(" ").length <= 3 ? "uncertainty" : "next-step";
}

const STUDENT_SUPPORT_SIGNALS = [
  {
    id: "comparison",
    label: "comparison pressure",
    patterns: ["everyone else", "behind", "not enough", "compare", "comparison", "perfect", "popular", "likes", "views"],
    insight:
      "A lot of students get pulled into comparing their real life to everyone else's highlight reel, so I would not treat that feeling as proof that you are failing.",
    nextStep:
      "Try naming one thing that is actually in your control right now, then take a short break from the feed or pressure source before deciding what the feeling means.",
  },
  {
    id: "overload",
    label: "school overload",
    patterns: ["too much homework", "so much homework", "tests", "grades", "assignments", "missing work", "late work", "can't keep up", "cant keep up"],
    insight:
      "Students often describe school stress as a pileup: one assignment is manageable, but the stack starts to feel personal.",
    nextStep:
      "Separate the pile into urgent, important, and can-wait, then only start the smallest urgent piece.",
  },
  {
    id: "loneliness",
    label: "loneliness or feeling left out",
    patterns: ["alone", "lonely", "left out", "no friends", "ignored", "excluded", "nobody cares", "no one cares"],
    insight:
      "Feeling disconnected can make everything else louder, especially when school and social spaces overlap all day.",
    nextStep:
      "Choose one low-pressure connection: a text, sitting near someone safe, or asking one simple question instead of trying to fix the whole social picture.",
  },
  {
    id: "future",
    label: "future pressure",
    patterns: ["future", "college", "career", "life", "what if", "fail", "grades matter", "parents expect", "expectations"],
    insight:
      "Future pressure can make today's work feel like it decides your whole life, even when it is really one step in a longer path.",
    nextStep:
      "Bring the question back to today: what is one decision or task that gives future-you slightly more room?",
  },
  {
    id: "sleep",
    label: "sleep and burnout",
    patterns: ["sleep", "tired", "exhausted", "burned out", "burnt out", "can't sleep", "cant sleep", "drained"],
    insight:
      "When students are running on low sleep, problems can feel bigger and motivation can feel farther away.",
    nextStep:
      "Pick the easiest useful task first, set a short stopping point, and protect rest as part of the plan.",
  },
  {
    id: "body-image",
    label: "body image or self-worth pressure",
    patterns: ["body", "ugly", "weight", "look", "appearance", "skin", "face", "not pretty", "not attractive"],
    insight:
      "Social comparison can make body thoughts feel louder than they deserve to be.",
    nextStep:
      "Try moving attention from judging your body to caring for it: water, food, rest, movement, or stepping away from comparison content.",
  },
];

const HOMEWORK_CONCEPTS = [
  {
    subject: "Math",
    topic: "linear equations",
    patterns: ["linear", "slope", "y-intercept", "y intercept", "equation", "mx+b", "solve for x"],
    explain:
      "Linear equations describe a steady rate of change. The slope tells how fast the value changes, and the intercept tells where the line starts.",
    response:
      "Identify what the problem gives you, write the equation, isolate the variable step by step, and check by substituting your answer back in.",
  },
  {
    subject: "Math",
    topic: "fractions and ratios",
    patterns: ["fraction", "ratio", "proportion", "percent", "percentage", "decimal"],
    explain:
      "Fractions, ratios, percents, and decimals are different ways to compare parts to a whole or one amount to another.",
    response:
      "Convert everything into the same format first, simplify the relationship, then solve the missing value with multiplication or division.",
  },
  {
    subject: "Math",
    topic: "geometry",
    patterns: ["geometry", "angle", "triangle", "circle", "area", "perimeter", "volume", "surface area"],
    explain:
      "Geometry is about shapes, measurements, and the rules that connect sides, angles, area, and space.",
    response:
      "Draw the shape, label every known value, choose the matching formula, then solve one measurement at a time.",
  },
  {
    subject: "Language Arts",
    topic: "essay writing",
    patterns: ["essay", "paragraph", "thesis", "claim", "evidence", "analysis", "conclusion", "intro"],
    explain:
      "Strong writing usually moves from a clear claim to evidence, then explains why that evidence proves the point.",
    response:
      "Start with one sentence that says your main idea, add one quote or example, then explain the connection in your own words.",
  },
  {
    subject: "Language Arts",
    topic: "reading comprehension",
    patterns: ["theme", "main idea", "infer", "inference", "character", "summary", "symbol", "tone"],
    explain:
      "Reading comprehension means noticing what the text says directly and what it suggests through details, patterns, and character choices.",
    response:
      "Find two details from the text, ask what they show, then turn that into one clear answer with evidence.",
  },
  {
    subject: "Science",
    topic: "scientific method",
    patterns: ["hypothesis", "experiment", "variable", "control", "data", "claim evidence reasoning", "cer"],
    explain:
      "Science answers questions by testing ideas with evidence. Variables are what change, and controls help make the test fair.",
    response:
      "State the question, name the independent and dependent variables, then connect the data to your claim with reasoning.",
  },
  {
    subject: "Science",
    topic: "cells and life science",
    patterns: ["cell", "cells", "mitosis", "photosynthesis", "ecosystem", "organism", "dna", "body system"],
    explain:
      "Life science looks at how living things are built, how they use energy, and how their parts work together.",
    response:
      "Name the process or structure, explain its job, then connect it to how the organism survives or changes.",
  },
  {
    subject: "Science",
    topic: "physical science",
    patterns: ["force", "motion", "energy", "matter", "atom", "chemical", "reaction", "electricity", "waves"],
    explain:
      "Physical science studies matter and energy: what things are made of, how they move, and how they interact.",
    response:
      "List the known quantities, choose the rule or relationship, then explain the result using cause and effect.",
  },
  {
    subject: "Social Studies",
    topic: "history and cause-effect",
    patterns: ["history", "civilization", "revolution", "war", "government", "primary source", "cause", "effect"],
    explain:
      "Social studies often asks why events happened, who was affected, and how causes and consequences connect.",
    response:
      "Identify the time, place, people, and conflict, then answer with one cause, one effect, and one piece of evidence.",
  },
  {
    subject: "Social Studies",
    topic: "civics and geography",
    patterns: ["civics", "constitution", "rights", "map", "geography", "economy", "culture", "region"],
    explain:
      "Civics and geography connect people, places, rules, resources, and decisions.",
    response:
      "Define the key term, explain who or what it affects, then connect it to a real example or location.",
  },
  {
    subject: "Math",
    topic: "advanced math and data",
    patterns: ["trigonometry", "calculus", "precalculus", "statistics", "probability", "data analysis", "financial literacy", "integer", "pre-algebra"],
    explain:
      "Advanced math asks you to identify the rule, organize the information, and apply the right process carefully.",
    response:
      "Write what is given, name the formula or rule, solve one step at a time, and check if the answer makes sense.",
  },
  {
    subject: "English Language Arts",
    topic: "language, literature, and communication",
    patterns: ["phonics", "vocabulary", "grammar", "spelling", "creative writing", "research paper", "literary analysis", "public speaking", "debate", "poetry", "novel", "shakespeare", "argumentative", "technical writing", "media literacy"],
    explain:
      "Language Arts is about understanding words, building ideas, and communicating clearly with evidence or detail.",
    response:
      "Find the main idea, choose strong details, organize them in order, then explain your thinking in simple sentences.",
  },
  {
    subject: "Science",
    topic: "earth, space, and engineering science",
    patterns: ["plants", "animals", "weather", "earth", "human body", "rocks", "minerals", "simple machines", "states of matter", "genetics", "ecosystems", "plate tectonics", "solar system", "chemistry", "physics", "anatomy", "environmental", "marine biology", "astronomy", "engineering", "biotechnology"],
    explain:
      "Science explains systems, patterns, and cause and effect in the natural and designed world.",
    response:
      "Name the system, describe the parts, explain how they interact, and support the answer with evidence or an example.",
  },
  {
    subject: "Social Studies",
    topic: "history, geography, government, and economics",
    patterns: ["ancient", "greece", "rome", "middle ages", "renaissance", "american revolution", "civil war", "world war", "cold war", "modern history", "continent", "country", "climate", "population", "natural resources", "human geography", "election", "citizenship", "civil rights", "economics", "personal finance"],
    explain:
      "Social Studies connects people, places, power, resources, and change over time.",
    response:
      "Identify who, where, and when, then explain one cause, one effect, and one piece of evidence.",
  },
  {
    subject: "Computer Science & Technology",
    topic: "digital skills and coding",
    patterns: ["typing", "digital citizenship", "internet safety", "google workspace", "microsoft office", "coding", "scratch", "python", "java", "javascript", "html", "css", "robotics", "artificial intelligence", "cybersecurity", "data science"],
    explain:
      "Computer Science and technology focus on using digital tools, solving problems with steps, and building safe habits online.",
    response:
      "Define the goal, break it into steps, test one part at a time, and fix errors by checking what changed.",
  },
  {
    subject: "Health",
    topic: "wellness and safety",
    patterns: ["nutrition", "exercise", "sleep", "mental health", "stress management", "growth", "disease prevention", "substance", "first aid", "healthy relationships"],
    explain:
      "Health is about choices and habits that support the body, mind, safety, and relationships.",
    response:
      "Name the health topic, explain why it matters, then give one safe action or prevention step.",
  },
  {
    subject: "Physical Education",
    topic: "movement and fitness",
    patterns: ["running", "team sports", "individual sports", "flexibility", "strength", "endurance", "coordination", "fitness testing"],
    explain:
      "Physical Education builds movement skills, fitness, teamwork, and body awareness.",
    response:
      "Identify the skill or fitness area, describe the goal, then choose one practice step that improves it safely.",
  },
  {
    subject: "Art",
    topic: "visual art and design",
    patterns: ["drawing", "painting", "sculpture", "photography", "graphic design", "color theory", "perspective", "art history", "digital art"],
    explain:
      "Art uses choices like line, color, shape, space, and style to communicate an idea.",
    response:
      "Name the element or technique, describe what it does, then connect it to the meaning or design of the work.",
  },
  {
    subject: "Music",
    topic: "music skills and theory",
    patterns: ["rhythm", "melody", "music theory", "instrument", "choir", "composition", "music history", "music technology"],
    explain:
      "Music combines sound, pattern, timing, expression, and history.",
    response:
      "Identify the musical element, explain how it affects the piece, then practice or describe one clear example.",
  },
  {
    subject: "Foreign Languages",
    topic: "language learning",
    patterns: ["spanish", "french", "german", "mandarin", "latin", "asl", "american sign language", "conversation", "listening", "culture"],
    explain:
      "Foreign language learning builds vocabulary, grammar, listening, speaking, reading, writing, and cultural understanding.",
    response:
      "Start with the key words, check the grammar pattern, then write or say one simple sentence using it.",
  },
  {
    subject: "Engineering & Career Education",
    topic: "career and technical skills",
    patterns: ["cad", "3d printing", "electronics", "woodworking", "manufacturing", "entrepreneurship", "business", "marketing", "accounting", "architecture", "automotive"],
    explain:
      "Career and technical classes connect planning, tools, materials, money, and real-world problem solving.",
    response:
      "Define the goal, list materials or constraints, make a plan, then test or explain the result.",
  },
  {
    subject: "Life Skills",
    topic: "practical problem solving",
    patterns: ["cooking", "budgeting", "taxes", "banking", "resume", "interview", "communication", "time management", "goal setting", "critical thinking", "problem solving"],
    explain:
      "Life skills help with everyday decisions, responsibilities, and communication.",
    response:
      "Name the task, break it into small steps, choose the next action, and check what information you still need.",
  },
  {
    subject: "Electives",
    topic: "special interests and creative classes",
    patterns: ["psychology", "sociology", "philosophy", "journalism", "yearbook", "film studies", "video production", "esports", "agriculture", "culinary", "fashion design"],
    explain:
      "Electives let you explore specialized topics, creative work, and real-world interests.",
    response:
      "Identify the main idea, connect it to a real example, then explain your answer with one clear detail.",
  },
];

function detectStudentSupportSignal(normalizedPrompt, promptAnalysis, seed) {
  const scoredSignals = STUDENT_SUPPORT_SIGNALS.map((signal) => ({
    ...signal,
    score: countPatternMatches(normalizedPrompt, signal.patterns),
  })).filter((signal) => signal.score > 0);

  if (scoredSignals.length) {
    return scoredSignals.sort((a, b) => b.score - a.score)[0];
  }

  if (promptAnalysis.dominantTone === "lonely") {
    return STUDENT_SUPPORT_SIGNALS.find((signal) => signal.id === "loneliness");
  }

  if (promptAnalysis.dominantTone === "tired") {
    return STUDENT_SUPPORT_SIGNALS.find((signal) => signal.id === "sleep");
  }

  if (promptAnalysis.dominantTone === "overwhelmed" || promptAnalysis.dominantTone === "stressed") {
    return STUDENT_SUPPORT_SIGNALS.find((signal) => signal.id === "overload");
  }

  return pickVariant(STUDENT_SUPPORT_SIGNALS, seed + 41);
}

function detectHomeworkConcept(normalizedPrompt) {
  const scoredConcepts = HOMEWORK_CONCEPTS.map((concept) => ({
    ...concept,
    score: countPatternMatches(normalizedPrompt, concept.patterns),
  })).filter((concept) => concept.score > 0);

  if (scoredConcepts.length) {
    return scoredConcepts.sort((a, b) => b.score - a.score)[0];
  }

  if (/(math|algebra|calculate|solve|equation|number)/i.test(normalizedPrompt)) {
    return HOMEWORK_CONCEPTS.find((concept) => concept.subject === "Math");
  }

  if (/(english|language arts|ela|read|write|book|story|text)/i.test(normalizedPrompt)) {
    return HOMEWORK_CONCEPTS.find((concept) => concept.subject === "Language Arts");
  }

  if (/(science|biology|chemistry|physics|lab)/i.test(normalizedPrompt)) {
    return HOMEWORK_CONCEPTS.find((concept) => concept.subject === "Science");
  }

  if (/(social studies|history|civics|geography)/i.test(normalizedPrompt)) {
    return HOMEWORK_CONCEPTS.find((concept) => concept.subject === "Social Studies");
  }

  return null;
}

function buildHomeworkPrompt({ classLabel, topic, title, details }) {
  return [classLabel, topic, title, details].filter(Boolean).join(" ");
}

function buildHomeworkGuidance({ classLabel, topic, title, details, attachmentName }) {
  const prompt = buildHomeworkPrompt({ classLabel, topic, title, details });
  const concept = detectHomeworkConcept(normalizeMoodNote(prompt));
  const subjectLine = classLabel || concept?.subject || "this subject";
  const topicLine = topic || concept?.topic || title || "the main idea";
  const explain =
    concept?.explain ||
    `This looks like ${subjectLine} work about ${topicLine}. Start by finding what the question is asking and what information you already have.`;
  const firstStep =
    concept?.response ||
    "Underline the task, list the given information, then try the smallest first step before checking your work.";
  const attachmentLine = attachmentName
    ? `I saved the attachment (${attachmentName}) as context, but I cannot scan images/files in this static version.`
    : "";

  return [
    `About: ${explain}`,
    `Steps: 1. Restate the question. 2. Use the key rule or evidence. 3. Write one clear answer. 4. Check it against the directions.`,
    firstStep,
    attachmentLine,
  ]
    .filter(Boolean)
    .join("\n");
}

function getConversationTitle(messages) {
  const firstUserMessage = messages.find((message) => message.role === "user");
  const fallback = messages[0]?.content || "Ask VIRELI chat";
  const title = firstUserMessage?.content || fallback;
  return title.length > 58 ? `${title.slice(0, 55)}...` : title;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function extractConversationFocus(prompt) {
  const words = prompt
    .replace(/[^\w\s']/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
  const pauseIndex = words.findIndex(
    (word, index) => index >= 4 && ["and", "but", "because", "when"].includes(word.toLowerCase()),
  );
  const focusWords = words.slice(0, pauseIndex > 0 ? pauseIndex : 8);
  return focusWords.join(" ");
}

function buildCoachReply(prompt, context = {}) {
  const trimmedPrompt = prompt.trim();
  const normalized = normalizeMoodNote(trimmedPrompt);
  const mood = context.mood || "ok";
  const timeMode = context.timeMode || getTimeOfDayMode();
  const responseType = context.responseType || "conversation";
  const promptAnalysis = analyzeMoodNote(trimmedPrompt);
  const moodAnalysis = analyzeMoodNote(context.moodNote || "");
  const intent = getPromptIntent(normalized);
  const seed = hashText(
    `${normalized}|${mood}|${timeMode}|${responseType}|${context.responseIndex || 0}|${context.recentUserPrompt || ""}|${context.recentAssistantResponse || ""}`,
  );
  const studentSignal = detectStudentSupportSignal(normalized, promptAnalysis, seed);
  const homeworkConcept = detectHomeworkConcept(normalized);
  const simplePrompt = trimmedPrompt.length > 120
    ? `${trimmedPrompt.slice(0, 117)}...`
    : trimmedPrompt;

  if (moodAnalysis.isSafetySensitive || promptAnalysis.isSafetySensitive) {
    return "If you might hurt yourself or you are not safe, call or text 988 now. If there is immediate danger, call 911. Tell a trusted adult near you too.";
  }

  const openings = {
    "mental-health": [
      "That sounds hard.",
      "That is a lot to carry.",
      "I am sorry that feels heavy.",
      "You deserve a calmer next minute.",
    ],
    homework: [
      "Here is the simple version.",
      "Let’s make the homework clearer.",
      "Start here.",
      "Use this as your first step.",
    ],
    conversation: [
      "Yeah, that makes sense.",
      "I get why that would stick with you.",
      "That sounds important.",
      "Tell me more about that.",
    ],
  };

  const intentSteps = {
    planning: "Pick one thing to do first. Then set a short timer and stop when that part is done.",
    reflection: "Name what happened, what felt hard, and one thing you want to do differently next time.",
    grounding: "Put both feet on the floor. Take one slow breath. Then choose the smallest next action.",
    focus: "Clear one distraction, open the assignment, and do the first tiny piece.",
    motivation: "Do two minutes only. Starting small is better than waiting to feel ready.",
    uncertainty: "Write what you know, what you do not know, and what question you need answered.",
    recovery: "Make the task smaller. Rest is part of the plan, not a reward after everything.",
    "next-step": "Choose one action you can do in the next ten minutes.",
  };

  const moodHint =
    mood === "bad" || mood === "overwhelmed" || promptAnalysis.sentimentGroup === "hard"
      ? "Keep the next step small."
      : mood === "good" || promptAnalysis.sentimentGroup === "positive"
        ? "Use the energy, but do not overload yourself."
        : timeMode === "night"
          ? "Keep it simple for tonight."
          : "Keep it clear for today.";

  const mentalHealthLine = studentSignal
    ? `${studentSignal.insight} ${studentSignal.nextStep}`
    : `${moodHint} Try one reset: drink water, unclench your shoulders, and write the next tiny step.`;

  const homeworkLine = homeworkConcept
    ? `${homeworkConcept.subject}: ${homeworkConcept.topic}. ${homeworkConcept.explain} ${homeworkConcept.response}`
    : `For "${simplePrompt}", first find what the question is asking. Then list the facts you have. Then try one example or one sentence.`;

  const conversationLine = pickVariant(
    [
      `For "${simplePrompt}", I would not make it bigger than it is. Say the clearest true sentence first, then decide what you need next.`,
      `The main thing is this: be honest about what happened, but do not punish yourself while you figure it out.`,
      `A good next move is to name the part that bothers you most. Once that is clear, the rest gets easier to talk through.`,
      `You do not need a perfect answer yet. Start with what feels true, then we can work from there.`,
    ],
    seed + 11,
  );

  const followUps = {
    "mental-health": [
      "If it keeps feeling too big, talk to a trusted adult today.",
      "Do the small reset first, then come back to the problem.",
      "You do not have to solve the whole feeling at once.",
    ],
    homework: [
      "Send the exact question if you want step-by-step help.",
      "Try the first step, then check where you get stuck.",
      "Do not skip the directions. They usually tell you what the answer needs.",
    ],
    conversation: [
      "What happened right before this?",
      "What part of it feels most true?",
      "What do you wish someone understood about it?",
    ],
  };

  const body =
    responseType === "mental-health"
      ? mentalHealthLine
      : responseType === "homework"
        ? homeworkLine
        : conversationLine;
  const closing = responseType === "conversation" && promptAnalysis.isVague
    ? "Give me one detail and I will respond to that."
    : pickVariant(followUps[responseType] || followUps.conversation, seed + 31);
  const response = [
    pickVariant(openings[responseType] || openings.conversation, seed),
    body,
    intentSteps[intent],
    closing,
  ]
    .filter(Boolean)
    .join(" ");

  if (
    context.recentAssistantResponse &&
    normalizePromptForMatch(context.recentAssistantResponse) === normalizePromptForMatch(response)
  ) {
    return [
      pickVariant(openings[responseType] || openings.conversation, seed + 7),
      body,
      pickVariant(Object.values(intentSteps), seed + 13),
      pickVariant(followUps[responseType] || followUps.conversation, seed + 19),
    ]
      .filter(Boolean)
      .join(" ");
  }

  return response;
}

function buildGraphPaths() {
  return Array.from({ length: 22 }, (_, index) => {
    const baseline = 110 + index * 30;
    const points = [];

    for (let x = -80; x <= 1680; x += 94) {
      const swing = Math.sin(x / 126 + index * 0.4) * (16 + (index % 5) * 2.5);
      const ripple = Math.cos(x / 58 - index * 0.28) * 10;
      const flutter = Math.sin(x / 22 + index * 0.9) * 4;
      const pulseZone = Math.floor((x + index * 46) / 188) % 6;
      const pulse =
        pulseZone === 2 ? -34 : pulseZone === 3 ? 16 : pulseZone === 4 ? -8 : 0;
      const y = baseline + swing + ripple + flutter + pulse;

      points.push([x, y]);
    }

    let d = `M ${points[0][0]} ${points[0][1]}`;

    for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
      const [previousX, previousY] = points[pointIndex - 1];
      const [currentX, currentY] = points[pointIndex];
      const controlX = (previousX + currentX) / 2;

      d += ` Q ${controlX} ${previousY} ${currentX} ${currentY}`;
    }

    const tone =
      index % 3 === 0
        ? "var(--graph-line-1)"
        : index % 3 === 1
          ? "var(--graph-line-2)"
          : "var(--graph-line-3)";

    return {
      d,
      stroke: tone,
      strokeWidth: index % 4 === 0 ? 1.7 : 1.1,
      opacity: index % 5 === 0 ? 0.78 : 0.48,
    };
  });
}

function BrandLockup({ compact = false }) {
  return html`
    <div className=${cx("brand-lockup", compact && "is-compact")}>
      <${VireliLogoMark} className="brand-mark" />
      <div className="brand-meta">
        <span className="brand-name">VIRELI</span>
        <span className="brand-subtitle">AI student planner</span>
      </div>
    </div>
  `;
}

function VireliLogoMark({ className = "", animated = false }) {
  return html`
    <div className=${cx("vireli-logo-mark", animated && "is-animated", className)} aria-label="VIRELI logo">
      <span className="vireli-logo-v">V</span>
      <span className="vireli-logo-orbit" aria-hidden="true"></span>
      <span className="vireli-logo-spark vireli-logo-spark-one" aria-hidden="true"></span>
      <span className="vireli-logo-spark vireli-logo-spark-two" aria-hidden="true"></span>
    </div>
  `;
}

function CircleBackdrop() {
  const circles = [
    {
      size: 420,
      top: "-8%",
      left: "-5%",
      blur: 8,
      x: 12,
      y: 24,
      scale: 1.06,
      duration: 18,
    },
    {
      size: 260,
      top: "14%",
      right: "8%",
      blur: 0,
      x: -10,
      y: 18,
      scale: 1.04,
      duration: 16,
    },
    {
      size: 360,
      bottom: "6%",
      left: "16%",
      blur: 10,
      x: 18,
      y: -14,
      scale: 1.08,
      duration: 21,
    },
    {
      size: 180,
      bottom: "18%",
      right: "16%",
      blur: 6,
      x: -12,
      y: -18,
      scale: 1.07,
      duration: 17,
    },
    {
      size: 120,
      top: "42%",
      left: "42%",
      blur: 0,
      x: 8,
      y: 12,
      scale: 1.04,
      duration: 13,
    },
    {
      size: 90,
      top: "68%",
      right: "34%",
      blur: 3,
      x: -6,
      y: 10,
      scale: 1.08,
      duration: 12,
    },
  ];

  return html`
    <div className="circle-backdrop" aria-hidden="true">
      ${circles.map(
        (circle, index) => html`
          <${motion.span}
            key=${`circle-${index}`}
            className="ambient-circle"
            style=${{
              width: `${circle.size}px`,
              height: `${circle.size}px`,
              top: circle.top,
              right: circle.right,
              bottom: circle.bottom,
              left: circle.left,
              background: `var(--circle-fill-${index + 1})`,
              filter: `blur(${circle.blur}px)`,
            }}
            animate=${{
              x: [0, circle.x, 0],
              y: [0, circle.y, 0],
              scale: [1, circle.scale, 1],
            }}
            transition=${{
              duration: circle.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        `,
      )}
    </div>
  `;
}

function GraphBackdrop() {
  const paths = useMemo(() => buildGraphPaths(), []);

  return html`
    <div className="graph-backdrop" aria-hidden="true">
      <div className="graph-vignette"></div>
      ${[0, 1, 2].map(
        (layer) => html`
          <${motion.div}
            key=${`layer-${layer}`}
            className=${cx("graph-layer", `graph-layer-${layer}`)}
            animate=${{
              x: [0, layer === 1 ? 16 : -16, 0],
              y: [0, layer === 2 ? -10 : 10, 0],
            }}
            transition=${{
              duration: 14 + layer * 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <svg
              className="graph-svg"
              viewBox="0 0 1600 900"
              preserveAspectRatio="none"
            >
              ${paths.map(
                (path, index) => html`
                  <${motion.path}
                    key=${`path-${layer}-${index}`}
                    d=${path.d}
                    fill="none"
                    stroke=${path.stroke}
                    strokeWidth=${path.strokeWidth}
                    strokeLinecap="round"
                    opacity=${path.opacity}
                    initial=${{ pathLength: 0.45, opacity: 0 }}
                    animate=${{
                      pathLength: [0.6, 1, 0.82],
                      opacity: [0.18, path.opacity, path.opacity * 0.86],
                    }}
                    transition=${{
                      duration: 10 + layer * 2 + index * 0.16,
                      delay: index * 0.06,
                      repeat: Infinity,
                      repeatType: "mirror",
                      ease: "easeInOut",
                    }}
                  />
                `,
              )}
            </svg>
          </${motion.div}>
        `,
      )}
    </div>
  `;
}

function OpeningScreen({ onGetStarted, onSignIn }) {
  return html`
    <${motion.section}
      className="intro-screen opening-screen min-h-screen relative flex items-center justify-center overflow-hidden px-6"
      initial=${{ opacity: 0 }}
      animate=${{ opacity: 1 }}
      exit=${{ opacity: 0 }}
      transition=${{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="intro-haze intro-haze-left"></div>
      <div className="intro-haze intro-haze-right"></div>
      <div className="intro-grid"></div>
      <div className="intro-title-shell opening-title-shell">
        <${motion.div}
          initial=${{
            opacity: 0,
            filter: "blur(16px)",
            scale: 0.92,
          }}
          animate=${{
            opacity: 1,
            filter: "blur(0px)",
            scale: 1,
          }}
          transition=${{
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <div className="opening-logo-shell">
            <${VireliLogoMark} animated=${true} />
          </div>
          <h1 className="intro-word opening-word font-display">Vireli</h1>
          <p className="intro-overline opening-overline">Your day, organized around you.</p>
          <p className="intro-promise">
            Plan less. Know what to do next.
          </p>
          <div className="opening-action-row">
            <button type="button" className="primary-button opening-primary" onClick=${onGetStarted}>
              Get Started
            </button>
            <button type="button" className="secondary-button opening-secondary" onClick=${onSignIn}>
              Sign In
            </button>
          </div>
        </${motion.div}>
        <${motion.div}
          className="opening-preview-card"
          initial=${{ opacity: 0, y: 18 }}
          animate=${{ opacity: 1, y: 0 }}
          transition=${{
            duration: 0.55,
            delay: 0.22,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <span>Right now</span>
          <strong>Biology review</strong>
          <small>4:15-4:45 PM</small>
        </${motion.div}>
      </div>
    </${motion.section}>
  `;
}

function SetupProgress({ step }) {
  return html`
    <div className="setup-progress" aria-label=${`Setup step ${step} of ${SETUP_STEPS.length}`}>
      ${SETUP_STEPS.map(
        (label, index) => html`
          <span
            key=${label}
            className=${cx("setup-progress-dot", index + 1 <= step && "is-active")}
            title=${label}
          ></span>
        `,
      )}
    </div>
  `;
}

function SetupAboutScreen({
  profileDraft,
  onProfileDraftChange,
  onContinue,
}) {
  const canContinue = Boolean(profileDraft.name.trim() && profileDraft.primaryUse);

  return html`
    <${motion.section}
      className="mood-screen min-h-screen relative flex items-center justify-center overflow-hidden px-5 py-8 sm:px-8"
      initial=${{ opacity: 0 }}
      animate=${{ opacity: 1 }}
      exit=${{ opacity: 0, scale: 0.985 }}
      transition=${{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <${GraphBackdrop} />
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-5">
        <${SetupProgress} step=${1} />
        <${motion.div}
          className="mood-panel setup-panel"
          initial=${{ opacity: 0, y: 28 }}
          animate=${{ opacity: 1, y: 0 }}
          transition=${{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mood-heading mood-heading-centered">
            <div className="mood-pulse-brand-mark font-display" aria-hidden="true">V</div>
            <p className="eyebrow">Setup 1 of 4 · About You</p>
            <h2 className="font-display">What should VIRELI call you?</h2>
            <p>Tell VIRELI what exists first. Then it can help decide what matters now.</p>
          </div>

          <div className="setup-form-stack">
            <label className="field-stack">
              <span>Name</span>
              <input
                className="planning-input"
                value=${profileDraft.name}
                onInput=${(event) => onProfileDraftChange("name", event.target.value)}
                placeholder="Your name"
                autoComplete="given-name"
              />
            </label>

            <div className="field-stack">
              <span>Primary use</span>
              <div className="setup-choice-grid">
                ${PRIMARY_USE_OPTIONS.map(
                  (option) => html`
                    <button
                      key=${option}
                      type="button"
                      className=${cx("mood-choice setup-choice", profileDraft.primaryUse === option && "is-selected")}
                      aria-pressed=${profileDraft.primaryUse === option}
                      onClick=${() => onProfileDraftChange("primaryUse", option)}
                    >
                      <span className="mood-choice-label">${option}</span>
                    </button>
                  `,
                )}
              </div>
            </div>
          </div>

          <div className="mood-control-row">
            <button type="button" className="primary-button" disabled=${!canContinue} onClick=${onContinue}>
              Continue
            </button>
          </div>
        </${motion.div}>
      </div>
    </${motion.section}>
  `;
}

function MoodCheckInScreen({
  moodSelection,
  moodNote,
  onMoodSelect,
  onMoodNoteChange,
  onMoodContinue,
  onMoodSkip,
}) {
  const showNote = moodSelection === "ok" || moodSelection === "bad";
  return html`
    <${motion.section}
      className="mood-screen min-h-screen relative flex items-center justify-center overflow-hidden px-5 py-8 sm:px-8"
      initial=${{ opacity: 0 }}
      animate=${{ opacity: 1 }}
      exit=${{ opacity: 0, scale: 0.985 }}
      transition=${{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <${GraphBackdrop} />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-5">
        <${SetupProgress} step=${2} />
        <${motion.div}
          className="mood-logo-wrap mood-logo-floating"
          initial=${{ opacity: 0, scale: 0.72, y: 18 }}
          animate=${{ opacity: 1, scale: 1, y: 0 }}
          transition=${{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <${VireliLogoMark} animated=${true} />
        </${motion.div}>
        <${motion.div}
          className="mood-panel mood-panel-centered"
          initial=${{ opacity: 0, y: 28 }}
          animate=${{ opacity: 1, y: 0 }}
          transition=${{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mood-heading mood-heading-centered">
            <div className="mood-pulse-brand-mark font-display" aria-hidden="true">V</div>
            <p className="eyebrow">Setup 2 of 4 · Mood pulse</p>
            <h2 className="font-display">How are you doing today?</h2>
            <p>Quick and optional. Mood helps VIRELI keep the schedule realistic.</p>
          </div>

          <div className="mood-grid mood-grid-centered">
            ${MOOD_OPTIONS.map(
              (option) => html`
                <button
                  key=${option.id}
                  type="button"
                  className=${cx(
                    "mood-choice",
                    moodSelection === option.id && "is-selected",
                  )}
                  onClick=${() => onMoodSelect(option.id)}
                >
                  <span className="mood-choice-label">${option.label}</span>
                  <span className="mood-choice-text">${option.text}</span>
                </button>
              `,
            )}
          </div>
          ${showNote
            ? html`
                <label className="field-stack mood-note-field">
                  <span>Optional note</span>
                  <textarea
                    className="bad-flow-input"
                    value=${moodNote}
                    onInput=${(event) => onMoodNoteChange(event.target.value)}
                    rows="3"
                    placeholder="Anything VIRELI should keep in mind?"
                  ></textarea>
                </label>
              `
            : null}
          <div className="mood-control-row mood-control-row-centered">
            <button type="button" className="secondary-button" onClick=${onMoodSkip}>Skip</button>
            <button type="button" className="primary-button" onClick=${onMoodContinue}>
              Continue
            </button>
          </div>
        </${motion.div}>
      </div>
    </${motion.section}>
  `;
}

function SetupScheduleBasicsScreen({
  routineDraft,
  onRoutineChange,
  onRoutineWorkloadSelect,
  onContinue,
}) {
  const canContinue = Boolean(routineDraft.wakeTime && routineDraft.bedTime && routineDraft.preferredDailyWorkloadMinutes);
  const previewRoutine = normalizeRoutineEntry(routineDraft);
  const schedule = getTodayScheduleBlocks({ routine: previewRoutine, homeworkItems: [], calendarTasks: [] });

  return html`
    <${motion.section}
      className="mood-screen min-h-screen relative flex items-center justify-center overflow-hidden px-5 py-8 sm:px-8"
      initial=${{ opacity: 0 }}
      animate=${{ opacity: 1 }}
      exit=${{ opacity: 0, scale: 0.985 }}
      transition=${{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <${GraphBackdrop} />
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-5">
        <${SetupProgress} step=${3} />
        <${motion.div}
          className="mood-panel routine-panel"
          initial=${{ opacity: 0, y: 28 }}
          animate=${{ opacity: 1, y: 0 }}
          transition=${{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mood-heading">
            <p className="eyebrow">Setup 3 of 4 · Schedule Basics</p>
            <h2 className="font-display">When is your day usable?</h2>
            <p>Wake time, sleep time, and workload limits keep VIRELI from overscheduling you.</p>
          </div>
          <div className="routine-form">
            <div className="routine-time-grid">
              <label className="field-stack">
                <span>Wake time</span>
                <input className="planning-input" type="time" value=${routineDraft.wakeTime} onInput=${(event) => onRoutineChange("wakeTime", event.target.value)} />
              </label>
              <label className="field-stack">
                <span>Sleep time</span>
                <input className="planning-input" type="time" value=${routineDraft.bedTime} onInput=${(event) => onRoutineChange("bedTime", event.target.value)} />
              </label>
            </div>
            <div className="field-stack">
              <span>Workload</span>
              <div className="workload-choice-grid">
                ${WORKLOAD_OPTIONS.map(
                  (option) => html`
                    <button
                      key=${option.id}
                      type="button"
                      className=${cx("choice-chip workload-choice", routineDraft.preferredWorkloadLabel === option.label && "is-selected")}
                      onClick=${() => onRoutineWorkloadSelect(option)}
                    >
                      ${option.label}
                    </button>
                  `,
                )}
              </div>
              ${routineDraft.preferredWorkloadLabel === "Custom"
                ? html`
                    <input
                      className="planning-input"
                      type="number"
                      min="15"
                      step="15"
                      inputMode="numeric"
                      value=${routineDraft.preferredDailyWorkloadMinutes}
                      onInput=${(event) => onRoutineChange("preferredDailyWorkloadMinutes", event.target.value)}
                      placeholder="Minutes"
                    />
                  `
                : null}
            </div>
            <div className="setup-timeline-preview">
              <span>${formatTimeLabel(minutesToTimeValue(schedule.wakeMinutes))}</span>
              <div className="day-chart-track">
                ${getChartSegments(schedule).map(
                  (segment) => html`<i key=${segment.id} className=${cx("day-chart-segment", `is-${segment.source}`)} style=${{ width: `${segment.width}%` }}></i>`,
                )}
              </div>
              <span>${formatTimeLabel(minutesToTimeValue(schedule.bedMinutes))}</span>
            </div>
          </div>
          <${AnimatePresence}>
            ${canContinue
              ? html`
                  <${motion.div} className="mood-control-row" initial=${{ opacity: 0, y: 10 }} animate=${{ opacity: 1, y: 0 }} exit=${{ opacity: 0, y: 8 }}>
                    <button type="button" className="primary-button" onClick=${onContinue}>Continue</button>
                  </${motion.div}>
                `
              : null}
          </${AnimatePresence}>
        </${motion.div}>
      </div>
    </${motion.section}>
  `;
}

function SetupRoutineBuilderScreen({
  routineDraft,
  onRoutineActivityChange,
  onRoutineActivityAdd,
  onRoutineActivityRemove,
  onSaveRoutine,
}) {
  const dailyActivities = (routineDraft.dailyActivities || []).length
    ? routineDraft.dailyActivities
    : [{ id: "activity-setup-empty", name: "", durationMinutes: "", usualTime: "", days: "Weekdays", fixed: true }];

  return html`
    <${motion.section}
      className="mood-screen min-h-screen relative flex items-center justify-center overflow-hidden px-5 py-8 sm:px-8"
      initial=${{ opacity: 0 }}
      animate=${{ opacity: 1 }}
      exit=${{ opacity: 0, scale: 0.985 }}
      transition=${{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <${GraphBackdrop} />
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-5">
        <${SetupProgress} step=${4} />
        <${motion.div}
          className="mood-panel routine-panel"
          initial=${{ opacity: 0, y: 28 }}
          animate=${{ opacity: 1, y: 0 }}
          transition=${{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mood-heading">
            <p className="eyebrow">Setup 4 of 4 · Your Routine</p>
            <h2 className="font-display">Add what already exists.</h2>
            <p>Start empty. Add only real commitments VIRELI should plan around.</p>
          </div>
          <div className="daily-activity-list routine-builder-list">
            ${dailyActivities.map(
              (activity, index) => html`
                <div key=${activity.id || `routine-activity-${index}`} className="routine-activity-row routine-builder-row">
                  <input className="planning-input" value=${activity.name} onInput=${(event) => onRoutineActivityChange(index, "name", event.target.value)} placeholder="School, practice, work..." />
                  <input className="planning-input" type="number" min="0" inputMode="numeric" value=${activity.durationMinutes} onInput=${(event) => onRoutineActivityChange(index, "durationMinutes", event.target.value)} placeholder="Minutes" />
                  <input className="planning-input" value=${activity.usualTime} onInput=${(event) => onRoutineActivityChange(index, "usualTime", event.target.value)} placeholder="Start time" />
                  <select className="planning-input" value=${activity.days || "Weekdays"} onChange=${(event) => onRoutineActivityChange(index, "days", event.target.value)}>
                    ${ROUTINE_DAY_OPTIONS.map((option) => html`<option key=${option} value=${option}>${option}</option>`)}
                  </select>
                  <select className="planning-input" value=${activity.fixed === false ? "Flexible" : "Fixed"} onChange=${(event) => onRoutineActivityChange(index, "fixed", event.target.value === "Fixed")}>
                    <option value="Fixed">Fixed</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                  <button type="button" className="secondary-button" onClick=${() => onRoutineActivityRemove(index)} disabled=${dailyActivities.length <= 1}>Remove</button>
                </div>
              `,
            )}
          </div>
          <div className="card-footer-row">
            <button type="button" className="secondary-button" onClick=${onRoutineActivityAdd} disabled=${dailyActivities.length >= 8}>Add routine</button>
            <button type="button" className="primary-button" onClick=${onSaveRoutine}>Go to Home</button>
          </div>
        </${motion.div}>
      </div>
    </${motion.section}>
  `;
}

function AccountScreen({
  profile,
  googleClientId,
  googleAuthStatus,
  googleAuthError,
  emailAuthStep,
  emailAuthEmail,
  emailAuthCode,
  emailAuthMode,
  emailAuthStatus,
  emailAuthError,
  emailAuthMessage,
  onEmailChange,
  onEmailContinue,
  onEmailCodeChange,
  onEmailCodeKeyDown,
  onEmailCodePaste,
  onEmailVerify,
  onEmailResend,
  onEmailUseDifferentEmail,
  onEmailModeChange,
  onContinueAsGuest,
}) {
  const googleButtonRef = useRef(null);
  const codeInputRefs = useRef([]);

  useEffect(() => {
    if (!googleClientId || !window.google?.accounts?.id || !googleButtonRef.current) {
      return;
    }

    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "signin_with",
      width: Math.min(460, googleButtonRef.current.clientWidth || 460),
    });
  }, [googleClientId, googleAuthStatus]);

  useEffect(() => {
    if (emailAuthStep === "code") {
      window.setTimeout(() => codeInputRefs.current[0]?.focus(), 80);
    }
  }, [emailAuthStep]);

  const isEmailBusy = emailAuthStatus === "sending" || emailAuthStatus === "verifying" || emailAuthStatus === "resending";
  const codeDigits = String(emailAuthCode || "").padEnd(EMAIL_AUTH_CODE_LENGTH, " ").slice(0, EMAIL_AUTH_CODE_LENGTH);
  const cleanCode = codeDigits.replace(/\D/g, "");

  return html`
    <${motion.section}
      className="account-screen min-h-screen relative flex items-center justify-center overflow-hidden px-5 py-8 sm:px-8"
      initial=${{ opacity: 0 }}
      animate=${{ opacity: 1 }}
      exit=${{ opacity: 0, scale: 0.985 }}
      transition=${{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center">
        <${motion.div}
          className="mood-panel profile-panel google-auth-panel"
          initial=${{ opacity: 0, y: 28 }}
          animate=${{ opacity: 1, y: 0 }}
          transition=${{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mood-heading auth-heading">
            <div className="google-auth-mark" aria-hidden="true">
              <span>V</span>
            </div>
            <p className="google-auth-brand font-display">VIRELI</p>
            <h2 className="font-display">
              ${emailAuthStep === "code" ? "Check your email" : "Welcome back"}
            </h2>
            ${emailAuthStep === "code"
              ? html`
                  <p>We sent a verification code to</p>
                  <p className="auth-email-display">${emailAuthEmail}</p>
                `
              : html`<p>Sign in to continue to Vireli.</p>`}
          </div>

          ${emailAuthStep === "code"
            ? html`
                <form className="email-auth-form" onSubmit=${onEmailVerify}>
                  <div className="verification-code-row" aria-label="Verification code">
                    ${Array.from({ length: EMAIL_AUTH_CODE_LENGTH }).map(
                      (_, index) => html`
                        <input
                          key=${index}
                          ref=${(element) => {
                            codeInputRefs.current[index] = element;
                          }}
                          className="verification-code-box"
                          value=${/\d/.test(codeDigits[index]) ? codeDigits[index] : ""}
                          type="text"
                          inputMode="numeric"
                          autoComplete=${index === 0 ? "one-time-code" : "off"}
                          pattern="[0-9]*"
                          maxLength="1"
                          aria-label=${`Digit ${index + 1} of ${EMAIL_AUTH_CODE_LENGTH}`}
                          disabled=${isEmailBusy}
                          onInput=${(event) => onEmailCodeChange(index, event.target.value)}
                          onKeyDown=${(event) => onEmailCodeKeyDown(event, index)}
                          onPaste=${onEmailCodePaste}
                        />
                      `,
                    )}
                  </div>
                  <button
                    type="submit"
                    className="primary-button auth-primary-button"
                    disabled=${isEmailBusy || cleanCode.length !== EMAIL_AUTH_CODE_LENGTH}
                  >
                    ${emailAuthStatus === "verifying" ? "Verifying..." : "Verify"}
                  </button>
                </form>

                <div className="email-auth-link-row">
                  <button
                    type="button"
                    className="auth-text-button"
                    disabled=${isEmailBusy}
                    onClick=${onEmailResend}
                  >
                    ${emailAuthStatus === "resending" ? "Sending..." : "Didn’t receive a code? Resend code"}
                  </button>
                  <button
                    type="button"
                    className="auth-text-button"
                    disabled=${isEmailBusy}
                    onClick=${onEmailUseDifferentEmail}
                  >
                    Use a different email
                  </button>
                </div>
              `
            : html`
                <form className="email-auth-form" onSubmit=${onEmailContinue}>
                  <label className="field-stack">
                    <span>Email address</span>
                    <input
                      className="planning-input auth-email-input"
                      value=${emailAuthEmail}
                      onInput=${(event) => onEmailChange(event.target.value)}
                      placeholder="student@example.com"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      disabled=${isEmailBusy}
                    />
                  </label>
                  <button
                    type="submit"
                    className="primary-button auth-primary-button"
                    disabled=${isEmailBusy || !emailAuthEmail.trim()}
                  >
                    ${emailAuthStatus === "sending" ? "Sending code..." : "Continue"}
                  </button>
                </form>

                <p className="email-auth-create">
                  ${emailAuthMode === "signup" ? "Already have an account?" : "Don’t have an account?"}
                  <button
                    type="button"
                    className="auth-text-button"
                    disabled=${isEmailBusy}
                    onClick=${() => onEmailModeChange(emailAuthMode === "signup" ? "signin" : "signup")}
                  >
                    ${emailAuthMode === "signup" ? "Sign in" : "Create account"}
                  </button>
                </p>
              `}

          ${emailAuthError
            ? html`<p className="google-auth-error">${emailAuthError}</p>`
            : null}
          ${emailAuthMessage
            ? html`<p className="email-auth-message">${emailAuthMessage}</p>`
            : null}

          <div className="google-auth-divider">
            <span></span>
            <small>or</small>
            <span></span>
          </div>

          <div className="google-auth-provider-shell">
            ${googleClientId
              ? html`
                  <div
                    ref=${googleButtonRef}
                    className="google-identity-button-slot"
                    aria-label="Sign in with Google"
                  ></div>
                  <p className="google-auth-status">
                    ${googleAuthStatus === "verifying"
                      ? "Checking your Google sign-in..."
                      : googleAuthStatus === "ready"
                      ? "Use your Google account instead."
                      : "Preparing Google sign-in..."}
                  </p>
                `
              : html`
                  <div className="google-auth-config-notice">
                    Google sign-in needs a Google web client ID on the local server.
                  </div>
                `}
            ${googleAuthError
              ? html`<p className="google-auth-error">${googleAuthError}</p>`
              : null}
          </div>

          <div className="google-auth-divider">
            <span></span>
            <small>or</small>
            <span></span>
          </div>

          <div className="mood-control-row google-auth-actions">
            <button type="button" className="secondary-button auth-secondary-button" onClick=${onContinueAsGuest}>
              Continue as guest
            </button>
          </div>

          <p className="privacy-note">
            ${profile.connected
              ? "Signed in. VIRELI stores only basic profile info."
              : "VIRELI sends a one-time code to your email. Google sign-in stays separate when configured."}
          </p>
        </${motion.div}>
      </div>
    </${motion.section}>
  `;
}

function RoutineSetupScreen({
  routineDraft,
  onRoutineChange,
  onRoutineWorkloadSelect,
  onRoutineActivityChange,
  onRoutineActivityAdd,
  onRoutineActivityRemove,
  onSaveRoutine,
}) {
  const dailyActivities = Array.isArray(routineDraft.dailyActivities)
    ? routineDraft.dailyActivities
    : EMPTY_ROUTINE_DRAFT.dailyActivities;
  const canSave = Boolean(routineDraft.wakeTime && routineDraft.bedTime && routineDraft.preferredDailyWorkloadMinutes);
  const isCustomWorkload = routineDraft.preferredWorkloadLabel === "Custom";

  return html`
    <${motion.section}
      className="mood-screen min-h-screen relative flex items-center justify-center overflow-hidden px-5 py-8 sm:px-8"
      initial=${{ opacity: 0 }}
      animate=${{ opacity: 1 }}
      exit=${{ opacity: 0, scale: 0.985 }}
      transition=${{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <${GraphBackdrop} />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="mood-brand-row">
          <${BrandLockup} compact=${true} />
        </div>

        <${motion.div}
          className="mood-panel routine-panel"
          initial=${{ opacity: 0, y: 28 }}
          animate=${{ opacity: 1, y: 0 }}
          transition=${{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mood-heading">
            <p className="eyebrow">Setup 3 of 3 · Schedule basics</p>
            <h2 className="font-display">What does your normal day look like?</h2>
            <p>
              Add your awake hours, workload comfort zone, and fixed commitments so VIRELI can find real openings.
            </p>
          </div>

          <div className="routine-form">
            <div className="routine-time-grid">
              <label className="field-stack">
                <span>What time do you wake up?</span>
                <input
                  className="planning-input"
                  type="time"
                  value=${routineDraft.wakeTime}
                  onInput=${(event) => onRoutineChange("wakeTime", event.target.value)}
                  required
                />
              </label>

              <label className="field-stack">
                <span>What time do you go to bed?</span>
                <input
                  className="planning-input"
                  type="time"
                  value=${routineDraft.bedTime}
                  onInput=${(event) => onRoutineChange("bedTime", event.target.value)}
                  required
                />
              </label>
            </div>

            <div className="field-stack">
              <span>How long are you willing to work throughout the day?</span>
              <div className="workload-choice-grid">
                ${WORKLOAD_OPTIONS.map(
                  (option) => html`
                    <button
                      key=${option.id}
                      type="button"
                      className=${cx(
                        "choice-chip workload-choice",
                        routineDraft.preferredWorkloadLabel === option.label && "is-selected",
                      )}
                      aria-pressed=${routineDraft.preferredWorkloadLabel === option.label}
                      onClick=${() => onRoutineWorkloadSelect(option)}
                    >
                      ${option.label}
                    </button>
                  `,
                )}
              </div>
              ${isCustomWorkload
                ? html`
                    <input
                      className="planning-input"
                      type="number"
                      min="15"
                      step="15"
                      inputMode="numeric"
                      value=${routineDraft.preferredDailyWorkloadMinutes}
                      onInput=${(event) => onRoutineChange("preferredDailyWorkloadMinutes", event.target.value)}
                      placeholder="Minutes you are willing to work"
                    />
                  `
                : null}
              <small className="field-help">This is a work limit, not a promise to fill every free hour.</small>
            </div>

            <div className="field-stack">
              <span>Fixed routine activities</span>
              <div className="daily-activity-list">
                ${dailyActivities.map(
                  (activity, index) => html`
                    <div key=${activity.id || `routine-activity-${index}`} className="routine-activity-row">
                      <input
                        className="planning-input"
                        value=${activity.name}
                        onInput=${(event) => onRoutineActivityChange(index, "name", event.target.value)}
                        placeholder=${index === 0 ? "School, practice, commute..." : "Another activity"}
                      />
                      <input
                        className="planning-input"
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value=${activity.durationMinutes}
                        onInput=${(event) => onRoutineActivityChange(index, "durationMinutes", event.target.value)}
                        placeholder="Minutes"
                      />
                      <input
                        className="planning-input"
                        value=${activity.usualTime}
                        onInput=${(event) => onRoutineActivityChange(index, "usualTime", event.target.value)}
                        placeholder="Usually when?"
                      />
                      <button
                        type="button"
                        className="secondary-button"
                        onClick=${() => onRoutineActivityRemove(index)}
                        disabled=${dailyActivities.length <= 1}
                      >
                        Remove
                      </button>
                    </div>
                  `,
                )}
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick=${onRoutineActivityAdd}
                disabled=${dailyActivities.length >= 8}
              >
                Add another
              </button>
            </div>

          </div>

          <${AnimatePresence}>
            ${canSave
              ? html`
                  <${motion.div}
                    className="mood-control-row"
                    initial=${{ opacity: 0, y: 10 }}
                    animate=${{ opacity: 1, y: 0 }}
                    exit=${{ opacity: 0, y: 8 }}
                    transition=${{ duration: 0.22 }}
                  >
                    <button
                      type="button"
                      className="primary-button"
                      onClick=${onSaveRoutine}
                    >
                      Save routine
                    </button>
                  </${motion.div}>
                `
              : null}
          </${AnimatePresence}>
        </${motion.div}>
      </div>
    </${motion.section}>
  `;
}

function ClassSetupScreen({
  selectedClassIds,
  customClassDraft,
  customClassNames,
  onClassToggle,
  onCustomClassDraftChange,
  onCustomClassAdd,
  onCustomClassRemove,
  onSaveClasses,
  onSkipClasses,
}) {
  const isAddingOtherClass = selectedClassIds.includes("other");

  return html`
    <${motion.section}
      className="mood-screen min-h-screen relative flex items-center justify-center overflow-hidden px-5 py-8 sm:px-8"
      initial=${{ opacity: 0 }}
      animate=${{ opacity: 1 }}
      exit=${{ opacity: 0, scale: 0.985 }}
      transition=${{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <${GraphBackdrop} />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="mood-brand-row">
          <${BrandLockup} compact=${true} />
        </div>

        <${motion.div}
          className="mood-panel"
          initial=${{ opacity: 0, y: 28 }}
          animate=${{ opacity: 1, y: 0 }}
          transition=${{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mood-heading">
            <p className="eyebrow">First setup</p>
            <h2 className="font-display">What classes do you have?</h2>
            <p>
              Pick every class you want VIRELI to remember. You only need to do
              this once, and you can edit the list later in Settings. You can
              also skip for now and add classes when homework comes up.
            </p>
          </div>

          <div className="mood-followup-card">
            <div className="homework-class-grid">
              ${DEFAULT_CLASS_OPTIONS.map(
                (schoolClass) => html`
                  <button
                    key=${schoolClass.id}
                    type="button"
                    className=${cx(
                      "mood-choice class-choice",
                      selectedClassIds.includes(schoolClass.id) && "is-selected",
                    )}
                    aria-pressed=${selectedClassIds.includes(schoolClass.id)}
                    onClick=${() => onClassToggle(schoolClass.id)}
                  >
                    <span className="mood-choice-label">${schoolClass.label}</span>
                    <span className="mood-choice-text">
                      ${schoolClass.id === "other"
                        ? "Add custom classes or activities."
                        : "Save this class for homework planning."}
                    </span>
                  </button>
                `,
              )}
            </div>

            ${isAddingOtherClass
              ? html`
                  <div className="custom-class-panel">
                    <label className="field-stack">
                      <span>Other class</span>
                      <div className="custom-class-entry">
                        <input
                          className="planning-input"
                          value=${customClassDraft}
                          onInput=${(event) => onCustomClassDraftChange(event.target.value)}
                          placeholder="Psychology, Robotics, Film..."
                        />
                        <button
                          type="button"
                          className="secondary-button"
                          onClick=${onCustomClassAdd}
                          disabled=${!customClassDraft.trim()}
                        >
                          Add
                        </button>
                      </div>
                    </label>

                    ${customClassNames.length
                      ? html`
                          <div className="choice-chip-row custom-class-chip-row">
                            ${customClassNames.map(
                              (className) => html`
                                <button
                                  key=${className}
                                  type="button"
                                  className="choice-chip is-selected"
                                  onClick=${() => onCustomClassRemove(className)}
                                >
                                  ${className}
                                </button>
                              `,
                            )}
                          </div>
                        `
                      : null}
                  </div>
                `
              : null}

            <div className="mood-control-row">
              <button
                type="button"
                className="secondary-button"
                onClick=${onSkipClasses}
              >
                Skip for now
              </button>
              <button
                type="button"
                className="primary-button"
                onClick=${onSaveClasses}
                disabled=${selectedClassIds.filter((classId) => classId !== "other").length === 0 && customClassNames.length === 0}
              >
                Save classes
              </button>
            </div>
          </div>

        </${motion.div}>
      </div>
    </${motion.section}>
  `;
}

function RoutineTab({
  routineDraft,
  routine,
  homeworkItems,
  calendarTasks,
  onRoutineChange,
  onRoutineWorkloadSelect,
  onRoutineActivityChange,
  onRoutineActivityAdd,
  onRoutineActivityRemove,
  onSaveRoutine,
}) {
  const dailyActivities = Array.isArray(routineDraft.dailyActivities)
    ? routineDraft.dailyActivities
    : EMPTY_ROUTINE_DRAFT.dailyActivities;
  const schedule = getTodayScheduleBlocks({ routine, homeworkItems, calendarTasks });
  const freeWindows = getFreeTimeWindows(schedule);
  const largestWindow = freeWindows
    .slice()
    .sort((a, b) => (b.endMinutes - b.startMinutes) - (a.endMinutes - a.startMinutes))[0];
  const busyMinutes = schedule.timelineBlocks
    .filter((block) => block.source !== "free")
    .reduce((total, block) => total + block.endMinutes - block.startMinutes, 0);
  const workloadLabel = getDayWorkloadLabel({ routine, homeworkItems, calendarTasks });
  const canSave = Boolean(routineDraft.wakeTime && routineDraft.bedTime && routineDraft.preferredDailyWorkloadMinutes);
  const routineItems = (routine.dailyActivities || []).filter((item) => item.name);

  return html`
    <${motion.section}
      key="routine"
      className="tab-view"
      initial=${{ opacity: 0, y: 20 }}
      animate=${{ opacity: 1, y: 0 }}
      exit=${{ opacity: 0, y: -16 }}
      transition=${{ duration: 0.35 }}
    >
      <div className="tab-heading">
        <div>
          <p className="eyebrow">Your Routine</p>
          <h1 className="font-display">Organize Tasks</h1>
          <p className="tab-heading-lead">VIRELI reviews your recurring commitments before it moves anything.</p>
        </div>
      </div>

      <div className="routine-dashboard-grid">
        <article className="feature-card routine-card-list-card">
          <p className="eyebrow">Recurring routine</p>
          <h3 className="font-display section-title-lg">Your fixed and flexible blocks</h3>
          ${routineItems.length
            ? html`
                <div className="routine-card-list">
                  ${routineItems.map(
                    (activity) => html`
                      <details key=${activity.id} className=${cx("routine-mini-card", activity.fixed === false && "is-flexible")}>
                        <summary>
                          <strong>${activity.name}</strong>
                          <span>${[activity.usualTime ? formatTimeLabel(activity.usualTime) : "", activity.durationMinutes ? `${activity.durationMinutes} min` : "", activity.fixed === false ? "Flexible" : "Fixed"].filter(Boolean).join(" · ")}</span>
                        </summary>
                        <div>
                          <button type="button" className="secondary-button" onClick=${() => onRoutineActivityChange((routineDraft.dailyActivities || []).findIndex((item) => item.id === activity.id), "active", false)}>
                            Pause
                          </button>
                          <button type="button" className="secondary-button" onClick=${() => onRoutineActivityRemove((routineDraft.dailyActivities || []).findIndex((item) => item.id === activity.id))}>
                            Remove
                          </button>
                        </div>
                      </details>
                    `,
                  )}
                </div>
              `
            : html`<div className="soft-note"><p>No routine blocks yet. Add only real commitments.</p></div>`}
        </article>

        <article className="feature-card routine-summary-card">
          <p className="eyebrow">${workloadLabel} day</p>
          <h3 className="font-display">${formatDurationFromMinutes(schedule.freeMinutes)} free today</h3>
          <div className="routine-summary-stats">
            <span><strong>${formatDurationFromMinutes(busyMinutes)}</strong><small>scheduled</small></span>
            <span><strong>${formatDurationFromMinutes(getPreferredWorkloadMinutes(routine))}</strong><small>work limit</small></span>
            <span><strong>${largestWindow ? largestWindow.durationLabel : "0m"}</strong><small>largest window</small></span>
            <span><strong>${(routine.dailyActivities || []).filter((item) => item.name).length}</strong><small>commitments</small></span>
          </div>
          <p>
            ${workloadLabel === "Overloaded"
              ? "Today looks tight. VIRELI should protect the most important deadline and move what can wait."
              : largestWindow
                ? `Your best open window is ${largestWindow.label}.`
                : "Your day is mostly committed right now."}
          </p>
        </article>

        <article className="feature-card routine-editor-card">
          <h3 className="font-display">Vireli’s Suggested Day</h3>
          <p>Review the day VIRELI can build from your routine before applying schedule changes.</p>
          <div className="routine-form">
            <div className="routine-time-grid">
              <label className="field-stack">
                <span>Wake time</span>
                <input className="planning-input" type="time" value=${routineDraft.wakeTime} onInput=${(event) => onRoutineChange("wakeTime", event.target.value)} />
              </label>
              <label className="field-stack">
                <span>Bed time</span>
                <input className="planning-input" type="time" value=${routineDraft.bedTime} onInput=${(event) => onRoutineChange("bedTime", event.target.value)} />
              </label>
            </div>

            <div className="field-stack">
              <span>Preferred daily workload</span>
              <div className="workload-choice-grid">
                ${WORKLOAD_OPTIONS.map(
                  (option) => html`
                    <button
                      key=${option.id}
                      type="button"
                      className=${cx("choice-chip workload-choice", routineDraft.preferredWorkloadLabel === option.label && "is-selected")}
                      onClick=${() => onRoutineWorkloadSelect(option)}
                    >
                      ${option.label}
                    </button>
                  `,
                )}
              </div>
              ${routineDraft.preferredWorkloadLabel === "Custom"
                ? html`
                    <input
                      className="planning-input"
                      type="number"
                      min="15"
                      step="15"
                      inputMode="numeric"
                      value=${routineDraft.preferredDailyWorkloadMinutes}
                      onInput=${(event) => onRoutineChange("preferredDailyWorkloadMinutes", event.target.value)}
                      placeholder="Minutes"
                    />
                  `
                : null}
            </div>

            <div className="daily-activity-list">
              ${dailyActivities.map(
                (activity, index) => html`
                  <div key=${activity.id || `routine-edit-${index}`} className="routine-activity-row">
                    <input className="planning-input" value=${activity.name} onInput=${(event) => onRoutineActivityChange(index, "name", event.target.value)} placeholder="Activity" />
                    <input className="planning-input" type="number" min="0" inputMode="numeric" value=${activity.durationMinutes} onInput=${(event) => onRoutineActivityChange(index, "durationMinutes", event.target.value)} placeholder="Minutes" />
                    <input className="planning-input" value=${activity.usualTime} onInput=${(event) => onRoutineActivityChange(index, "usualTime", event.target.value)} placeholder="Start time" />
                    <button type="button" className="secondary-button" onClick=${() => onRoutineActivityRemove(index)} disabled=${dailyActivities.length <= 1}>Remove</button>
                  </div>
                `,
              )}
            </div>
            <div className="card-footer-row">
              <button type="button" className="secondary-button" onClick=${onRoutineActivityAdd} disabled=${dailyActivities.length >= 8}>Add activity</button>
              <button type="button" className="secondary-button" onClick=${onSaveRoutine} disabled=${!canSave}>Adjust</button>
              <button type="button" className="secondary-button" onClick=${onSaveRoutine} disabled=${!canSave}>Organize Again</button>
              <button type="button" className="primary-button" onClick=${onSaveRoutine} disabled=${!canSave}>Accept</button>
            </div>
          </div>
        </article>
      </div>
    </${motion.section}>
  `;
}

function DailyLogPanel({
  timeMode,
  dailyLogDraft,
  dailyLogSubmitted,
  onDailyLogChange,
  onDailyActivityChange,
  onDailyActivityAdd,
  onDailyActivityRemove,
  onDailyActivitiesLockToggle,
  onDailyLogSubmit,
}) {
  const isAvailable = timeMode === "night";
  const activityItems = Array.isArray(dailyLogDraft.activities)
    ? dailyLogDraft.activities
    : ["", "", ""];
  const canSubmit =
    dailyLogDraft.rating &&
    dailyLogDraft.couldBeBetter &&
    activityItems.some((activity) => activity.trim()) &&
    dailyLogDraft.wentWell.trim() &&
    dailyLogDraft.didNotGoWell.trim();

  return html`
    <article className="feature-card daily-log-card">
      <div className="card-topline card-topline-simple">
        <span className="micro-badge">Daily Log</span>
      </div>
      <h3 className="font-display section-title-lg">Daily Log</h3>
      <p>
        ${isAvailable
          ? "A short check-in for how today went."
          : "Daily Log opens from 3 PM to 3 AM."}
      </p>

      ${isAvailable
        ? html`
            <div className="daily-log-form">
              <div className="field-stack">
                <span>How was your day?</span>
                <div className="segmented-choice-row">
                  ${DAILY_LOG_RATINGS.map(
                    (rating) => html`
                      <button
                        key=${rating}
                        type="button"
                        className=${cx(
                          "response-type-button",
                          dailyLogDraft.rating === rating && "is-selected",
                        )}
                        onClick=${() => onDailyLogChange("rating", rating)}
                      >
                        ${rating}
                      </button>
                    `,
                  )}
                </div>
              </div>

              <div className="field-stack">
                <span>Could it have gone better?</span>
                <div className="segmented-choice-row is-small">
                  ${["Yes", "No"].map(
                    (answer) => html`
                      <button
                        key=${answer}
                        type="button"
                        className=${cx(
                          "response-type-button",
                          dailyLogDraft.couldBeBetter === answer && "is-selected",
                        )}
                        onClick=${() => onDailyLogChange("couldBeBetter", answer)}
                      >
                        ${answer}
                      </button>
                    `,
                  )}
                </div>
              </div>

              <div className="field-stack">
                <div className="daily-activity-heading-row">
                  <span>What did you do today?</span>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick=${onDailyActivitiesLockToggle}
                    disabled=${!dailyLogDraft.activitiesLocked && !activityItems.some((activity) => activity.trim())}
                  >
                    ${dailyLogDraft.activitiesLocked ? "Edit" : "Save"}
                  </button>
                </div>
                <div className="daily-activity-list">
                  ${activityItems.map(
                    (activity, index) => html`
                      <div key=${`activity-${index}`} className="daily-activity-row">
                        <input
                          className="planning-input"
                          value=${activity}
                          onInput=${(event) => onDailyActivityChange(index, event.target.value)}
                          placeholder=${`Activity ${index + 1}`}
                          aria-label=${`Daily activity ${index + 1}`}
                          disabled=${dailyLogDraft.activitiesLocked}
                        />
                        <button
                          type="button"
                          className="secondary-button"
                          onClick=${() => onDailyActivityRemove(index)}
                          disabled=${dailyLogDraft.activitiesLocked || activityItems.length <= 1}
                        >
                          Remove
                        </button>
                      </div>
                    `,
                  )}
                </div>
                <button
                  type="button"
                  className="secondary-button add-activity-button"
                  onClick=${onDailyActivityAdd}
                  disabled=${dailyLogDraft.activitiesLocked || activityItems.length >= 8}
                >
                  Add another
                </button>
                ${dailyLogDraft.activitiesLocked
                  ? html`<small className="locked-note">Saved. You can edit this section if your answer changes.</small>`
                  : null}
              </div>

              <label className="field-stack">
                <span>What went well?</span>
                <textarea
                  className="planning-input compact-textarea"
                  value=${dailyLogDraft.wentWell}
                  onInput=${(event) => onDailyLogChange("wentWell", event.target.value)}
                  rows="3"
                ></textarea>
              </label>

              <label className="field-stack">
                <span>What did not go well?</span>
                <textarea
                  className="planning-input compact-textarea"
                  value=${dailyLogDraft.didNotGoWell}
                  onInput=${(event) => onDailyLogChange("didNotGoWell", event.target.value)}
                  rows="3"
                ></textarea>
              </label>

              <label className="field-stack">
                <span>Highlight of your day</span>
                <input
                  className="planning-input"
                  value=${dailyLogDraft.highlight}
                  onInput=${(event) => onDailyLogChange("highlight", event.target.value)}
                  placeholder="Optional"
                />
              </label>
            </div>

            ${dailyLogSubmitted
              ? html`<div className="status-banner status-banner-soft">Daily Log saved.</div>`
              : null}

            <div className="card-footer-row">
              <span>Keep it short. Honest is enough.</span>
              <button
                type="button"
                className="secondary-button"
                onClick=${onDailyLogSubmit}
                disabled=${!canSubmit}
              >
                Save log
              </button>
            </div>
          `
        : html`
            <div className="soft-note">
              <p>Come back later today for a quick reflection.</p>
            </div>
          `}
    </article>
  `;
}

function HomeTab({
  profile,
  routine,
  homeworkItems,
  calendarTasks,
  savedClasses,
  moodSelection,
  chatDraft,
  onTabChange,
  onChatDraftChange,
  onHomeworkCompleteToggle,
  onHomeworkReschedule,
  onHomeworkDelete,
}) {
  const recommendation = getNextAssignmentRecommendation({
    routine,
    homeworkItems,
    calendarTasks,
    mood: moodSelection,
  });
  const schedule = recommendation.schedule;
  const progress = getTodayProgress(homeworkItems);
  const freeWindows = recommendation.freeWindows.slice(0, 4);
  const deadlines = getUpcomingDeadlines(homeworkItems);
  const warnings = getWorkloadWarnings(homeworkItems, routine, calendarTasks);
  const missedItems = getMissedAssignments(homeworkItems);
  const chartSegments = getChartSegments(schedule);
  const nextItem = recommendation.item;
  const nextWindow = recommendation.freeWindows[0];
  const upNextItems = homeworkItems
    .filter((item) => !item.completed && (!nextItem || item.id !== nextItem.id))
    .sort((a, b) => `${getItemCalendarDate(a) || "9999-12-31"} ${a.scheduledTime || ""}`.localeCompare(`${getItemCalendarDate(b) || "9999-12-31"} ${b.scheduledTime || ""}`))
    .slice(0, 3);
  const todayItems = getChronologicalDayItems({ routine, homeworkItems, calendarTasks, savedClasses }).slice(0, 10);
  const tomorrowPreview = getTomorrowPreview({ homeworkItems, calendarTasks, routine });
  const starterTasks = getStarterTasks(profile.primaryUse);
  const isNewerUser = homeworkItems.length + calendarTasks.length + (routine.dailyActivities || []).filter((item) => item.name).length < 3;

  return html`
    <${motion.section}
      key="home"
      className="tab-view"
      initial=${{ opacity: 0, y: 20 }}
      animate=${{ opacity: 1, y: 0 }}
      exit=${{ opacity: 0, y: -16 }}
      transition=${{ duration: 0.35 }}
    >
      <div className="tab-heading home-heading">
        <div>
          <p className="eyebrow">${getTimeGreeting()}, ${getFirstName(profile)}</p>
          <h1 className="font-display">What should I do right now?</h1>
          <p className="tab-heading-lead">
            VIRELI looks at assignments, routines, and open time to choose the next useful step.
          </p>
        </div>
        <span className="date-chip free-hours-chip">${freeWindows[0] ? `${freeWindows[0].label} open` : "No open window right now"}</span>
      </div>

      <form
        className="smart-add-bar"
        onSubmit=${(event) => {
          event.preventDefault();
          onTabChange("ask");
        }}
      >
        <input
          value=${chatDraft}
          onInput=${(event) => onChatDraftChange(event.target.value)}
          placeholder="Tell Vireli what you need to do..."
          aria-label="Tell VIRELI what you need to do"
        />
        <button type="submit" className="primary-button" disabled=${!chatDraft.trim()}>
          Ask
        </button>
      </form>

      <div className="home-grid planner-dashboard-grid">
        <article className="feature-card next-task-card">
          <p className="eyebrow">Right Now</p>
          ${nextItem
            ? html`
                <div className="next-task-main">
                  <div>
                    <h2 className="font-display">${nextItem.title}</h2>
                    <p>${getAssignmentSubject(nextItem, savedClasses)}</p>
                  </div>
                  <span className="date-chip">${formatDurationFromMinutes(recommendation.duration)}</span>
                </div>
                <div className="next-task-meta">
                  <span>Start: ${recommendation.startTime ? formatTimeLabel(recommendation.startTime) : "when you are ready"}</span>
                  <span>${nextItem.dueDate ? `Due ${formatShortDate(nextItem.dueDate)}` : "No due date"}</span>
                  <span>${nextWindow ? `Best window: ${nextWindow.label}` : "No free window found"}</span>
                </div>
                <div className="card-footer-row next-task-actions">
                  <button type="button" className="primary-button" onClick=${() => onTabChange("calendar")}>Start</button>
                  <button type="button" className="secondary-button" onClick=${() => onHomeworkCompleteToggle(nextItem.id)}>Done</button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick=${() => nextWindow && onHomeworkReschedule(nextItem.id, getDateInputValue(), minutesToTimeValue(nextWindow.startMinutes))}
                    disabled=${!nextWindow}
                  >
                    Reschedule
                  </button>
                </div>
              `
            : html`
                <div className="empty-action-state">
                  <h2 className="font-display">No assignments yet.</h2>
                  <p>Add one assignment and VIRELI will find a realistic time to work on it.</p>
                  <button type="button" className="primary-button" onClick=${() => onTabChange("assignments")}>Add assignment</button>
                </div>
              `}
        </article>

        <article className="feature-card progress-card">
          <p className="eyebrow">Today’s progress</p>
          <h3 className="font-display">${progress.completed}/${progress.total || 0} done</h3>
          <div className="progress-track"><span style=${{ width: `${progress.percent}%` }}></span></div>
          <p>${progress.remaining ? `${progress.remaining} item${progress.remaining === 1 ? "" : "s"} remaining today.` : "Nothing else scheduled for today."}</p>
        </article>

        <article className="feature-card deadline-card">
          <p className="eyebrow">Up Next</p>
          ${upNextItems.length
            ? html`
                <div className="compact-list">
                  ${upNextItems.map(
                    (item) => html`
                      <div key=${`up-next-${item.id}`} className="compact-list-row">
                        <strong>${item.title}</strong>
                        <span>${getPlanSummaryMeta(item)} · ${getAssignmentDuration(item)} min</span>
                      </div>
                    `,
                  )}
                </div>
              `
            : html`<p>No queued work after the right-now task.</p>`}
          ${warnings.length
            ? html`
                <div className="warning-list">
                  ${warnings.map((warning) => html`<p key=${warning.dateValue}>${warning.message}</p>`)}
                </div>
              `
            : null}
        </article>

        ${missedItems.length
          ? html`
              <article className="feature-card missed-work-card">
                <p className="eyebrow">Missed sessions</p>
                ${missedItems.map((item) => {
                  const nextWindowForMissed = freeWindows[0];
                  return html`
                    <div key=${`missed-${item.id}`} className="missed-work-row">
                      <p>You missed your ${item.scheduledTime ? formatTimeLabel(item.scheduledTime) : ""} ${item.title} session.</p>
                      <div>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick=${() => nextWindowForMissed && onHomeworkReschedule(item.id, getDateInputValue(), minutesToTimeValue(nextWindowForMissed.startMinutes))}
                          disabled=${!nextWindowForMissed}
                        >
                          Reschedule
                        </button>
                        <button type="button" className="secondary-button" onClick=${() => onHomeworkCompleteToggle(item.id)}>Mark complete</button>
                        <button type="button" className="secondary-button" onClick=${() => onHomeworkDelete(item.id)}>Skip</button>
                      </div>
                    </div>
                  `;
                })}
              </article>
            `
          : null}

        <article className="feature-card timeline-card">
          <div className="card-topline card-topline-simple">
            <span className="micro-badge">
              ${formatTimeLabel(minutesToTimeValue(schedule.wakeMinutes))} - ${formatTimeLabel(minutesToTimeValue(schedule.bedMinutes))}
            </span>
          </div>
          <h3 className="font-display section-title-lg">Available Time</h3>
          <div className="day-chart" aria-label="Free and busy chart for today">
            <div className="day-chart-track">
              ${chartSegments.map(
                (segment) => html`
                  <span
                    key=${segment.id}
                    className=${cx("day-chart-segment", `is-${segment.source}`)}
                    style=${{ width: `${segment.width}%` }}
                    title=${segment.title}
                  ></span>
                `,
              )}
            </div>
            <div className="day-chart-legend">
              <span><i className="is-free"></i>Free</span>
              <span><i className="is-busy"></i>Busy</span>
            </div>
          </div>
          <div className="free-window-list">
            ${freeWindows.length
              ? freeWindows.map(
                  (windowBlock) => html`
                    <div key=${windowBlock.id} className="free-window-row">
                      <strong>${windowBlock.label}</strong>
                      <span>${windowBlock.durationLabel} available</span>
                    </div>
                  `,
                )
              : html`<p>No open windows left today.</p>`}
          </div>
        </article>

        <article className="feature-card timeline-card today-schedule-card">
          <p className="eyebrow">Today</p>
          <h3 className="font-display section-title-lg">Remaining schedule</h3>
          <div className="routine-timeline">
            ${todayItems.length
              ? todayItems.map(
              (block) => html`
                <div
                  key=${block.id}
                  className=${cx("timeline-block", `is-${block.source}`)}
                >
                  <div className="timeline-time">
                    <strong>${block.timeLabel.split(" - ")[0]}</strong>
                    <span>${block.timeLabel.split(" - ")[1] || ""}</span>
                  </div>
                  <div className="timeline-content">
                    <span className="timeline-source">${block.source === "free" ? "Free" : block.source}</span>
                    <p>${block.title}</p>
                    <small>${block.durationLabel}</small>
                  </div>
                </div>
              `,
            )
              : html`<p>No schedule blocks yet.</p>`}
          </div>
        </article>

        <article className="feature-card deadline-card">
          <p className="eyebrow">Upcoming Deadlines</p>
          ${deadlines.length
            ? html`
                <div className="compact-list">
                  ${deadlines.map(
                    (item) => html`
                      <div key=${`deadline-${item.id}`} className="compact-list-row">
                        <strong>${item.title}</strong>
                        <span>${formatShortDate(item.dueDate)} · ${getAssignmentDuration(item)} min</span>
                      </div>
                    `,
                  )}
                </div>
              `
            : html`<p>No due dates saved yet.</p>`}
        </article>

        <article className="feature-card deadline-card">
          <p className="eyebrow">Tomorrow Preview</p>
          ${tomorrowPreview.items.length || tomorrowPreview.freeWindows.length
            ? html`
                <div className="compact-list">
                  ${tomorrowPreview.items.map(
                    (item) => html`
                      <div key=${`tomorrow-${item.id}`} className="compact-list-row">
                        <strong>${item.title}</strong>
                        <span>${getPlanSummaryMeta(item)}</span>
                      </div>
                    `,
                  )}
                  ${tomorrowPreview.freeWindows.map(
                    (windowBlock) => html`
                      <div key=${`tomorrow-window-${windowBlock.id}`} className="compact-list-row">
                        <strong>${windowBlock.label}</strong>
                        <span>${windowBlock.durationLabel} available</span>
                      </div>
                    `,
                  )}
                </div>
              `
            : html`<p>Tomorrow is open so far.</p>`}
        </article>

        ${isNewerUser
          ? html`
              <article className="feature-card starter-card">
                <p className="eyebrow">Start with 3 things</p>
                <h3 className="font-display section-title-lg">Build your first useful plan.</h3>
                <div className="starter-task-row">
                  ${starterTasks.map((task) => html`<span key=${task} className="step-chip">${task}</span>`)}
                </div>
                <button type="button" className="secondary-button" onClick=${() => onTabChange("assignments")}>
                  Add first item
                </button>
              </article>
            `
          : null}
      </div>
    </${motion.section}>
  `;
}

function PlanTodayTab({
  todayLabel,
  timeMode,
  savedClasses,
  homeworkItems,
  homeworkDraft,
  onHomeworkDraftChange,
  onHomeworkSubmit,
  onHomeworkCompleteToggle,
  onHomeworkDelete,
  onPlanNotificationDismiss,
}) {
  const today = getDateInputValue();
  const openHomeworkItems = homeworkItems.filter((item) => !item.completed);
  const completedHomeworkItems = homeworkItems.filter((item) => item.completed);
  const overdueItems = homeworkItems.filter((item) => isDueBeforeToday(item, today));
  const dueTodayItems = homeworkItems.filter((item) => isDueToday(item, today));
  const upcomingItems = homeworkItems.filter((item) => isUpcomingHomework(item, today));
  const activeNotifications = getActivePlanNotifications(openHomeworkItems, today);
  const planTitle = getPlanTodayTitle(timeMode);
  const planLead =
    "Add the assignment. VIRELI estimates the time and places it into an open window.";

  function renderHomeworkItem(item) {
    return html`
      <div key=${item.id} className=${cx("homework-item", item.completed && "is-complete")}>
        <label className="homework-check-label">
          <input
            type="checkbox"
            checked=${item.completed}
            onChange=${() => onHomeworkCompleteToggle(item.id)}
            aria-label=${`${item.completed ? "Reopen" : "Complete"} ${item.title}`}
          />
          <span></span>
        </label>
        <div>
          <span className="eyebrow">
            ${[
              item.classLabel || (item.classId ? getClassLabel(savedClasses, item.classId, "") : ""),
              getFrequencyLabel(item.frequency),
            ].filter(Boolean).join(" · ")}
          </span>
          <p>${item.title}</p>
          <small>${getHomeworkSummaryMeta(item)}</small>
          ${item.guidance
            ? html`<small className="homework-guidance">${item.guidance}</small>`
            : null}
          ${item.notes || item.details
            ? html`<small>${item.notes || item.details}</small>`
            : null}
          ${Array.isArray(item.steps) && item.steps.length
            ? html`
                <div className="step-chip-row">
                  ${item.steps.map(
                    (step) => html`<span key=${step} className="step-chip">${step}</span>`,
                  )}
                </div>
              `
            : null}
        </div>
        <div className="homework-actions">
          <button
            type="button"
            className="secondary-button"
            onClick=${() => onHomeworkDelete(item.id)}
          >
            Remove
          </button>
        </div>
      </div>
    `;
  }

  function renderHomeworkSection(title, items, emptyText) {
    return html`
      <section className="homework-section">
        <div className="homework-section-head">
          <h4 className="font-display">${title}</h4>
          <span>${items.length}</span>
        </div>
        ${items.length
          ? html`<div className="homework-list">${items.map(renderHomeworkItem)}</div>`
          : html`<p className="soft-note-inline">${emptyText}</p>`}
      </section>
    `;
  }

  return html`
    <${motion.section}
      key="daily"
      className="tab-view"
      initial=${{ opacity: 0, y: 20 }}
      animate=${{ opacity: 1, y: 0 }}
      exit=${{ opacity: 0, y: -16 }}
      transition=${{ duration: 0.35 }}
    >
      <div className="tab-heading">
        <div>
          <p className="eyebrow">Assignments</p>
          <h1 className="font-display">Assignments</h1>
          <p className="tab-heading-lead">${planLead}</p>
        </div>
        <span className="date-chip">${todayLabel}</span>
      </div>

      <div className="daily-grid">
        <article className="feature-card feature-card-support plan-builder-card">
          <div className="card-topline card-topline-simple">
            <span className="mood-chip">Fast entry</span>
          </div>
          <h3 className="font-display section-title-lg">Add assignment</h3>
          <p>Subject, assignment, due date, estimate. VIRELI handles the first schedule suggestion.</p>

          ${activeNotifications.length
            ? html`
                <div className="plan-notification-list">
                  ${activeNotifications.map(
                    (item) => html`
                      <div key=${`notice-${item.id}`} className="plan-notification-card">
                        <div>
                          <strong>${item.title}</strong>
                          <span>${item.scheduledDate ? `${formatShortDate(item.scheduledDate)}${item.scheduledTime ? ` at ${formatTimeLabel(item.scheduledTime)}` : ""}` : "Open plan"}</span>
                        </div>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick=${() => onPlanNotificationDismiss(item.id)}
                        >
                          Dismiss
                        </button>
                      </div>
                    `,
                  )}
                </div>
              `
            : null}

          <form className="homework-form" onSubmit=${onHomeworkSubmit}>
            <div className="homework-form-grid">
              <label className="field-stack">
                <span>Subject</span>
                ${savedClasses.length
                  ? html`
                      <select
                        className="planning-input"
                        value=${homeworkDraft.classId}
                        onChange=${(event) => onHomeworkDraftChange("classId", event.target.value)}
                      >
                        <option value="">Choose subject</option>
                        ${savedClasses.map(
                          (schoolClass) => html`<option key=${schoolClass.id} value=${schoolClass.id}>${schoolClass.label}</option>`,
                        )}
                      </select>
                    `
                  : html`
                      <input
                        className="planning-input"
                        value=${homeworkDraft.classLabel}
                        onInput=${(event) => onHomeworkDraftChange("classLabel", event.target.value)}
                        placeholder="Math"
                      />
                    `}
              </label>
              <label className="field-stack">
                <span>Assignment</span>
                <input
                  className="planning-input"
                  value=${homeworkDraft.title}
                  onInput=${(event) => onHomeworkDraftChange("title", event.target.value)}
                  placeholder="Math worksheet due Friday"
                />
              </label>
              <label className="field-stack">
                <span>Due date</span>
                <input
                  className="planning-input"
                  type="date"
                  value=${homeworkDraft.dueDate}
                  onInput=${(event) => onHomeworkDraftChange("dueDate", event.target.value)}
                />
              </label>
              <label className="field-stack">
                <span>Estimated duration</span>
                <input
                  className="planning-input"
                  type="number"
                  min="5"
                  step="5"
                  inputMode="numeric"
                  value=${homeworkDraft.estimatedMinutes}
                  onInput=${(event) => onHomeworkDraftChange("estimatedMinutes", event.target.value)}
                  placeholder=${String(estimateAssignmentMinutes(homeworkDraft.title, homeworkDraft.details))}
                />
              </label>
            </div>
            <details className="optional-assignment-details">
              <summary>Optional details</summary>
              <textarea
                className="planning-input compact-textarea"
                value=${homeworkDraft.details}
                onInput=${(event) => onHomeworkDraftChange("details", event.target.value)}
                rows="3"
                placeholder="Instructions, chapters, page numbers, or anything VIRELI should know."
              ></textarea>
            </details>
          </form>

          <div className="card-footer-row">
            <span>
              ${savedClasses.length
                ? "VIRELI will suggest the first open work session."
                : "Add subjects in Settings later to speed this up."}
            </span>
            <button
              type="button"
              className="secondary-button"
              onClick=${onHomeworkSubmit}
              disabled=${!homeworkDraft.title.trim()}
            >
              Add assignment
            </button>
          </div>
        </article>

        <article className="feature-card feature-card-quote feature-card-quote-wide">
          <h3 className="font-display">Assignment list</h3>

          ${homeworkItems.length
            ? html`
                ${renderHomeworkSection("Overdue", overdueItems, "Nothing overdue.")}
                ${renderHomeworkSection("Due today", dueTodayItems, "Nothing due today.")}
                ${renderHomeworkSection("Upcoming", upcomingItems, "No upcoming work yet.")}
                ${renderHomeworkSection("Completed", completedHomeworkItems, "Completed work will appear here.")}
              `
            : html`
                <p>
                  No assignments yet. Add one above and VIRELI will schedule the first work session.
                </p>
              `}

          <blockquote className="font-display">
            ${completedHomeworkItems.length
              ? `${completedHomeworkItems.length} finished. VIRELI will keep recalculating the plan.`
              : "A clear assignment list lets VIRELI decide what to schedule next."}
          </blockquote>
        </article>

        <article className="feature-card planner-chip-card feature-card-quote-wide">
          <h3 className="font-display">Scheduled work sessions</h3>
          <p>These chips show when VIRELI has placed work on your day.</p>
          <div className="planner-chip-row">
            ${openHomeworkItems.length
              ? openHomeworkItems.map(
                  (item) => html`
                    <div key=${`planner-${item.id}`} className="planner-chip">
                      <span>${item.classLabel || (item.classId ? getClassLabel(savedClasses, item.classId, "") : item.type || "Plan")}</span>
                      <strong>${getScheduleLabel(item)}</strong>
                      <small>${item.title}</small>
                    </div>
                  `,
                )
              : html`<span className="soft-note-inline">No open plans yet.</span>`}
          </div>
        </article>
      </div>
    </${motion.section}>
  `;
}

function DailyLogTab({
  timeMode,
  dailyLogDraft,
  dailyLogSubmitted,
  dailyLogs,
  thoughts,
  thoughtDraft,
  onDailyLogChange,
  onDailyActivityChange,
  onDailyActivityAdd,
  onDailyActivityRemove,
  onDailyActivitiesLockToggle,
  onDailyLogSubmit,
  onThoughtDraftChange,
  onThoughtAdd,
  onThoughtUpdate,
  onThoughtDelete,
  onThoughtArchive,
  onThoughtHandled,
  onThoughtConvertToTask,
  onThoughtAskVireli,
}) {
  const openThoughts = getOpenThoughts(thoughts);
  const archivedThoughts = thoughts.filter((thought) => thought.archived || thought.status === "handled").slice(0, 4);

  return html`
    <${motion.section}
      key="daily-log"
      className="tab-view"
      initial=${{ opacity: 0, y: 20 }}
      animate=${{ opacity: 1, y: 0 }}
      exit=${{ opacity: 0, y: -16 }}
      transition=${{ duration: 0.35 }}
    >
      <div className="tab-heading">
        <div>
          <p className="eyebrow">Reflection</p>
          <h1 className="font-display">Daily Log</h1>
          <p className="tab-heading-lead">
            What’s on your mind?
          </p>
        </div>
      </div>

      <div className="daily-grid daily-log-grid">
        <article className="feature-card thoughts-card">
          <div className="card-topline card-topline-simple">
            <span className="micro-badge">Today</span>
          </div>
          <h3 className="font-display section-title-lg">What’s on your mind?</h3>
          <p>Thoughts do not become tasks until you choose what to do with them.</p>

          <form className="thought-form" onSubmit=${onThoughtAdd}>
            <label className="field-stack">
              <span>Quick thought</span>
              <textarea
                className="planning-input daily-writing-area"
                value=${thoughtDraft}
                onInput=${(event) => onThoughtDraftChange(event.target.value)}
                placeholder="Save anything that’s on your mind. You can organize it later."
                rows="8"
              ></textarea>
            </label>
            <div className="card-footer-row">
              <span>Keep it messy. You can clean it up later.</span>
              <button type="submit" className="primary-button" disabled=${!thoughtDraft.trim()}>
                Save thought
              </button>
            </div>
          </form>

          <div className="thought-list">
            ${openThoughts.length
              ? openThoughts.map(
                  (thought) => html`
                    <div key=${thought.id} className="thought-item">
                      <textarea
                        className="planning-input compact-textarea"
                        value=${thought.text}
                        rows="2"
                        onInput=${(event) => onThoughtUpdate(thought.id, event.target.value)}
                        aria-label="Saved thought"
                      ></textarea>
                      <div className="thought-actions">
                        <button type="button" className="secondary-button" onClick=${() => onThoughtConvertToTask(thought.id)}>
                          Convert to task
                        </button>
                        <button type="button" className="secondary-button" onClick=${() => onThoughtAskVireli(thought.id)}>
                          Ask VIRELI
                        </button>
                        <button type="button" className="secondary-button" onClick=${() => onThoughtHandled(thought.id)}>
                          Mark handled
                        </button>
                        <button type="button" className="secondary-button" onClick=${() => onThoughtArchive(thought.id)}>
                          Archive
                        </button>
                        <button type="button" className="secondary-button" onClick=${() => onThoughtDelete(thought.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  `,
                )
              : html`<div className="soft-note"><p>Save anything that’s on your mind. You can organize it later.</p></div>`}
          </div>

          ${archivedThoughts.length
            ? html`
                <details className="thought-archive">
                  <summary>Handled and archived thoughts</summary>
                  <div className="compact-list">
                    ${archivedThoughts.map(
                      (thought) => html`
                        <div key=${`archived-${thought.id}`} className="compact-list-row">
                          <strong>${thought.text}</strong>
                          <span>${thought.status === "handled" ? "Handled" : "Archived"} · ${formatDateTime(thought.updatedAt)}</span>
                        </div>
                      `,
                    )}
                  </div>
                </details>
              `
            : null}
        </article>

        <article className="feature-card daily-log-card">
          <div className="card-topline card-topline-simple">
            <span className="micro-badge">Previous entries</span>
          </div>
          <h3 className="font-display section-title-lg">Search and review</h3>
          <p>Saved logs stay available here while quick thoughts stay easy to organize.</p>
          <div className="history-list">
            ${dailyLogs.length
              ? dailyLogs.slice(0, 6).map(
                  (log) => html`
                    <details key=${log.id} className="history-item">
                      <summary>
                        <span>${log.rating || "Daily Log"}</span>
                        <small>${formatDateTime(log.updatedAt)}</small>
                      </summary>
                      <div className="history-messages">
                        <p>${(log.activities || []).filter(Boolean).join(", ") || log.highlight || "No entry text saved."}</p>
                      </div>
                    </details>
                  `,
                )
              : html`<div className="soft-note"><p>No previous Daily Logs yet.</p></div>`}
          </div>
          <details className="thought-archive">
            <summary>Structured check-in</summary>
            <${DailyLogPanel}
              timeMode=${timeMode}
              dailyLogDraft=${dailyLogDraft}
              dailyLogSubmitted=${dailyLogSubmitted}
              onDailyLogChange=${onDailyLogChange}
              onDailyActivityChange=${onDailyActivityChange}
              onDailyActivityAdd=${onDailyActivityAdd}
              onDailyActivityRemove=${onDailyActivityRemove}
              onDailyActivitiesLockToggle=${onDailyActivitiesLockToggle}
              onDailyLogSubmit=${onDailyLogSubmit}
            />
          </details>
        </article>
      </div>
    </${motion.section}>
  `;
}

function CalendarTab({
  homeworkItems,
  calendarTasks,
  calendarTaskDraft,
  editingCalendarTaskId,
  calendarMonth,
  calendarView,
  selectedDate,
  savedClasses,
  routine,
  onCalendarTaskDraftChange,
  onCalendarTaskSubmit,
  onCalendarTaskEdit,
  onCalendarTaskCancelEdit,
  onCalendarMonthChange,
  onCalendarViewChange,
  onSelectedDateChange,
  onHomeworkCompleteToggle,
  onHomeworkReschedule,
  onHomeworkDelete,
  onCalendarTaskToggle,
  onCalendarTaskDelete,
}) {
  const today = getDateInputValue();
  const monthAnchor = calendarMonth || new Date();
  const monthDates = getMonthGridDates(monthAnchor);
  const weekDates = getWeekDates(new Date(`${selectedDate || today}T12:00:00`));
  const calendarItems = [
    ...homeworkItems.map((item) => ({
      ...item,
      calendarId: `homework:${item.id}`,
      source: "homework",
      subject: item.classLabel || (item.classId ? getClassLabel(savedClasses, item.classId, "") : item.type || "Plan"),
      calendarDate: item.dueDate || item.scheduledDate || "",
      scheduledDate: item.scheduledDate || "",
      scheduledTime: item.scheduledTime || "",
    })),
    ...calendarTasks.map((task) => ({
      ...task,
      calendarId: `task:${task.id}`,
      source: "task",
      subject: task.subject || "Personal",
      calendarDate: task.scheduledDate || task.dueDate || "",
    })),
  ];
  const visibleCalendarItems = calendarItems.filter((item) =>
    item.calendarDate && item.calendarDate >= today && !item.completed,
  );
  const selectedDateValue = selectedDate || today;
  const selectedDayItems = visibleCalendarItems.filter((item) => item.calendarDate === selectedDateValue);
  const chronologicalDayItems = getChronologicalDayItems({ routine, homeworkItems, calendarTasks, dateValue: selectedDateValue, savedClasses });
  const draftConflict = detectScheduleConflict(calendarTaskDraft, { routine, homeworkItems, calendarTasks, ignoreId: editingCalendarTaskId || calendarTaskDraft.id });
  const dueToday = visibleCalendarItems.filter((item) => item.calendarDate === today);
  const monthItems = visibleCalendarItems.filter((item) =>
    item.calendarDate &&
    new Date(`${item.calendarDate}T12:00:00`).getMonth() === monthAnchor.getMonth() &&
    new Date(`${item.calendarDate}T12:00:00`).getFullYear() === monthAnchor.getFullYear(),
  );

  return html`
    <${motion.section}
      key="calendar"
      className="tab-view"
      initial=${{ opacity: 0, y: 20 }}
      animate=${{ opacity: 1, y: 0 }}
      exit=${{ opacity: 0, y: -16 }}
      transition=${{ duration: 0.35 }}
    >
      <div className="tab-heading">
        <div>
          <p className="eyebrow">Calendar</p>
          <h1 className="font-display">${getMonthLabel(monthAnchor)}</h1>
          <p className="tab-heading-lead">
            Add tasks and events, then select a day to see the full schedule.
          </p>
        </div>
        <div className="calendar-month-controls">
          ${["day", "week", "month"].map(
            (view) => html`
              <button
                key=${view}
                type="button"
                className=${cx("secondary-button", calendarView === view && "is-active")}
                onClick=${() => onCalendarViewChange(view)}
              >
                ${view.charAt(0).toUpperCase()}${view.slice(1)}
              </button>
            `,
          )}
          <button type="button" className="secondary-button" onClick=${() => onCalendarMonthChange(new Date())}>
            Today
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        <article className="feature-card calendar-add-card">
          <div className="card-topline card-topline-simple">
            <span className="mood-chip">Tasks | Events</span>
          </div>
          <h3 className="font-display section-title-lg">${editingCalendarTaskId ? "Edit item" : "+ Add"}</h3>
          <form className="calendar-add-form" onSubmit=${onCalendarTaskSubmit}>
            <div className="homework-form-grid">
              <label className="field-stack">
                <span>Name</span>
                <input
                  className="planning-input"
                  value=${calendarTaskDraft.title}
                  onInput=${(event) => onCalendarTaskDraftChange("title", event.target.value)}
                  placeholder="Chemistry study session"
                />
              </label>
              <label className="field-stack">
                <span>Date</span>
                <input
                  className="planning-input"
                  type="date"
                  value=${calendarTaskDraft.scheduledDate || selectedDateValue}
                  onInput=${(event) => onCalendarTaskDraftChange("scheduledDate", event.target.value)}
                />
              </label>
              <label className="field-stack">
                <span>Task or Event</span>
                <select
                  className="planning-input"
                  value=${calendarTaskDraft.itemType}
                  onChange=${(event) => onCalendarTaskDraftChange("itemType", event.target.value)}
                >
                  ${HOMEWORK_TYPE_OPTIONS.map((option) => html`<option key=${option} value=${option}>${option}</option>`)}
                </select>
              </label>
              <label className="field-stack">
                <span>Start time</span>
                <input
                  className="planning-input"
                  type="time"
                  value=${calendarTaskDraft.scheduledTime}
                  onInput=${(event) => onCalendarTaskDraftChange("scheduledTime", event.target.value)}
                  disabled=${calendarTaskDraft.allDay}
                />
              </label>
              <label className="field-stack">
                <span>End time</span>
                <input
                  className="planning-input"
                  type="time"
                  value=${calendarTaskDraft.endTime}
                  onInput=${(event) => onCalendarTaskDraftChange("endTime", event.target.value)}
                  disabled=${calendarTaskDraft.allDay}
                />
              </label>
              <label className="field-stack">
                <span>Duration</span>
                <input
                  className="planning-input"
                  type="number"
                  min="5"
                  step="5"
                  inputMode="numeric"
                  value=${calendarTaskDraft.durationMinutes}
                  onInput=${(event) => onCalendarTaskDraftChange("durationMinutes", event.target.value)}
                  placeholder="45"
                  disabled=${calendarTaskDraft.allDay || Boolean(calendarTaskDraft.endTime)}
                />
              </label>
              <label className="field-stack">
                <span>Frequency</span>
                <select
                  className="planning-input"
                  value=${calendarTaskDraft.frequency}
                  onChange=${(event) => onCalendarTaskDraftChange("frequency", event.target.value)}
                >
                  ${PLAN_FREQUENCY_OPTIONS.map((option) => html`<option key=${option} value=${option}>${option}</option>`)}
                </select>
              </label>
              <label className="field-stack">
                <span>Priority</span>
                <select
                  className="planning-input"
                  value=${calendarTaskDraft.priority}
                  onChange=${(event) => onCalendarTaskDraftChange("priority", event.target.value)}
                  disabled=${calendarTaskDraft.itemType !== "Task"}
                >
                  ${["Low", "Normal", "High", "Urgent"].map((option) => html`<option key=${option} value=${option}>${option}</option>`)}
                </select>
              </label>
            </div>
            <label className="settings-toggle-row calendar-toggle-row">
              <input
                type="checkbox"
                checked=${calendarTaskDraft.allDay}
                onChange=${(event) => onCalendarTaskDraftChange("allDay", event.target.checked)}
              />
              <span>All day</span>
            </label>
            <label className="settings-toggle-row calendar-toggle-row">
              <input
                type="checkbox"
                checked=${calendarTaskDraft.repeat || calendarTaskDraft.frequency !== "Never"}
                onChange=${(event) => onCalendarTaskDraftChange("repeat", event.target.checked)}
              />
              <span>Repeat</span>
            </label>
            ${draftConflict
              ? html`
                  <div className="conflict-warning">
                    <strong>Schedule Conflict</strong>
                    <p>${draftConflict.message}</p>
                    <div>
                      <button type="button" className="secondary-button" onClick=${() => onCalendarTaskDraftChange("scheduledTime", "")}>Reschedule</button>
                      <button type="submit" className="secondary-button">Keep Both</button>
                    </div>
                  </div>
                `
              : null}
            <div className="card-footer-row">
              <span>${draftConflict ? "VIRELI found an overlap before saving." : "Calendar updates Home and Ask VIRELI immediately."}</span>
              <div className="calendar-form-actions">
                ${editingCalendarTaskId
                  ? html`
                      <button type="button" className="secondary-button" onClick=${onCalendarTaskCancelEdit}>
                        Cancel edit
                      </button>
                    `
                  : null}
                <button type="submit" className="primary-button" disabled=${!calendarTaskDraft.title.trim()}>
                  ${editingCalendarTaskId ? "Save changes" : "Save"}
                </button>
              </div>
            </div>
          </form>
        </article>

        <article className="feature-card calendar-today-card">
          <h3 className="font-display section-title-lg">Today</h3>
          <div className="calendar-today-list">
            <div><strong>${dueToday.length}</strong><span>due today</span></div>
            <div><strong>${monthItems.length}</strong><span>this month</span></div>
            <div><strong>${selectedDayItems.length}</strong><span>selected day</span></div>
            <div><strong>${visibleCalendarItems.length}</strong><span>upcoming</span></div>
          </div>
        </article>

        <article className="feature-card selected-day-card">
          <p className="eyebrow">Selected day</p>
          <h3 className="font-display section-title-lg">${formatShortDate(selectedDateValue)}</h3>
          ${chronologicalDayItems.length
            ? html`
                <div className="selected-day-list">
                  ${chronologicalDayItems.map(
                    (item) => html`
                      <div key=${item.id} className=${cx("selected-day-item", `is-${item.source}`)}>
                        <div>
                          <strong>${item.title}</strong>
                          <span>${[item.timeLabel, item.durationLabel, item.subject].filter(Boolean).join(" · ")}</span>
                        </div>
                        ${item.source === "plan" || item.source === "calendar"
                          ? html`
                              <div className="calendar-detail-actions">
                                <button
                                  type="button"
                                  className="secondary-button"
                                  onClick=${() => item.source === "plan" ? onHomeworkCompleteToggle(item.id) : onCalendarTaskToggle(item.id)}
                                >
                                  Complete
                                </button>
                                ${item.source === "calendar"
                                  ? html`
                                      <button
                                        type="button"
                                        className="secondary-button"
                                        onClick=${() => onCalendarTaskEdit(item.id)}
                                      >
                                        Edit
                                      </button>
                                    `
                                  : null}
                                ${item.source === "plan"
                                  ? html`
                                      <button
                                        type="button"
                                        className="secondary-button"
                                        onClick=${() => onHomeworkReschedule(item.id, selectedDateValue, "16:00")}
                                      >
                                        Reschedule
                                      </button>
                                    `
                                  : null}
                                <button
                                  type="button"
                                  className="secondary-button"
                                  onClick=${() => item.source === "plan" ? onHomeworkDelete(item.id) : onCalendarTaskDelete(item.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            `
                          : null}
                      </div>
                    `,
                  )}
                </div>
              `
            : html`<p>Your day is open.</p>`}
        </article>

        <article className="feature-card selected-day-card">
          <p className="eyebrow">Tasks and events</p>
          <h3 className="font-display section-title-lg">${selectedDayItems.length} saved</h3>
          ${selectedDayItems.length
            ? html`
                <div className="selected-day-list">
                  ${selectedDayItems.map(
                    (item) => html`
                      <div key=${item.calendarId} className=${cx("selected-day-item", `is-${item.source}`)}>
                        <div>
                          <strong>${item.title}</strong>
                          <span>${[
                            item.subject,
                            item.allDay ? "All day" : item.scheduledTime ? formatTimeLabel(item.scheduledTime) : "",
                            getFrequencyLabel(item.frequency),
                            item.priority && item.priority !== "Normal" ? item.priority : "",
                          ].filter(Boolean).join(" · ")}</span>
                        </div>
                        <div className="calendar-detail-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick=${() => item.source === "homework" ? onHomeworkCompleteToggle(item.id) : onCalendarTaskToggle(item.id)}
                          >
                            Complete
                          </button>
                          ${item.source !== "homework"
                            ? html`
                                <button
                                  type="button"
                                  className="secondary-button"
                                  onClick=${() => onCalendarTaskEdit(item.id)}
                                >
                                  Edit
                                </button>
                              `
                            : null}
                          ${item.source === "homework"
                            ? html`
                                <button
                                  type="button"
                                  className="secondary-button"
                                  onClick=${() => onHomeworkReschedule(item.id, selectedDateValue, item.scheduledTime || "16:00")}
                                >
                                  Reschedule
                                </button>
                              `
                            : null}
                          <button
                            type="button"
                            className="secondary-button"
                            onClick=${() => item.source === "homework" ? onHomeworkDelete(item.id) : onCalendarTaskDelete(item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    `,
                  )}
                </div>
              `
            : html`<p>No saved plans for this day.</p>`}
        </article>

        <article className="feature-card feature-card-quote-wide month-calendar-card">
          ${calendarView === "day"
            ? html`
                <div className="calendar-day-focus">
                  <h3 className="font-display">${formatShortDate(selectedDateValue)}</h3>
                  <div className="selected-day-list">
                    ${chronologicalDayItems.map(
                      (item) => html`
                        <div key=${`day-${item.id}`} className=${cx("selected-day-item", `is-${item.source}`)}>
                          <div>
                            <strong>${item.title}</strong>
                            <span>${item.timeLabel} · ${item.durationLabel}</span>
                          </div>
                        </div>
                      `,
                    )}
                  </div>
                </div>
              `
            : calendarView === "week"
              ? html`
                  <div className="week-calendar-grid">
                    ${weekDates.map((dateInfo) => {
                      const itemsForDay = visibleCalendarItems.filter((item) => item.calendarDate === dateInfo.value);
                      return html`
                        <button
                          type="button"
                          key=${`week-${dateInfo.value}`}
                          className=${cx("week-date-cell", dateInfo.isToday && "is-today", dateInfo.value === selectedDateValue && "is-selected")}
                          onClick=${() => onSelectedDateChange(dateInfo.value)}
                        >
                          <span>${dateInfo.label}</span>
                          <strong>${dateInfo.day}</strong>
                          ${itemsForDay.slice(0, 4).map((item) => html`<small key=${item.calendarId}>${item.title}</small>`)}
                        </button>
                      `;
                    })}
                  </div>
                `
              : html`
                  <div className="month-calendar-grid">
                    ${WEEKDAY_LABELS.map(
                      (day) => html`<div key=${day} className="month-weekday">${day}</div>`,
                    )}
                    ${monthDates.map((dateInfo) => {
                      const itemsForDay = visibleCalendarItems.filter((item) => item.calendarDate === dateInfo.value);
                      return html`
                        <button
                          type="button"
                          key=${dateInfo.value}
                          className=${cx(
                            "month-date-cell",
                            !dateInfo.isCurrentMonth && "is-muted",
                            dateInfo.isToday && "is-today",
                            dateInfo.value === selectedDateValue && "is-selected",
                            dateInfo.value < today && "is-past",
                          )}
                          onClick=${() => onSelectedDateChange(dateInfo.value)}
                          aria-label=${`Select ${formatShortDate(dateInfo.value)}`}
                        >
                          <div className="month-date-head">
                            <span>${dateInfo.day}</span>
                          </div>
                          <div className="month-date-items">
                            ${itemsForDay.slice(0, 3).map(
                              (item) => html`
                                <span
                                  key=${item.calendarId}
                                  className=${cx("month-event-chip", item.completed && "is-complete")}
                                >
                                  ${item.subject}: ${item.title}
                                </span>
                              `,
                            )}
                            ${itemsForDay.length > 3
                              ? html`<small className="month-more-count">+${itemsForDay.length - 3} more</small>`
                              : null}
                          </div>
                        </button>
                      `;
                    })}
                  </div>
                `}
        </article>
      </div>
    </${motion.section}>
  `;
}

function AskVireliTab({
  messages,
  recentAskHistory,
  chatDraft,
  isTyping,
  chatError,
  onLoadAskHistory,
  onChatDraftChange,
  onChatSubmit,
  onChatRetry,
}) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  return html`
    <${motion.section}
      key="ask"
      className="tab-view"
      initial=${{ opacity: 0, y: 20 }}
      animate=${{ opacity: 1, y: 0 }}
      exit=${{ opacity: 0, y: -16 }}
      transition=${{ duration: 0.35 }}
    >
      <div className="tab-heading">
        <div>
          <p className="eyebrow">Ask VIRELI</p>
          <h1 className="font-display">Find the best time for a task.</h1>
          <p className="tab-heading-lead">
            Tell VIRELI what you need to do. It will look at your routine and
            calendar, suggest a time, then ask before adding anything.
          </p>
        </div>
      </div>

      <div className="assistant-shell">
        <div className="chat-shell">
          <div className="ask-empty-note">
            <p className="eyebrow">Scheduling helper</p>
            <h2 className="font-display">Type a task and VIRELI will find an opening.</h2>
            <p>
              Try “Study science,” “Practice piano,” or “Finish my math worksheet.”
            </p>
          </div>

          <div className="message-scroll">
            ${messages.map(
              (message) => html`
                <div
                  key=${message.id}
                  className=${cx("message-row", `is-${message.role}`)}
                >
                  <div
                    className=${cx("message-bubble", `is-${message.role}`)}
                  >
                    ${message.content}
                  </div>
                </div>
              `,
            )}

            ${isTyping
              ? html`
                  <div className="message-row is-assistant">
                    <div className="message-bubble is-assistant is-typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                `
              : null}

            ${chatError
              ? html`
                  <div className="message-row is-assistant">
                    <div className="message-bubble is-assistant is-error">
                      ${chatError}
                      <button
                        type="button"
                        className="inline-retry-button"
                        onClick=${onChatRetry}
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                `
              : null}

            <div ref=${endRef}></div>
          </div>

          <form className="chat-input-row" onSubmit=${onChatSubmit}>
            <input
              type="text"
              value=${chatDraft}
              onInput=${(event) => onChatDraftChange(event.target.value)}
              placeholder="What task do you need time for?"
              aria-label="Ask VIRELI"
              disabled=${isTyping}
            />
            <button
              type="submit"
              className="primary-button"
              disabled=${!chatDraft.trim() || isTyping}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </${motion.section}>
  `;
}

function ImproveTab({
  feedbackDraft,
  feedbackSubmitted,
  onFeedbackChange,
  onFeedbackAreaChange,
  onFeedbackSubmit,
}) {
  return html`
    <${motion.section}
      key="improve"
      className="tab-view"
      initial=${{ opacity: 0, y: 20 }}
      animate=${{ opacity: 1, y: 0 }}
      exit=${{ opacity: 0, y: -16 }}
      transition=${{ duration: 0.35 }}
    >
      <div className="tab-heading">
        <div>
          <p className="eyebrow">How can we improve</p>
          <h1 className="font-display">Tell us how to make this better.</h1>
        </div>
      </div>

      <article className="feature-card improve-card">
        <div className="card-topline">
          <span className="eyebrow">Feedback space</span>
        </div>
        <h3 className="font-display">Feedback</h3>
        <p>
          Pick the area, then write what should be better.
        </p>

        ${feedbackSubmitted
          ? html`
              <div className="status-banner status-banner-soft">
                Thanks for helping shape VIRELI.
              </div>
            `
          : null}

        <label className="field-stack">
          <span>Area</span>
          <select
            className="planning-input"
            value=${feedbackDraft.area}
            onChange=${(event) => onFeedbackAreaChange(event.target.value)}
          >
            <option value="">Choose an area</option>
            ${FEEDBACK_AREAS.map(
              (area) => html`<option key=${area} value=${area}>${area}</option>`,
            )}
          </select>
        </label>

        <textarea
          className="feedback-input"
          value=${feedbackDraft.text}
          onInput=${(event) => onFeedbackChange(event.target.value)}
          placeholder="What should be improved?"
          rows="8"
        ></textarea>

        <div className="card-footer-row">
          <span>Friendly suggestions, big or small, are welcome.</span>
          <button
            type="button"
            className="primary-button"
            onClick=${onFeedbackSubmit}
            disabled=${!feedbackDraft.area || !feedbackDraft.text.trim()}
          >
            Submit
          </button>
        </div>
      </article>
    </${motion.section}>
  `;
}

function SettingsTab({
  savedClasses,
  classDraft,
  archivedAskHistory,
  dailyLogs,
  calendarPreferences,
  profile,
  profileDraft,
  onClassDraftChange,
  onClassAdd,
  onClassUpdate,
  onClassRemove,
  onProfileDraftChange,
  onAccountSubmit,
  onDisconnectProfile,
  onCalendarPreferenceChange,
  onTabChange,
}) {
  return html`
    <${motion.section}
      key="settings"
      className="tab-view"
      initial=${{ opacity: 0, y: 20 }}
      animate=${{ opacity: 1, y: 0 }}
      exit=${{ opacity: 0, y: -16 }}
      transition=${{ duration: 0.35 }}
    >
      <div className="tab-heading">
        <div>
          <p className="eyebrow">Settings</p>
          <h1 className="font-display">Change the website for you</h1>
        </div>
      </div>

      <div className="settings-list">
        <details className="settings-list-row" open>
          <summary>
            <span>Create an Account</span>
            <small>
              ${profile.connected
                ? profile.email || "Local account"
                : profile.guest
                  ? "Guest mode"
                  : "Optional"}
            </small>
          </summary>
          <div className="settings-row-body">
            <p>
              ${profile.connected
                ? `Signed in locally as ${profile.name || profile.email || "VIRELI user"}.`
                : profile.guest
                  ? "Using VIRELI as a guest on this device."
                  : "Account connection is optional. You can use VIRELI without signing in."}
            </p>
            <div className="profile-form">
              <label className="field-stack">
                <span>Email</span>
                <input
                  className="planning-input"
                  value=${profileDraft.email}
                  onInput=${(event) => onProfileDraftChange("email", event.target.value)}
                  placeholder="you@gmail.com"
                  type="email"
                />
              </label>
              <label className="field-stack">
                <span>Password</span>
                <input
                  className="planning-input"
                  value=${profileDraft.password}
                  onInput=${(event) => onProfileDraftChange("password", event.target.value)}
                  placeholder="Password"
                  type="password"
                />
              </label>
            </div>
            <div className="settings-action-row">
              <button
                type="button"
                className="secondary-button"
                onClick=${(event) => onAccountSubmit(event, "signin")}
                disabled=${!profileDraft.email.trim() || !profileDraft.password.trim()}
              >
                Save sign in
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick=${onDisconnectProfile}
                disabled=${!profile.connected && !profile.guest}
              >
                Disconnect
              </button>
            </div>
          </div>
        </details>

        <details className="settings-list-row">
          <summary>
            <span>Subjects</span>
            <small>${savedClasses.length} saved</small>
          </summary>
          <div className="settings-row-body">
            <div className="settings-class-list">
              ${savedClasses.length
                ? savedClasses.map(
                    (schoolClass) => html`
                      <div key=${schoolClass.id} className="settings-class-row">
                        <input
                          className="planning-input"
                          value=${schoolClass.label}
                          onInput=${(event) => onClassUpdate(schoolClass.id, event.target.value)}
                          aria-label=${`Subject name: ${schoolClass.label}`}
                        />
                        <button
                          type="button"
                          className="secondary-button"
                          onClick=${() => onClassRemove(schoolClass.id)}
                        >
                          Remove
                        </button>
                      </div>
                    `,
                  )
                : html`<div className="soft-note"><p>No subjects saved yet.</p></div>`}
            </div>

            <form className="settings-add-class-form" onSubmit=${onClassAdd}>
              <label className="field-stack">
                <span>Add subject</span>
                <input
                  className="planning-input"
                  value=${classDraft}
                  onInput=${(event) => onClassDraftChange(event.target.value)}
                  placeholder="Math, Biology, Debate..."
                />
              </label>
              <button
                type="submit"
                className="secondary-button"
                disabled=${!classDraft.trim()}
              >
                Add subject
              </button>
            </form>
          </div>
        </details>

        <details className="settings-list-row">
          <summary>
            <span>Notifications</span>
            <small>${calendarPreferences.remindersEnabled ? "On" : "Off"}</small>
          </summary>
          <div className="settings-row-body">
            <p>Keep reminders gentle. VIRELI should help you restart, not make you feel guilty.</p>
            <label className="settings-toggle-row">
              <input
                type="checkbox"
                checked=${calendarPreferences.remindersEnabled}
                onChange=${(event) => onCalendarPreferenceChange("remindersEnabled", event.target.checked)}
              />
              <span>Reminders on</span>
            </label>
            <label className="field-stack">
              <span>Gentle reminder timing</span>
              <select
                className="planning-input"
                value=${calendarPreferences.reminderTiming}
                onChange=${(event) => onCalendarPreferenceChange("reminderTiming", event.target.value)}
                disabled=${!calendarPreferences.remindersEnabled}
              >
                ${REMINDER_TIMING_OPTIONS.map(
                  (option) => html`<option key=${option} value=${option}>${option}</option>`,
                )}
              </select>
            </label>
          </div>
        </details>

        <details className="settings-list-row">
          <summary>
            <span>Scheduling</span>
            <small>Workload limits</small>
          </summary>
          <div className="settings-row-body">
            <p>Preferred workload, wake time, bedtime, and fixed commitments live in Your Routine so VIRELI can schedule from one source of truth.</p>
            <button type="button" className="secondary-button" onClick=${() => onTabChange("routine")}>
              Open Your Routine
            </button>
          </div>
        </details>

        <details className="settings-list-row">
          <summary>
            <span>Privacy</span>
            <small>Local storage</small>
          </summary>
          <div className="settings-row-body">
            <p>VIRELI keeps profile, routine, classes, logs, chats, and calendar data on this device in local storage.</p>
            <div className="soft-note">
              <p>Google sign-in works when the local server has a Google web client ID. Calendar and Gmail sync are still not active.</p>
            </div>
          </div>
        </details>

        <details className="settings-list-row">
          <summary>
            <span>Appearance</span>
            <small>Automatic</small>
          </summary>
          <div className="settings-row-body">
            <p>VIRELI automatically adjusts its atmosphere by time of day and mood check-in.</p>
            <label className="settings-toggle-row">
              <input
                type="checkbox"
                checked=${calendarPreferences.noGuiltLanguage}
                onChange=${(event) => onCalendarPreferenceChange("noGuiltLanguage", event.target.checked)}
              />
              <span>No guilt language</span>
            </label>
          </div>
        </details>

        <details className="settings-list-row">
          <summary>
            <span>Daily Logs</span>
            <small>${dailyLogs.length}</small>
          </summary>
          <div className="settings-row-body">
            <p>Review saved reflections from the Daily Log tab.</p>

          <div className="history-list">
            ${dailyLogs.length
              ? dailyLogs.map(
                  (log) => html`
                    <details key=${log.id} className="history-item">
                      <summary>
                        <span>${log.rating || "Daily Log"}</span>
                        <small>${formatDateTime(log.updatedAt)}</small>
                      </summary>
                      <div className="history-messages">
                        <p><strong>Could it have gone better:</strong> ${log.couldBeBetter || "Not set"}</p>
                        <p><strong>Activities:</strong> ${(log.activities || []).filter(Boolean).join(", ") || "Not listed"}</p>
                        <p><strong>Went well:</strong> ${log.wentWell || "Not listed"}</p>
                        <p><strong>Did not go well:</strong> ${log.didNotGoWell || "Not listed"}</p>
                        ${log.highlight
                          ? html`<p><strong>Highlight:</strong> ${log.highlight}</p>`
                          : null}
                      </div>
                    </details>
                  `,
                )
              : html`<div className="soft-note"><p>No Daily Logs saved yet.</p></div>`}
          </div>
          </div>
        </details>

      </div>
    </${motion.section}>
  `;
}

function DashboardShell({
  activeTab,
  todayLabel,
  timeMode,
  moodSelection,
  moodInfo,
  moodNote,
  feedbackDraft,
  feedbackSubmitted,
  dailyLogDraft,
  dailyLogSubmitted,
  chatDraft,
  messages,
  recentAskHistory,
  archivedAskHistory,
  profile,
  profileDraft,
  isTyping,
  chatError,
  savedClasses,
  routine,
  homeworkItems,
  homeworkDraft,
  calendarTasks,
  calendarTaskDraft,
  editingCalendarTaskId,
  calendarMonth,
  calendarView,
  selectedCalendarDate,
  calendarPreferences,
  dailyLogs,
  thoughts,
  thoughtDraft,
  classDraft,
  routineDraft,
  onTabChange,
  onHomeworkDraftChange,
  onHomeworkSubmit,
  onHomeworkCompleteToggle,
  onHomeworkDelete,
  onPlanNotificationDismiss,
  onHomeworkReschedule,
  onCalendarTaskDraftChange,
  onCalendarTaskSubmit,
  onCalendarTaskEdit,
  onCalendarTaskCancelEdit,
  onCalendarMonthChange,
  onCalendarViewChange,
  onSelectedCalendarDateChange,
  onCalendarTaskToggle,
  onCalendarTaskDelete,
  onRoutineChange,
  onRoutineWorkloadSelect,
  onRoutineActivityChange,
  onRoutineActivityAdd,
  onRoutineActivityRemove,
  onSaveRoutine,
  onClassDraftChange,
  onClassAdd,
  onClassUpdate,
  onClassRemove,
  onProfileDraftChange,
  onAccountSubmit,
  onDisconnectProfile,
  onLoadAskHistory,
  onChatDraftChange,
  onChatSubmit,
  onChatRetry,
  onFeedbackChange,
  onFeedbackAreaChange,
  onFeedbackSubmit,
  onDailyLogChange,
  onDailyActivityChange,
  onDailyActivityAdd,
  onDailyActivityRemove,
  onDailyActivitiesLockToggle,
  onDailyLogSubmit,
  onThoughtDraftChange,
  onThoughtAdd,
  onThoughtUpdate,
  onThoughtDelete,
  onThoughtArchive,
  onThoughtHandled,
  onThoughtConvertToTask,
  onThoughtAskVireli,
  onClearAskHistory,
  onClearDailyLogs,
  onResetSubjects,
  onCalendarPreferenceChange,
}) {
  let activeView = null;
  const topSchedule = getTodayScheduleBlocks({ routine, homeworkItems, calendarTasks });
  const pageLabel = NAV_ITEMS.find((item) => item.id === activeTab)?.label || "Home";
  const intelligentStatus = getIntelligentStatus({ routine, homeworkItems, calendarTasks, savedClasses });
  const notifications = getNotifications({ routine, homeworkItems, calendarTasks });

  if (activeTab === "home") {
    activeView = html`
      <${HomeTab}
        profile=${profile}
        routine=${routine}
        homeworkItems=${homeworkItems}
        calendarTasks=${calendarTasks}
        savedClasses=${savedClasses}
        moodSelection=${moodSelection}
        chatDraft=${chatDraft}
        onTabChange=${onTabChange}
        onChatDraftChange=${onChatDraftChange}
        onHomeworkCompleteToggle=${onHomeworkCompleteToggle}
        onHomeworkReschedule=${onHomeworkReschedule}
        onHomeworkDelete=${onHomeworkDelete}
      />
    `;
  } else if (activeTab === "assignments") {
    activeView = html`
      <${PlanTodayTab}
        todayLabel=${todayLabel}
        timeMode=${timeMode}
        savedClasses=${savedClasses}
        homeworkItems=${homeworkItems}
        homeworkDraft=${homeworkDraft}
        onHomeworkDraftChange=${onHomeworkDraftChange}
        onHomeworkSubmit=${onHomeworkSubmit}
        onHomeworkCompleteToggle=${onHomeworkCompleteToggle}
        onHomeworkDelete=${onHomeworkDelete}
        onPlanNotificationDismiss=${onPlanNotificationDismiss}
      />
    `;
  } else if (activeTab === "calendar") {
    activeView = html`
      <${CalendarTab}
        homeworkItems=${homeworkItems}
        calendarTasks=${calendarTasks}
        calendarTaskDraft=${calendarTaskDraft}
        editingCalendarTaskId=${editingCalendarTaskId}
        calendarMonth=${calendarMonth}
        calendarView=${calendarView}
        selectedDate=${selectedCalendarDate}
        savedClasses=${savedClasses}
        routine=${routine}
        onCalendarTaskDraftChange=${onCalendarTaskDraftChange}
        onCalendarTaskSubmit=${onCalendarTaskSubmit}
        onCalendarTaskEdit=${onCalendarTaskEdit}
        onCalendarTaskCancelEdit=${onCalendarTaskCancelEdit}
        onCalendarMonthChange=${onCalendarMonthChange}
        onCalendarViewChange=${onCalendarViewChange}
        onSelectedDateChange=${onSelectedCalendarDateChange}
        onHomeworkCompleteToggle=${onHomeworkCompleteToggle}
        onHomeworkReschedule=${onHomeworkReschedule}
        onHomeworkDelete=${onHomeworkDelete}
        onCalendarTaskToggle=${onCalendarTaskToggle}
        onCalendarTaskDelete=${onCalendarTaskDelete}
      />
    `;
  } else if (activeTab === "routine") {
    activeView = html`
      <${RoutineTab}
        routineDraft=${routineDraft}
        routine=${routine}
        homeworkItems=${homeworkItems}
        calendarTasks=${calendarTasks}
        onRoutineChange=${onRoutineChange}
        onRoutineWorkloadSelect=${onRoutineWorkloadSelect}
        onRoutineActivityChange=${onRoutineActivityChange}
        onRoutineActivityAdd=${onRoutineActivityAdd}
        onRoutineActivityRemove=${onRoutineActivityRemove}
        onSaveRoutine=${onSaveRoutine}
      />
    `;
  } else if (activeTab === "daily-log") {
    activeView = html`
      <${DailyLogTab}
        timeMode=${timeMode}
        dailyLogDraft=${dailyLogDraft}
        dailyLogSubmitted=${dailyLogSubmitted}
        dailyLogs=${dailyLogs}
        thoughts=${thoughts}
        thoughtDraft=${thoughtDraft}
        onDailyLogChange=${onDailyLogChange}
        onDailyActivityChange=${onDailyActivityChange}
        onDailyActivityAdd=${onDailyActivityAdd}
        onDailyActivityRemove=${onDailyActivityRemove}
        onDailyActivitiesLockToggle=${onDailyActivitiesLockToggle}
        onDailyLogSubmit=${onDailyLogSubmit}
        onThoughtDraftChange=${onThoughtDraftChange}
        onThoughtAdd=${onThoughtAdd}
        onThoughtUpdate=${onThoughtUpdate}
        onThoughtDelete=${onThoughtDelete}
        onThoughtArchive=${onThoughtArchive}
        onThoughtHandled=${onThoughtHandled}
        onThoughtConvertToTask=${onThoughtConvertToTask}
        onThoughtAskVireli=${onThoughtAskVireli}
      />
    `;
  } else if (activeTab === "ask") {
    activeView = html`
      <${AskVireliTab}
        messages=${messages}
        recentAskHistory=${recentAskHistory}
        chatDraft=${chatDraft}
        isTyping=${isTyping}
        chatError=${chatError}
        onLoadAskHistory=${onLoadAskHistory}
        onChatDraftChange=${onChatDraftChange}
        onChatSubmit=${onChatSubmit}
        onChatRetry=${onChatRetry}
      />
    `;
  } else if (activeTab === "improve") {
    activeView = html`
      <${ImproveTab}
        feedbackDraft=${feedbackDraft}
        feedbackSubmitted=${feedbackSubmitted}
        onFeedbackChange=${onFeedbackChange}
        onFeedbackAreaChange=${onFeedbackAreaChange}
        onFeedbackSubmit=${onFeedbackSubmit}
      />
    `;
  } else {
    activeView = html`
      <${SettingsTab}
        savedClasses=${savedClasses}
        classDraft=${classDraft}
        archivedAskHistory=${archivedAskHistory}
        dailyLogs=${dailyLogs}
        calendarPreferences=${calendarPreferences}
        profile=${profile}
        profileDraft=${profileDraft}
        onClassDraftChange=${onClassDraftChange}
        onClassAdd=${onClassAdd}
        onClassUpdate=${onClassUpdate}
        onClassRemove=${onClassRemove}
        onProfileDraftChange=${onProfileDraftChange}
        onAccountSubmit=${onAccountSubmit}
        onDisconnectProfile=${onDisconnectProfile}
        onCalendarPreferenceChange=${onCalendarPreferenceChange}
        onTabChange=${onTabChange}
      />
    `;
  }

  return html`
    <${motion.section}
      className="dashboard-screen min-h-screen relative overflow-hidden"
      initial=${{ opacity: 0 }}
      animate=${{ opacity: 1 }}
      exit=${{ opacity: 0 }}
      transition=${{ duration: 0.45 }}
    >
      <${CircleBackdrop} />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1480px] flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <header className="surface-panel topbar">
          <div className="topbar-brand-mark" aria-label="VIRELI">
            <${VireliLogoMark} className="brand-mark" />
          </div>
          <nav className="topbar-nav" aria-label="Primary navigation">
            ${PRIMARY_NAV_ITEMS.map(
              (item) => html`
                <button
                  key=${item.id}
                  type="button"
                  className=${cx("topbar-nav-button", activeTab === item.id && "is-active")}
                  onClick=${() => onTabChange(item.id)}
                >
                  ${item.label}
                </button>
              `,
            )}
          </nav>
          <h1 className="topbar-page-name font-display">${pageLabel}</h1>
          <div className="topbar-actions">
            <details className="topbar-menu topbar-status-menu">
              <summary>${intelligentStatus.label}</summary>
              <div className="topbar-dropdown">
                <strong>${intelligentStatus.detail}</strong>
                ${intelligentStatus.freeWindows.length
                  ? html`
                      <div className="topbar-free-list">
                        ${intelligentStatus.freeWindows.map(
                          (windowBlock) => html`
                            <p key=${windowBlock.id}>
                              <span>${windowBlock.label}</span>
                              <small>${windowBlock.durationLabel}</small>
                            </p>
                          `,
                        )}
                      </div>
                    `
                  : html`<p>No open free-time windows right now.</p>`}
              </div>
            </details>
            <details className="topbar-menu notification-menu">
              <summary aria-label="Notifications">
                <span>Bell</span>
                ${notifications.length ? html`<i aria-hidden="true"></i>` : null}
              </summary>
              <div className="topbar-dropdown">
                <strong>Notifications</strong>
                ${notifications.length
                  ? notifications.map(
                      (notice) => html`
                        <p key=${notice.id}>
                          <span>${notice.title}</span>
                          <small>${notice.message}</small>
                        </p>
                      `,
                    )
                  : html`<p>Nothing needs attention.</p>`}
              </div>
            </details>
            <details className="topbar-menu profile-menu">
              <summary aria-label="Profile">${profile.picture ? html`<img src=${profile.picture} alt="" />` : html`<span>${(profile.name || "V").charAt(0).toUpperCase()}</span>`}</summary>
              <div className="topbar-dropdown">
                <strong>${profile.name || "VIRELI user"}</strong>
                <button type="button" onClick=${() => onTabChange("settings")}>Settings</button>
                <button type="button" onClick=${onDisconnectProfile}>Sign Out</button>
              </div>
            </details>
          </div>
        </header>

        <div className="dashboard-layout">
          <aside className="surface-panel sidebar-panel">
            <div className="sidebar-head">
              <p className="eyebrow">Navigation</p>
              <h2 className="font-display">Navigate through VIRELI</h2>
            </div>

            <nav className="sidebar-nav" aria-label="Primary">
              ${PRIMARY_NAV_ITEMS.map(
                (item) => html`
                  <button
                    key=${item.id}
                    type="button"
                    className=${cx("nav-button", activeTab === item.id && "is-active")}
                    onClick=${() => onTabChange(item.id)}
                  >
                    ${item.label}
                  </button>
                `,
              )}
            </nav>
            <div className="sidebar-secondary-links">
              <button type="button" className="secondary-button" onClick=${() => onTabChange("improve")}>
                Improve
              </button>
              <button type="button" className="secondary-button" onClick=${() => onTabChange("settings")}>
                Settings
              </button>
            </div>
          </aside>

          <main className="surface-panel content-panel">
            <${AnimatePresence} mode="wait">${activeView}</${AnimatePresence}>
          </main>
        </div>

        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
          ${MOBILE_NAV_ITEMS.map(
            (item) => html`
              <button
                key=${item.id}
                type="button"
                className=${cx("mobile-nav-button", (item.id === activeTab || (item.id === "more" && ["routine", "daily-log", "settings", "improve"].includes(activeTab))) && "is-active")}
                onClick=${() => onTabChange(item.id === "more" ? "settings" : item.id)}
              >
                ${item.label}
              </button>
            `,
          )}
        </nav>
      </div>
    </${motion.section}>
  `;
}

function App() {
  const [introComplete, setIntroComplete] = useState(() => {
    const savedProfile = loadProfile();
    return Boolean((savedProfile.connected || savedProfile.guest) && savedProfile.setupComplete);
  });
  const [moodSelection, setMoodSelection] = useState("");
  const [moodNote, setMoodNote] = useState("");
  const [moodCheckInComplete, setMoodCheckInComplete] = useState(() => {
    const savedProfile = loadProfile();
    return Boolean(savedProfile.setupComplete);
  });
  const [profileStepComplete, setProfileStepComplete] = useState(() => {
    const savedProfile = loadProfile();
    return Boolean((savedProfile.connected || savedProfile.guest) && savedProfile.setupComplete);
  });
  const [routineStepComplete, setRoutineStepComplete] = useState(() => {
    const savedProfile = loadProfile();
    return Boolean(savedProfile.setupComplete);
  });
  const [activeTab, setActiveTab] = useState("home");
  const [feedbackDraft, setFeedbackDraft] = useState(EMPTY_FEEDBACK_DRAFT);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [responseType, setResponseType] = useState("conversation");
  const [pendingScheduleSuggestion, setPendingScheduleSuggestion] = useState(null);
  const [messages, setMessages] = useState(() => buildInitialMessages("ok"));
  const [askHistory, setAskHistory] = useState(loadAskHistory);
  const [profile, setProfile] = useState(loadProfile);
  const [profileDraft, setProfileDraft] = useState(() => loadProfile());
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [emailAuthStep, setEmailAuthStep] = useState("email");
  const [emailAuthEmail, setEmailAuthEmail] = useState("");
  const [emailAuthCode, setEmailAuthCode] = useState("");
  const [emailAuthMode, setEmailAuthMode] = useState("signin");
  const [emailAuthStatus, setEmailAuthStatus] = useState("idle");
  const [emailAuthError, setEmailAuthError] = useState("");
  const [emailAuthMessage, setEmailAuthMessage] = useState("");
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleAuthStatus, setGoogleAuthStatus] = useState("unconfigured");
  const [googleAuthError, setGoogleAuthError] = useState("");
  const [routine, setRoutine] = useState(loadRoutine);
  const [routineDraft, setRoutineDraft] = useState(loadRoutine);
  const [isTyping, setIsTyping] = useState(false);
  const [chatError, setChatError] = useState("");
  const [lastFailedPrompt, setLastFailedPrompt] = useState("");
  const [savedClasses, setSavedClasses] = useState(loadSavedClasses);
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [customClassDraft, setCustomClassDraft] = useState("");
  const [customClassNames, setCustomClassNames] = useState([]);
  const [homeworkItems, setHomeworkItems] = useState(loadSavedHomework);
  const [homeworkDraft, setHomeworkDraft] = useState(EMPTY_HOMEWORK_DRAFT);
  const [calendarTasks, setCalendarTasks] = useState(loadCalendarTasks);
  const [calendarTaskDraft, setCalendarTaskDraft] = useState(EMPTY_CALENDAR_TASK_DRAFT);
  const [editingCalendarTaskId, setEditingCalendarTaskId] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState("week");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(getDateInputValue);
  const [calendarPreferences, setCalendarPreferences] = useState(loadCalendarPreferences);
  const [dailyLogDraft, setDailyLogDraft] = useState(loadDailyLog);
  const [dailyLogs, setDailyLogs] = useState(loadDailyLogs);
  const [dailyLogSubmitted, setDailyLogSubmitted] = useState(false);
  const [thoughts, setThoughts] = useState(loadThoughts);
  const [thoughtDraft, setThoughtDraft] = useState(EMPTY_THOUGHT_DRAFT);
  const [classDraft, setClassDraft] = useState("");
  const [undoToast, setUndoToast] = useState(null);
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);
  const [timeMode, setTimeMode] = useState(() => getTimeOfDayMode());
  const previousThemeRef = useRef("default");
  const askSessionIdRef = useRef(makeId("ask-session"));

  const todayLabel = useMemo(() => formatDate(), []);
  const moodInfo = MOOD_DETAILS[moodSelection] || MOOD_DETAILS.unchecked;
  const themeName = getMoodTheme(moodSelection);
  const recentAskHistory = useMemo(() => getRecentAskHistory(askHistory), [askHistory]);
  const archivedAskHistory = useMemo(() => getArchivedAskHistory(askHistory), [askHistory]);
  const currentSetupStep = Math.max(1, Math.min(4, Number(profile.setupStep || 1)));
  const dashboardReady = profileStepComplete && profile.setupComplete;

  function persistAskConversation(nextMessages = messages) {
    saveAskHistory([]);
    setAskHistory([]);
  }

  function showUndoToast(message, undoAction) {
    const id = makeId("undo");
    setUndoToast({ id, message, undoAction });
    window.setTimeout(() => {
      setUndoToast((currentToast) => (currentToast?.id === id ? null : currentToast));
    }, 7000);
  }

  function handleUndoToast() {
    if (!undoToast?.undoAction) {
      return;
    }

    undoToast.undoAction();
    setUndoToast(null);
  }

  useEffect(() => undefined, [introComplete]);

  useEffect(() => {
    document.body.dataset.theme = themeName;
    document.body.dataset.timeOfDay = timeMode;

    if (previousThemeRef.current !== themeName) {
      setIsThemeTransitioning(true);

      const transitionId = window.setTimeout(() => {
        setIsThemeTransitioning(false);
      }, THEME_TRANSITION_DURATION_MS);

      previousThemeRef.current = themeName;

      return () => {
        window.clearTimeout(transitionId);
        delete document.body.dataset.theme;
        delete document.body.dataset.timeOfDay;
      };
    }

    previousThemeRef.current = themeName;

    return () => {
      delete document.body.dataset.theme;
      delete document.body.dataset.timeOfDay;
    };
  }, [themeName, timeMode]);

  useEffect(() => {
    let timeoutId;

    function syncTimeMode() {
      setTimeMode(getTimeOfDayMode());
      timeoutId = window.setTimeout(syncTimeMode, getMsUntilNextTimeModeBoundary() + 50);
    }

    timeoutId = window.setTimeout(syncTimeMode, getMsUntilNextTimeModeBoundary() + 50);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    writePersistentArray(CLASS_STORAGE_KEY, savedClasses);
  }, [savedClasses]);

  useEffect(() => {
    writePersistentArray(HOMEWORK_STORAGE_KEY, homeworkItems);
  }, [homeworkItems]);

  useEffect(() => {
    writePersistentArray(CALENDAR_TASK_STORAGE_KEY, calendarTasks);
  }, [calendarTasks]);

  useEffect(() => {
    writePersistentObject(CALENDAR_PREFERENCES_STORAGE_KEY, calendarPreferences);
  }, [calendarPreferences]);

  useEffect(() => {
    writePersistentObject(ROUTINE_STORAGE_KEY, routine);
  }, [routine]);

  useEffect(() => {
    writePersistentObject(PROFILE_STORAGE_KEY, profile);
  }, [profile]);

  useEffect(() => {
    writePersistentArray(THOUGHT_STORAGE_KEY, thoughts);
  }, [thoughts]);

  useEffect(() => {
    if (!/^https?:$/.test(window.location.protocol)) {
      setGoogleAuthStatus("needs-server");
      return;
    }

    fetch("/api/config")
      .then((response) => (response.ok ? response.json() : {}))
      .then((config) => {
        const clientId = String(config.googleClientId || "").trim();
        setGoogleClientId(clientId);
        setGoogleAuthStatus(clientId ? "loading" : "unconfigured");
      })
      .catch(() => {
        setGoogleAuthStatus("unconfigured");
      });
  }, []);

  useEffect(() => {
    if (!/^https?:$/.test(window.location.protocol)) {
      return;
    }

    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : null))
      .then((session) => {
        if (!session?.authenticated || !session.user) {
          return;
        }

        completeAuthenticatedProfile(session.user, session.user.authMode || "email");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!googleClientId) {
      return undefined;
    }

    let cancelled = false;
    let retryId;

    function initializeGoogleSignIn() {
      if (cancelled) {
        return;
      }

      if (!window.google?.accounts?.id) {
        retryId = window.setTimeout(initializeGoogleSignIn, 180);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      setGoogleAuthStatus("ready");
    }

    initializeGoogleSignIn();

    return () => {
      cancelled = true;
      window.clearTimeout(retryId);
    };
  }, [googleClientId]);

  useEffect(() => {
    writePersistentArray(RECOMMENDATION_STORAGE_KEY, []);
    writePersistentArray(SCENARIO_AGENT_STORAGE_KEY, []);
    writePersistentArray(ASK_HISTORY_STORAGE_KEY, []);
    setAskHistory([]);
    if (typeof window !== "undefined") {
      window.__VIRELI_SCENARIO_AGENT_STATUS__ = {
        active: false,
        lastRunAt: "",
        lastResponseType: "",
        runCount: 0,
      };
    }
    if (typeof document !== "undefined" && document.body) {
      document.body.dataset.scenarioAgent = "inactive";
    }
  }, []);

  useEffect(() => {
    persistAskConversation(messages);
  }, [messages]);

  useEffect(() => {
    saveAskHistory([]);
  }, []);

  function handleClassToggle(classId) {
    setSelectedClassIds((currentIds) =>
      currentIds.includes(classId)
        ? currentIds.filter((item) => item !== classId)
        : [...currentIds, classId],
    );
  }

  function handleMoodSelect(choice) {
    setMoodSelection(choice);
    askSessionIdRef.current = makeId("ask-session");
    setMessages(buildInitialMessages(choice));
  }

  function handleOpeningGetStarted() {
    setIntroComplete(true);
  }

  function handleOpeningSignIn() {
    setIntroComplete(true);
  }

  function advanceSetupStep(nextStep, changes = {}) {
    const now = new Date().toISOString();
    setProfile((currentProfile) => {
      const nextProfile = {
        ...currentProfile,
        ...changes,
        setupStep: nextStep,
        timezone: currentProfile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "",
        updatedAt: now,
      };
      setProfileDraft(nextProfile);
      return nextProfile;
    });
  }

  function handleSetupAboutContinue() {
    advanceSetupStep(2, {
      name: profileDraft.name.trim() || profile.name,
      primaryUse: profileDraft.primaryUse || profile.primaryUse,
    });
  }

  function handleMoodContinue() {
    setMoodCheckInComplete(true);
    advanceSetupStep(3, {
      moodSelection: moodSelection || "skipped",
      moodNote: moodNote.trim(),
    });
  }

  function handleMoodSkip() {
    setMoodSelection("");
    setMoodNote("");
    setMoodCheckInComplete(true);
    advanceSetupStep(3, {
      moodSelection: "skipped",
      moodNote: "",
    });
  }

  function handleScheduleBasicsContinue() {
    const nextRoutine = saveRoutine(routineDraft);
    setRoutine(nextRoutine);
    setRoutineDraft(nextRoutine);
    advanceSetupStep(4);
  }

  function handleProfileDraftChange(field, value) {
    setProfileDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  }

  function completeAuthenticatedProfile(user, fallbackAuthMode = "email") {
    const now = new Date().toISOString();
    const authMode = user.authMode || fallbackAuthMode;
    const nextProfile = {
      ...EMPTY_PROFILE,
      connected: true,
      guest: false,
      name: user.name || user.email?.split("@")?.[0] || "VIRELI user",
      email: user.email || "",
      picture: user.picture || "",
      googleSub: user.googleSub || "",
      password: "",
      authMode,
      classSetupSkipped: profile.classSetupSkipped,
      routineSetupSkipped: profile.routineSetupSkipped,
      primaryUse: profile.primaryUse,
      setupComplete: Boolean(profile.setupComplete),
      setupStep: profile.setupComplete ? 4 : Math.max(1, Number(profile.setupStep || 1)),
      timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      schedulingPreferences: {
        ...EMPTY_PROFILE.schedulingPreferences,
        ...(profile.schedulingPreferences || {}),
      },
      createdAt: profile.createdAt || user.createdAt || now,
      updatedAt: now,
    };

    setProfile(nextProfile);
    setProfileDraft(nextProfile);
    setProfileStepComplete(true);
  }

  function handleAccountSubmit(event, authMode = "signin") {
    event?.preventDefault?.();

    const email = profileDraft.email.trim();
    const password = profileDraft.password.trim();

    if (!email || !password) {
      return;
    }

    const now = new Date().toISOString();
    const nextProfile = {
      ...EMPTY_PROFILE,
      connected: true,
      guest: false,
      name: email.split("@")[0] || "VIRELI user",
      email,
      password: "",
      authMode: `local-${authMode}`,
      classSetupSkipped: profile.classSetupSkipped,
      routineSetupSkipped: profile.routineSetupSkipped,
      primaryUse: profile.primaryUse,
      setupComplete: Boolean(profile.setupComplete),
      setupStep: profile.setupComplete ? 4 : Math.max(1, Number(profile.setupStep || 1)),
      timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      schedulingPreferences: {
        ...EMPTY_PROFILE.schedulingPreferences,
        ...(profile.schedulingPreferences || {}),
      },
      createdAt: profile.createdAt || now,
      updatedAt: now,
    };

    setProfile(nextProfile);
    setProfileDraft(nextProfile);
    setProfileStepComplete(true);
  }

  function focusVerificationCodeBox(index) {
    const inputs = document.querySelectorAll(".verification-code-box");
    inputs[Math.max(0, Math.min(index, EMAIL_AUTH_CODE_LENGTH - 1))]?.focus();
  }

  function handleEmailChange(value) {
    setEmailAuthEmail(value);
    setEmailAuthError("");
    setEmailAuthMessage("");
  }

  function handleEmailModeChange(mode) {
    setEmailAuthMode(mode);
    setEmailAuthError("");
    setEmailAuthMessage(mode === "signup" ? "Create account uses the same secure email code." : "");
  }

  async function requestEmailCode(route, successMessage) {
    const email = emailAuthEmail.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(email)) {
      setEmailAuthError("Enter a valid email address.");
      setEmailAuthMessage("");
      return false;
    }

    setEmailAuthStatus(route.includes("resend") ? "resending" : "sending");
    setEmailAuthError("");
    setEmailAuthMessage("");

    try {
      const response = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, mode: emailAuthMode }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "We couldn’t send a code right now.");
      }

      setEmailAuthEmail(payload.email || email);
      setEmailAuthCode("");
      setEmailAuthStep("code");
      setEmailAuthMessage(successMessage || payload.message || "A verification code has been sent.");
      return true;
    } catch (error) {
      setEmailAuthError(error.message || "We couldn’t send a code right now.");
      return false;
    } finally {
      setEmailAuthStatus("idle");
    }
  }

  function handleEmailContinue(event) {
    event?.preventDefault?.();
    requestEmailCode("/api/auth/email/start", "A verification code has been sent.");
  }

  function handleEmailResend() {
    requestEmailCode("/api/auth/email/resend", "A new code has been sent.");
  }

  async function handleEmailVerify(event) {
    event?.preventDefault?.();
    const email = emailAuthEmail.trim().toLowerCase();
    const code = emailAuthCode.replace(/\D/g, "").slice(0, EMAIL_AUTH_CODE_LENGTH);

    if (code.length !== EMAIL_AUTH_CODE_LENGTH) {
      setEmailAuthError("Enter the 6-digit code.");
      setEmailAuthMessage("");
      return;
    }

    setEmailAuthStatus("verifying");
    setEmailAuthError("");
    setEmailAuthMessage("");

    try {
      const response = await fetch("/api/auth/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, code }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.authenticated || !payload.user) {
        throw new Error(payload.error || "That code isn’t correct. Try again.");
      }

      completeAuthenticatedProfile(payload.user, "email");
      setEmailAuthStatus("idle");
    } catch (error) {
      setEmailAuthError(error.message || "That code isn’t correct. Try again.");
      setEmailAuthStatus("idle");
    }
  }

  function handleEmailCodeChange(index, value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) {
      setEmailAuthCode((currentCode) => {
        const codeDigits = currentCode.padEnd(EMAIL_AUTH_CODE_LENGTH, " ").split("");
        codeDigits[index] = " ";
        return codeDigits.join("").slice(0, EMAIL_AUTH_CODE_LENGTH);
      });
      return;
    }

    if (digits.length > 1) {
      const nextCode = digits.slice(0, EMAIL_AUTH_CODE_LENGTH).padEnd(EMAIL_AUTH_CODE_LENGTH, " ");
      setEmailAuthCode(nextCode);
      window.setTimeout(() => focusVerificationCodeBox(digits.length), 0);
      return;
    }

    setEmailAuthCode((currentCode) => {
      const codeDigits = currentCode.padEnd(EMAIL_AUTH_CODE_LENGTH, " ").split("");
      codeDigits[index] = digits;
      return codeDigits.join("").slice(0, EMAIL_AUTH_CODE_LENGTH);
    });
    window.setTimeout(() => focusVerificationCodeBox(index + 1), 0);
  }

  function handleEmailCodeKeyDown(event, index) {
    if (event.key === "Backspace" && !event.currentTarget.value && index > 0) {
      event.preventDefault();
      setEmailAuthCode((currentCode) => {
        const codeDigits = currentCode.padEnd(EMAIL_AUTH_CODE_LENGTH, " ").split("");
        codeDigits[index - 1] = " ";
        return codeDigits.join("").slice(0, EMAIL_AUTH_CODE_LENGTH);
      });
      window.setTimeout(() => focusVerificationCodeBox(index - 1), 0);
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusVerificationCodeBox(index - 1);
    }

    if (event.key === "ArrowRight" && index < EMAIL_AUTH_CODE_LENGTH - 1) {
      event.preventDefault();
      focusVerificationCodeBox(index + 1);
    }
  }

  function handleEmailCodePaste(event) {
    const digits = event.clipboardData?.getData("text")?.replace(/\D/g, "").slice(0, EMAIL_AUTH_CODE_LENGTH) || "";
    if (!digits) {
      return;
    }

    event.preventDefault();
    setEmailAuthCode(digits.padEnd(EMAIL_AUTH_CODE_LENGTH, " "));
    window.setTimeout(() => focusVerificationCodeBox(digits.length), 0);
  }

  function handleEmailUseDifferentEmail() {
    setEmailAuthStep("email");
    setEmailAuthCode("");
    setEmailAuthError("");
    setEmailAuthMessage("");
  }

  async function handleGoogleCredential(response) {
    const credential = String(response?.credential || "").trim();

    if (!credential) {
      setGoogleAuthError("Google sign-in did not return a credential. Try again.");
      return;
    }

    setGoogleAuthError("");
    setGoogleAuthStatus("verifying");

    try {
      const authResponse = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ credential }),
      });
      const authPayload = await authResponse.json().catch(() => ({}));

      if (!authResponse.ok || !authPayload.authenticated || !authPayload.user) {
        throw new Error(authPayload.error || "Google sign-in did not work. Please try again.");
      }

      completeAuthenticatedProfile(authPayload.user, "google-gis");
      setGoogleAuthStatus("ready");
    } catch (error) {
      setGoogleAuthStatus(googleClientId ? "ready" : "unconfigured");
      setGoogleAuthError(error.message || "Google sign-in did not work. Please try again.");
    }
  }

  function handleGoogleFallbackClick() {
    if (googleAuthStatus === "needs-server") {
      setGoogleAuthError("Open VIRELI through http://localhost:8001 so Google sign-in can load its configuration.");
      return;
    }

    setGoogleAuthError("Set VIRELI_GOOGLE_CLIENT_ID on the server to enable existing Google account sign-in.");
  }

  function handleForgotPassword() {
    setRecoveryOpen((currentOpen) => !currentOpen);
  }

  function handleContinueAsGuest() {
    const now = new Date().toISOString();
    const nextProfile = {
      ...EMPTY_PROFILE,
      connected: false,
      guest: true,
      name: "Guest",
      authMode: "guest",
      classSetupSkipped: profile.classSetupSkipped,
      routineSetupSkipped: profile.routineSetupSkipped,
      primaryUse: profile.primaryUse,
      setupComplete: Boolean(profile.setupComplete),
      setupStep: profile.setupComplete ? 4 : Math.max(1, Number(profile.setupStep || 1)),
      timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      schedulingPreferences: {
        ...EMPTY_PROFILE.schedulingPreferences,
        ...(profile.schedulingPreferences || {}),
      },
      createdAt: profile.createdAt || now,
      updatedAt: now,
    };

    setProfile(nextProfile);
    setProfileDraft(nextProfile);
    setProfileStepComplete(true);
  }

  function handleDisconnectProfile() {
    if (/^https?:$/.test(window.location.protocol)) {
      fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      }).catch(() => {});
    }
    setProfile(EMPTY_PROFILE);
    setProfileDraft(EMPTY_PROFILE);
    setProfileStepComplete(false);
    setIntroComplete(false);
    setMoodCheckInComplete(false);
    setMoodSelection("");
    setRoutineStepComplete(false);
  }

  function handleRecoverySelect(option) {
    window.alert(`${option.title} is a demo recovery option for now. Real secure recovery needs live account authentication.`);
  }

  function handleRoutineChange(field, value) {
    setRoutineDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  }

  function handleRoutineWorkloadSelect(option) {
    setRoutineDraft((currentDraft) => ({
      ...currentDraft,
      preferredWorkloadLabel: option.label,
      preferredDailyWorkloadMinutes: option.id === "custom" ? "" : String(option.minutes),
      weekdayWorkloadMinutes: option.id === "custom" ? currentDraft.weekdayWorkloadMinutes : String(option.minutes),
      weekendWorkloadMinutes: option.id === "custom" ? currentDraft.weekendWorkloadMinutes : String(option.minutes),
    }));
  }

  function handleRoutineActivityChange(index, field, value) {
    setRoutineDraft((currentDraft) => {
      const dailyActivities = Array.isArray(currentDraft.dailyActivities)
        ? [...currentDraft.dailyActivities]
        : [...EMPTY_ROUTINE_DRAFT.dailyActivities];
      const currentActivity = dailyActivities[index] || {
        id: makeId(`routine-activity-${index}`),
        name: "",
        durationMinutes: "",
        usualTime: "",
        days: "Weekdays",
        fixed: true,
        active: true,
      };
      dailyActivities[index] = {
        ...currentActivity,
        [field]: value,
      };
      return { ...currentDraft, dailyActivities };
    });
  }

  function handleRoutineActivityAdd() {
    setRoutineDraft((currentDraft) => ({
      ...currentDraft,
      dailyActivities: [
        ...(currentDraft.dailyActivities || []),
        {
          id: makeId("routine-activity"),
          name: "",
          durationMinutes: "",
          usualTime: "",
          days: "Weekdays",
          fixed: true,
          active: true,
        },
      ].slice(0, 8),
    }));
  }

  function handleRoutineActivityRemove(index) {
    setRoutineDraft((currentDraft) => {
      const dailyActivities = (currentDraft.dailyActivities || []).filter((_, itemIndex) => itemIndex !== index);
      return {
        ...currentDraft,
        dailyActivities,
      };
    });
  }

  function handleSaveRoutine() {
    const nextRoutine = saveRoutine(routineDraft);
    setRoutine(nextRoutine);
    setRoutineDraft(nextRoutine);
    setRoutineStepComplete(true);
    setActiveTab("home");
    setProfile((currentProfile) => ({
      ...currentProfile,
      routineSetupSkipped: false,
      setupComplete: true,
      setupStep: 4,
      updatedAt: new Date().toISOString(),
    }));
  }

  function handleSkipClasses() {
    const now = new Date().toISOString();
    setProfile((currentProfile) => {
      const nextProfile = {
        ...currentProfile,
        classSetupSkipped: true,
        updatedAt: now,
      };
      setProfileDraft(nextProfile);
      return nextProfile;
    });
  }

  function handleCustomClassAdd() {
    const label = normalizeClassName(customClassDraft);

    if (!label) {
      return;
    }

    setCustomClassNames((currentNames) =>
      Array.from(new Set([...currentNames, label])),
    );
    setCustomClassDraft("");
  }

  function handleCustomClassRemove(className) {
    setCustomClassNames((currentNames) =>
      currentNames.filter((item) => item !== className),
    );
  }

  function handleSaveSelectedClasses() {
    const classesToSave = dedupeClasses(
      [
        ...DEFAULT_CLASS_OPTIONS
          .filter((option) => option.id !== "other" && selectedClassIds.includes(option.id))
          .map((option) => createClass(option.label)),
        ...customClassNames.map((className) => createClass(className)),
      ],
    );

    if (!classesToSave.length) {
      return;
    }

    setSavedClasses(classesToSave);
    setProfile((currentProfile) => ({
      ...currentProfile,
      classSetupSkipped: false,
      updatedAt: new Date().toISOString(),
    }));
    setHomeworkDraft((currentDraft) => ({
      ...currentDraft,
      classId: "",
    }));
    setCustomClassDraft("");
    setCustomClassNames([]);
  }

  function handleHomeworkDraftChange(field, value) {
    setHomeworkDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
      estimatedMinutes:
        field === "title" && !currentDraft.estimatedMinutes
          ? String(estimateAssignmentMinutes(value, currentDraft.details))
          : currentDraft.estimatedMinutes,
    }));
  }

  function handleHomeworkSubmit(event) {
    event?.preventDefault?.();

    const title = homeworkDraft.title.trim();
    const topic = homeworkDraft.topic.trim() || title;
    const classLabel = homeworkDraft.classId
      ? getClassLabel(savedClasses, homeworkDraft.classId, "")
      : normalizeClassName(homeworkDraft.classLabel || "");
    const estimatedMinutes = Number(homeworkDraft.estimatedMinutes)
      || estimateAssignmentMinutes(title, homeworkDraft.details || homeworkDraft.notes);
    const targetDate = homeworkDraft.dueDate || getDateInputValue();
    const today = getDateInputValue();
    const scheduleDate = targetDate >= today ? today : targetDate;
    const draftSchedule = getTodayScheduleBlocks({
      routine,
      homeworkItems,
      calendarTasks,
      dateValue: scheduleDate,
    });
    const bestWindow = findBestFreeWindow(
      scheduleDate === today ? getRemainingSchedule(draftSchedule) : draftSchedule,
      Math.min(estimatedMinutes, 90),
    );
    const scheduledDate = homeworkDraft.scheduledDate || scheduleDate;
    const scheduledTime = homeworkDraft.scheduledTime || (bestWindow ? minutesToTimeValue(bestWindow.startMinutes) : "");

    if (!title) {
      return;
    }

    const guidance = buildHomeworkGuidance({
      classLabel,
      topic,
      title,
      details: (homeworkDraft.details || homeworkDraft.notes).trim(),
      attachmentName: homeworkDraft.attachmentName,
    });
    const steps = createHomeworkSteps(title, homeworkDraft.details || homeworkDraft.notes);
    const splitNote = estimatedMinutes > 90
      ? ` This looks bigger, so split it into ${Math.ceil(estimatedMinutes / 45)} short work sessions if needed.`
      : "";

    setHomeworkItems((currentItems) => [
      {
        id: makeId("homework"),
        classId: homeworkDraft.classId || "",
        classLabel,
        title,
        topic,
        details: (homeworkDraft.details || homeworkDraft.notes).trim(),
        notes: (homeworkDraft.details || homeworkDraft.notes).trim(),
        dueDate: homeworkDraft.dueDate,
        dueTime: "",
        scheduledDate,
        scheduledTime,
        estimatedMinutes: String(estimatedMinutes),
        priority: "Normal",
        type: "Assignment",
        frequency: homeworkDraft.frequency || "One time",
        steps,
        scheduledFor: homeworkDraft.scheduledFor,
        customSchedule: homeworkDraft.customSchedule.trim(),
        attachmentName: homeworkDraft.attachmentName,
        attachmentType: homeworkDraft.attachmentType,
        attachmentPreview: homeworkDraft.attachmentPreview,
        guidance: `${guidance}${splitNote}`,
        completed: false,
        completedAt: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...currentItems,
    ]);
    setHomeworkDraft({
      ...EMPTY_HOMEWORK_DRAFT,
      classId: "",
    });
  }

  function handlePlanNotificationDismiss(homeworkId) {
    const today = getDateInputValue();
    setHomeworkItems((currentItems) =>
      currentItems.map((item) =>
        item.id === homeworkId
          ? {
              ...item,
              notificationDismissedDate: today,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
  }

  function handleHomeworkCompleteToggle(homeworkId) {
    const previousItem = homeworkItems.find((item) => item.id === homeworkId);
    setHomeworkItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== homeworkId) {
          return item;
        }

        const nextCompleted = !item.completed;
        return {
          ...item,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : "",
          updatedAt: new Date().toISOString(),
        };
      }),
    );
    if (previousItem) {
      showUndoToast(
        previousItem.completed ? "Assignment reopened — Undo" : "Assignment completed — Undo",
        () => {
          setHomeworkItems((currentItems) =>
            currentItems.map((item) => (item.id === homeworkId ? previousItem : item)),
          );
        },
      );
    }
  }

  function handleHomeworkReschedule(homeworkId, scheduledDate, scheduledTime) {
    const previousItem = homeworkItems.find((item) => item.id === homeworkId);
    setHomeworkItems((currentItems) =>
      currentItems.map((item) =>
        item.id === homeworkId
          ? {
              ...item,
              scheduledDate,
              scheduledTime,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
    if (previousItem) {
      showUndoToast("Assignment rescheduled — Undo", () => {
        setHomeworkItems((currentItems) =>
          currentItems.map((item) => (item.id === homeworkId ? previousItem : item)),
        );
      });
    }
  }

  function handleHomeworkDelete(homeworkId) {
    const previousItem = homeworkItems.find((item) => item.id === homeworkId);
    setHomeworkItems((currentItems) =>
      currentItems.filter((item) => item.id !== homeworkId),
    );
    if (previousItem) {
      showUndoToast("Assignment deleted — Undo", () => {
        setHomeworkItems((currentItems) => [previousItem, ...currentItems]);
      });
    }
  }

  function handleClassAdd(event) {
    event?.preventDefault?.();

    const label = normalizeClassName(classDraft);

    if (!label) {
      return;
    }

    const nextClass = createClass(label);
    setSavedClasses((currentClasses) =>
      dedupeClasses([...currentClasses, nextClass]),
    );
    setProfile((currentProfile) => ({
      ...currentProfile,
      classSetupSkipped: false,
      updatedAt: new Date().toISOString(),
    }));
    setClassDraft("");
  }

  function handleClassUpdate(classId, value) {
    const label = normalizeClassName(value);

    setSavedClasses((currentClasses) =>
      currentClasses.map((schoolClass) =>
        schoolClass.id === classId ? { ...schoolClass, label: value } : schoolClass,
      ),
    );

    if (label) {
      setHomeworkItems((currentItems) =>
        currentItems.map((item) =>
          item.classId === classId ? { ...item, classLabel: label } : item,
        ),
      );
    }
  }

  function handleClassRemove(classId) {
    setSavedClasses((currentClasses) =>
      currentClasses.filter((schoolClass) => schoolClass.id !== classId),
    );
    setHomeworkDraft((currentDraft) =>
      currentDraft.classId === classId
        ? { ...currentDraft, classId: "" }
        : currentDraft,
    );
  }

  function handleCalendarTaskDraftChange(field, value) {
    setCalendarTaskDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
      ...(field === "frequency" ? { repeat: value !== "Never" } : {}),
      ...(field === "repeat" && !value ? { frequency: "Never" } : {}),
    }));
  }

  function handleCalendarTaskSubmit(event) {
    event?.preventDefault?.();
    const title = calendarTaskDraft.title.trim();

    if (!title) {
      return;
    }

    const nextTask = normalizeCalendarTask({
        ...calendarTaskDraft,
        id: editingCalendarTaskId || calendarTaskDraft.id || makeId("task"),
        title,
        scheduledDate: calendarTaskDraft.scheduledDate || selectedCalendarDate || getDateInputValue(),
        itemType: calendarTaskDraft.itemType || "Task",
        type: calendarTaskDraft.itemType || "Task",
        repeat: calendarTaskDraft.repeat || calendarTaskDraft.frequency !== "Never",
        createdAt: calendarTaskDraft.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    setCalendarTasks((currentTasks) => {
      if (editingCalendarTaskId) {
        return currentTasks.map((task) =>
          task.id === editingCalendarTaskId ? nextTask : task,
        );
      }

      return [
        nextTask,
        ...currentTasks,
      ].slice(0, 60);
    });
    setEditingCalendarTaskId("");
    if (nextTask.scheduledDate) {
      setCalendarMonth(new Date(`${nextTask.scheduledDate}T12:00:00`));
      setSelectedCalendarDate(nextTask.scheduledDate);
    }
    setCalendarTaskDraft(EMPTY_CALENDAR_TASK_DRAFT);
  }

  function handleCalendarTaskEdit(taskId) {
    const task = calendarTasks.find((item) => item.id === taskId);

    if (!task) {
      return;
    }

    const normalizedTask = normalizeCalendarTask(task);
    setEditingCalendarTaskId(normalizedTask.id);
    setCalendarTaskDraft(normalizedTask);
    if (normalizedTask.scheduledDate) {
      setSelectedCalendarDate(normalizedTask.scheduledDate);
    }
  }

  function handleCalendarTaskCancelEdit() {
    setEditingCalendarTaskId("");
    setCalendarTaskDraft(EMPTY_CALENDAR_TASK_DRAFT);
  }

  function handleCalendarToday() {
    const today = new Date();
    setCalendarMonth(today);
    setSelectedCalendarDate(getDateInputValue(today));
  }

  function handleCalendarTaskToggle(taskId) {
    setCalendarTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
              updatedAt: new Date().toISOString(),
            }
          : task,
      ),
    );
  }

  function handleCalendarTaskDelete(taskId) {
    setCalendarTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
  }

  function handleCalendarPreferenceChange(field, value) {
    setCalendarPreferences((currentPreferences) => ({
      ...currentPreferences,
      [field]: value,
    }));
  }

  function findAvailableScheduleTime(prompt, preferredDate = "") {
    const scheduledDate = preferredDate || detectAskScheduleDate(prompt);
    const busyTimes = new Set([
      ...calendarTasks
        .filter((task) => task.scheduledDate === scheduledDate)
        .map((task) => task.scheduledTime)
        .filter(Boolean),
      ...homeworkItems
        .filter((item) => item.scheduledDate === scheduledDate)
        .map((item) => item.scheduledTime)
        .filter(Boolean),
    ]);
    const schedule = getTodayScheduleBlocks({
      routine,
      homeworkItems,
      calendarTasks,
      dateValue: scheduledDate,
    });
    const nowMinutes = scheduledDate === getDateInputValue()
      ? new Date().getHours() * 60 + new Date().getMinutes()
      : schedule.wakeMinutes;
    const freeBlock = schedule.timelineBlocks.find((block) => {
      if (block.source !== "free") {
        return false;
      }

      const candidateStart = Math.max(block.startMinutes, nowMinutes + 30);
      return block.endMinutes - candidateStart >= 30;
    });
    const suggestedMinutes = freeBlock
      ? Math.max(freeBlock.startMinutes, nowMinutes + 30)
      : parseLooseTimeToMinutes("7:00 PM");
    const scheduledTime = minutesToTimeValue(suggestedMinutes || 19 * 60);
    const title = cleanAskTaskTitle(prompt) || "New task";

    return {
      id: makeId("schedule-suggestion"),
      title,
      scheduledDate,
      scheduledTime,
      frequency: detectAskFrequency(prompt),
      notes: "Added from Ask VIRELI.",
    };
  }

  function buildAskCalendarAction(prompt) {
    const intent = detectAskSchedulingIntent(prompt);

    if (!intent) {
      return null;
    }

    const title = cleanAskTaskTitle(prompt);
    const scheduledDate = detectAskScheduleDate(prompt);
    const detectedTime = detectAskScheduleTime(prompt, { routine });
    const suggestedTime = detectedTime || findAvailableScheduleTime(prompt, scheduledDate).scheduledTime;
    const frequency = detectAskFrequency(prompt);
    const frequencyLabel = getFrequencyLabel(frequency);
    const frequencyCopy = frequencyLabel ? `${frequencyLabel.toLowerCase()} ` : "";
    const dateCopy = frequencyLabel ? "" : `${getFriendlyDateLabel(scheduledDate)} `;

    if ((intent === "add" || intent === "suggest-time") && !title) {
      return {
        needsDetail: true,
        reply: "What task should I add to your calendar?",
      };
    }

    if (intent === "remove") {
      const matchedTask = getCalendarTaskMatch(prompt, calendarTasks);

      if (!matchedTask) {
        return {
          needsDetail: true,
          reply: "Which calendar task should I remove?",
        };
      }

      return {
        action: "remove",
        targetTaskId: matchedTask.id,
        targetTitle: matchedTask.title,
        reply: `I found this: Remove "${matchedTask.title}" from your calendar. Should I remove it?`,
      };
    }

    if (intent === "move") {
      const matchedTask = getCalendarTaskMatch(prompt, calendarTasks);

      if (!matchedTask) {
        return {
          needsDetail: true,
          reply: "Which calendar task should I move?",
        };
      }

      return {
        action: "move",
        targetTaskId: matchedTask.id,
        targetTitle: matchedTask.title,
        scheduledDate,
        scheduledTime: suggestedTime,
        frequency: frequencyLabel ? frequency : matchedTask.frequency,
        reply: `I found this: Move "${matchedTask.title}" ${frequencyCopy}${dateCopy}at ${formatTimeLabel(suggestedTime)}. Should I update it?`,
      };
    }

    const duplicateTask = calendarTasks.find(
      (task) =>
        !task.completed &&
        task.title.toLowerCase() === title.toLowerCase() &&
        task.scheduledDate === scheduledDate &&
        (task.scheduledTime || "") === (suggestedTime || ""),
    );

    if (duplicateTask) {
      return {
        needsDetail: true,
        reply: `${duplicateTask.title} is already on your calendar for ${formatShortDate(duplicateTask.scheduledDate)}${duplicateTask.scheduledTime ? ` at ${formatTimeLabel(duplicateTask.scheduledTime)}` : ""}.`,
      };
    }

    return {
      action: "add",
      task: {
        id: makeId("task"),
        title,
        scheduledDate,
        scheduledTime: suggestedTime,
        frequency,
        notes: "Added from Ask VIRELI.",
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      reply: `I found this: Add "${title}" ${frequencyCopy}${dateCopy}at ${formatTimeLabel(suggestedTime)}. Should I add it to your calendar?`,
    };
  }

  function handlePendingScheduleAnswer(prompt) {
    if (!pendingScheduleSuggestion) {
      return null;
    }

    const normalizedPrompt = prompt.trim().toLowerCase();

    if (/^(yes|yeah|yep|sure|ok|okay|add it|please do)\b/.test(normalizedPrompt)) {
      const now = new Date().toISOString();
      let reply = "";
      let nextCalendarMonth = "";

      if (pendingScheduleSuggestion.action === "remove") {
        setCalendarTasks((currentTasks) =>
          currentTasks.filter((task) => task.id !== pendingScheduleSuggestion.targetTaskId),
        );
        reply = `Removed ${pendingScheduleSuggestion.targetTitle} from your calendar.`;
      } else if (pendingScheduleSuggestion.action === "move") {
        setCalendarTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === pendingScheduleSuggestion.targetTaskId
              ? normalizeCalendarTask({
                  ...task,
                  scheduledDate: pendingScheduleSuggestion.scheduledDate || task.scheduledDate,
                  scheduledTime: pendingScheduleSuggestion.scheduledTime || task.scheduledTime,
                  frequency: pendingScheduleSuggestion.frequency || task.frequency || "One time",
                  updatedAt: now,
                })
              : task,
          ),
        );
        nextCalendarMonth = pendingScheduleSuggestion.scheduledDate;
        reply = `Updated ${pendingScheduleSuggestion.targetTitle} for ${formatShortDate(pendingScheduleSuggestion.scheduledDate)} at ${formatTimeLabel(pendingScheduleSuggestion.scheduledTime)}.`;
      } else {
        const nextTask = normalizeCalendarTask({
          ...pendingScheduleSuggestion.task,
          completed: false,
          updatedAt: now,
        });
        setCalendarTasks((currentTasks) => [nextTask, ...currentTasks].slice(0, 60));
        nextCalendarMonth = nextTask.scheduledDate;
        reply = `Added ${nextTask.title} to your calendar for ${formatShortDate(nextTask.scheduledDate)} at ${formatTimeLabel(nextTask.scheduledTime)}.`;
      }

      setPendingScheduleSuggestion(null);
      if (nextCalendarMonth) {
        setCalendarMonth(new Date(`${nextCalendarMonth}T12:00:00`));
        setSelectedCalendarDate(nextCalendarMonth);
      }
      return { reply, changed: true };
    }

    if (/^(no|nope|not now|don't|do not)\b/.test(normalizedPrompt)) {
      setPendingScheduleSuggestion(null);
      return {
        reply: "No problem. I did not add it to your calendar.",
        changed: false,
      };
    }

    return {
      reply: "Please answer Yes or No so I know what to do.",
      changed: false,
    };
  }

  function handleAskVireliCommand(prompt) {
    const pendingAnswer = handlePendingScheduleAnswer(prompt);
    if (pendingAnswer) {
      return pendingAnswer;
    }

    const normalizedPrompt = prompt.toLowerCase();
    const wantsNow = /what should i work on|work on right now|do right now|start now|next task/.test(normalizedPrompt);
    const wantsTonight = /finish everything tonight|can i finish|enough time tonight|everything done/.test(normalizedPrompt);
    const wantsSplit = /break up|split|divide|multiple sessions/.test(normalizedPrompt);

    if (wantsNow) {
      const recommendation = getNextAssignmentRecommendation({
        homeworkItems,
        routine,
        calendarTasks,
        mood: moodSelection,
      });

      return {
        reply: recommendation.item
          ? `Work on ${recommendation.item.title}. Start ${recommendation.startTime ? `at ${formatTimeLabel(recommendation.startTime)}` : "when you are ready"} for about ${formatDurationFromMinutes(recommendation.duration)}.`
          : "You do not have an open assignment saved. Add one and I will choose a time.",
        changed: false,
      };
    }

    if (wantsTonight) {
      const schedule = getRemainingSchedule(getTodayScheduleBlocks({ routine, homeworkItems, calendarTasks }));
      const freeMinutes = getFreeTimeWindows(schedule).reduce((total, block) => total + block.endMinutes - block.startMinutes, 0);
      const workload = homeworkItems
        .filter((item) => !item.completed)
        .reduce((total, item) => total + getAssignmentDuration(item), 0);
      const difference = freeMinutes - workload;

      return {
        reply: difference >= 0
          ? `Yes, if you stay focused. You have about ${formatDurationFromMinutes(freeMinutes)} open and about ${formatDurationFromMinutes(workload)} of work.`
          : `Probably not all of it. You are short by about ${formatDurationFromMinutes(Math.abs(difference))}. Start with the closest due assignment first.`,
        changed: false,
      };
    }

    if (wantsSplit) {
      const target = homeworkItems.find((item) => !item.completed && normalizedPrompt.includes(item.title.toLowerCase()))
        || homeworkItems.find((item) => !item.completed);
      if (!target) {
        return { reply: "Add the assignment first, then I can split it into work sessions.", changed: false };
      }
      const sessions = Math.max(2, Math.ceil(getAssignmentDuration(target) / 45));
      return {
        reply: `Split ${target.title} into ${sessions} sessions of about ${formatDurationFromMinutes(Math.ceil(getAssignmentDuration(target) / sessions))}. I can schedule the first one if you ask me to move or schedule it.`,
        changed: false,
      };
    }

    const calendarAction = buildAskCalendarAction(prompt);

    if (calendarAction) {
      if (calendarAction.needsDetail) {
        return { reply: calendarAction.reply, changed: false };
      }

      setPendingScheduleSuggestion(calendarAction);
      return { reply: calendarAction.reply, changed: false };
    }

    const wantsDueWeek = /due (this )?week|everything due|this week/.test(normalizedPrompt);
    const wantsFirst = /what .*first|do first|start first|priority/.test(normalizedPrompt);

    if (wantsDueWeek) {
      const dueThisWeek = homeworkItems
        .filter((item) => !item.completed && isWithinNextDays(getItemCalendarDate(item), 7))
        .slice(0, 6);
      const reply = dueThisWeek.length
        ? `Due this week:\n${dueThisWeek
            .map((item) => `- ${item.title} (${formatShortDate(getItemCalendarDate(item))})`)
            .join("\n")}`
        : "Nothing with a due date is saved for this week yet.";
      return { reply, changed: false };
    }

    if (wantsFirst) {
      const ordered = [
        ...homeworkItems.filter((item) => isDueBeforeToday(item)),
        ...homeworkItems.filter((item) => isDueToday(item)),
        ...homeworkItems.filter((item) => !item.completed && item.priority === "High"),
        ...homeworkItems.filter((item) => !item.completed),
      ];
      const first = ordered.find((item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index);
      return {
        reply: first
          ? `Start with ${first.title}. It is ${first.classLabel || getClassLabel(savedClasses, first.classId)} work, and the next step is: ${first.steps?.[0] || "open the assignment"}.`
          : "You do not have open homework saved right now.",
        changed: false,
      };
    }

    return null;
  }

  async function requestAskVireliReply(prompt, context) {
    const response = await fetch("/api/ask-vireli", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        responseType,
        mood: moodSelection || "ok",
        timeMode,
        recentUserPrompt: context.recentUserPrompt || "",
        recentAssistantResponse: context.recentAssistantResponse || "",
        recentMessages: context.recentMessages || [],
        plannerContext: {
          openAssignments: homeworkItems
            .filter((item) => !item.completed)
            .slice(0, 8)
            .map((item) => ({
              title: item.title,
              subject: getAssignmentSubject(item, savedClasses),
              dueDate: item.dueDate,
              scheduledDate: item.scheduledDate,
              scheduledTime: item.scheduledTime,
              estimatedMinutes: getAssignmentDuration(item),
            })),
          freeWindows: getFreeTimeWindows(
            getRemainingSchedule(getTodayScheduleBlocks({ routine, homeworkItems, calendarTasks })),
          ).slice(0, 5).map((block) => ({
            label: block.label,
            minutes: block.endMinutes - block.startMinutes,
          })),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ask VIRELI API failed with ${response.status}`);
    }

    const payload = await response.json();

    if (!payload?.reply) {
      throw new Error("Ask VIRELI API returned an empty reply");
    }

    return payload;
  }

  function sendPromptToAssistant(prompt) {
    const trimmed = prompt.trim();

    if (!trimmed || isTyping) {
      return;
    }

    setChatError("");
    setLastFailedPrompt("");
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: makeId("user"),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      },
    ]);
    setIsTyping(true);

    window.setTimeout(async () => {
      const currentMessages = messages;
      const recentUserPrompt = [...currentMessages]
        .reverse()
        .find((message) => message.role === "user" && message.content !== trimmed)
        ?.content;
      const recentAssistantResponse = [...currentMessages]
        .reverse()
        .find((message) => message.role === "assistant")
        ?.content;
      const context = {
        mood: moodSelection || "ok",
        moodNote,
        timeMode,
        responseIndex: currentMessages.length,
        responseType,
        recentUserPrompt,
        recentAssistantResponse,
        recentMessages: currentMessages.slice(-8).map((message) => ({
          role: message.role,
          content: message.content,
        })),
      };
      const commandResult = handleAskVireliCommand(trimmed);

      if (commandResult) {
        setMessages((latestMessages) => [
          ...latestMessages,
          {
            id: makeId("assistant"),
            role: "assistant",
            content: commandResult.reply,
            source: "local-command",
            model: "calendar-command",
            createdAt: new Date().toISOString(),
          },
        ]);
        setIsTyping(false);
        return;
      }

      try {
        const payload = await requestAskVireliReply(trimmed, context);
        setMessages((latestMessages) => [
          ...latestMessages,
          {
            id: makeId("assistant"),
            role: "assistant",
            content: payload.reply,
            source: payload.source || "api",
            model: payload.model || "",
            createdAt: new Date().toISOString(),
          },
        ]);
      } catch (error) {
        const fallbackAction = buildAskCalendarAction(trimmed);
        if (fallbackAction && !fallbackAction.needsDetail) {
          setPendingScheduleSuggestion(fallbackAction);
        }
        setMessages((latestMessages) => [
          ...latestMessages,
          {
            id: makeId("assistant"),
            role: "assistant",
            content: fallbackAction?.reply || "Tell me one task you want to schedule, and I will find a good opening.",
            source: "local",
            model: "local-fallback",
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    }, CHAT_RESPONSE_DELAY_MS);
  }

  function handleChatSubmit(event) {
    event.preventDefault();

    const outgoingMessage = chatDraft;
    setChatDraft("");
    sendPromptToAssistant(outgoingMessage);
  }

  function handleChatRetry() {
    if (lastFailedPrompt) {
      const retryPrompt = lastFailedPrompt;
      setChatError("");
      setLastFailedPrompt("");
      sendPromptToAssistant(retryPrompt);
    }
  }

  function handleLoadAskHistory(entryId) {
    const entry = askHistory.find((historyEntry) => historyEntry.id === entryId);

    if (!entry) {
      return;
    }

    askSessionIdRef.current = entry.id;
    setMessages(entry.messages.length ? entry.messages : buildInitialMessages(moodSelection || "ok"));
  }

  function handleFeedbackSubmit() {
    if (!feedbackDraft.area || !feedbackDraft.text.trim()) {
      return;
    }

    writePersistentArray(FEEDBACK_STORAGE_KEY, [
      {
        id: makeId("feedback"),
        area: feedbackDraft.area,
        text: feedbackDraft.text.trim(),
        page: activeTab,
        appVersion: APP_VERSION,
        feature: feedbackDraft.area,
        createdAt: new Date().toISOString(),
      },
      ...loadFeedbackEntries(),
    ]);
    setFeedbackSubmitted(true);
    setFeedbackDraft(EMPTY_FEEDBACK_DRAFT);
  }

  function handleDailyLogChange(field, value) {
    setDailyLogSubmitted(false);
    setDailyLogDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  }

  function handleDailyActivityChange(index, value) {
    setDailyLogSubmitted(false);
    setDailyLogDraft((currentDraft) => {
      const activities = Array.isArray(currentDraft.activities)
        ? [...currentDraft.activities]
        : [""];

      activities[index] = value;
      return {
        ...currentDraft,
        activities,
      };
    });
  }

  function handleDailyActivityAdd() {
    setDailyLogSubmitted(false);
    setDailyLogDraft((currentDraft) => ({
      ...currentDraft,
      activities: [...(currentDraft.activities || []), ""].slice(0, 8),
    }));
  }

  function handleDailyActivityRemove(index) {
    setDailyLogSubmitted(false);
    setDailyLogDraft((currentDraft) => {
      const activities = (currentDraft.activities || [""]).filter((_, itemIndex) => itemIndex !== index);

      return {
        ...currentDraft,
        activities: activities.length ? activities : [""],
      };
    });
  }

  function handleDailyActivitiesLockToggle() {
    setDailyLogSubmitted(false);
    setDailyLogDraft((currentDraft) => ({
      ...currentDraft,
      activitiesLocked: !currentDraft.activitiesLocked,
    }));
  }

  function handleDailyLogSubmit() {
    const activities = Array.isArray(dailyLogDraft.activities)
      ? dailyLogDraft.activities
      : [];
    const canSubmit =
      dailyLogDraft.rating &&
      dailyLogDraft.couldBeBetter &&
      activities.some((activity) => activity.trim()) &&
      dailyLogDraft.wentWell.trim() &&
      dailyLogDraft.didNotGoWell.trim();

    if (!canSubmit) {
      return;
    }

    const nextLogs = saveDailyLog(dailyLogDraft, dailyLogs);
    setDailyLogs(nextLogs);
    setDailyLogDraft(normalizeDailyLogEntry(nextLogs[0]));
    setDailyLogSubmitted(true);
  }

  function handleThoughtAdd(event) {
    event?.preventDefault?.();
    const text = thoughtDraft.trim();

    if (!text) {
      return;
    }

    const now = new Date().toISOString();
    setThoughts((currentThoughts) => [
      normalizeThought({
        id: makeId("thought"),
        text,
        status: "open",
        archived: false,
        createdAt: now,
        updatedAt: now,
      }),
      ...currentThoughts,
    ].slice(0, 40));
    setThoughtDraft("");
  }

  function handleThoughtUpdate(thoughtId, text) {
    setThoughts((currentThoughts) =>
      currentThoughts.map((thought) =>
        thought.id === thoughtId
          ? normalizeThought({ ...thought, text, updatedAt: new Date().toISOString() })
          : thought,
      ).filter((thought) => thought.text),
    );
  }

  function handleThoughtDelete(thoughtId) {
    const previousThought = thoughts.find((thought) => thought.id === thoughtId);
    setThoughts((currentThoughts) => currentThoughts.filter((thought) => thought.id !== thoughtId));
    if (previousThought) {
      showUndoToast("Thought deleted — Undo", () => {
        setThoughts((currentThoughts) => [previousThought, ...currentThoughts].slice(0, 40));
      });
    }
  }

  function updateThoughtStatus(thoughtId, changes, toastMessage) {
    const previousThought = thoughts.find((thought) => thought.id === thoughtId);
    setThoughts((currentThoughts) =>
      currentThoughts.map((thought) =>
        thought.id === thoughtId
          ? normalizeThought({ ...thought, ...changes, updatedAt: new Date().toISOString() })
          : thought,
      ),
    );
    if (previousThought && toastMessage) {
      showUndoToast(toastMessage, () => {
        setThoughts((currentThoughts) =>
          currentThoughts.map((thought) => (thought.id === thoughtId ? previousThought : thought)),
        );
      });
    }
  }

  function handleThoughtArchive(thoughtId) {
    updateThoughtStatus(thoughtId, { archived: true }, "Thought archived — Undo");
  }

  function handleThoughtHandled(thoughtId) {
    updateThoughtStatus(thoughtId, { status: "handled" }, "Thought marked handled — Undo");
  }

  function handleThoughtConvertToTask(thoughtId) {
    const thought = thoughts.find((item) => item.id === thoughtId);

    if (!thought) {
      return;
    }

    setCalendarTaskDraft({
      ...EMPTY_CALENDAR_TASK_DRAFT,
      title: thought.text,
      scheduledDate: selectedCalendarDate || getDateInputValue(),
      scheduledTime: "",
      itemType: "Task",
      type: "Task",
      notes: "Converted from Thoughts.",
    });
    updateThoughtStatus(thoughtId, { status: "handled" }, "");
    setActiveTab("calendar");
  }

  function handleThoughtAskVireli(thoughtId) {
    const thought = thoughts.find((item) => item.id === thoughtId);

    if (!thought) {
      return;
    }

    setChatDraft(`Help me plan this: ${thought.text}`);
    setActiveTab("ask");
  }

  function handleClearAskHistory() {
    if (!window.confirm("Clear Ask VIRELI chat storage?")) {
      return;
    }

    setAskHistory([]);
    saveAskHistory([]);
  }

  function handleClearDailyLogs() {
    if (!window.confirm("Clear saved Daily Logs?")) {
      return;
    }

    setDailyLogs([]);
    writePersistentArray(DAILY_LOG_STORAGE_KEY, []);
    setDailyLogDraft(loadDailyLog());
  }

  function handleResetSubjects() {
    if (!window.confirm("Reset saved subjects? Homework items will stay, but subjects will be cleared.")) {
      return;
    }

    setSavedClasses([]);
    setHomeworkDraft(EMPTY_HOMEWORK_DRAFT);
  }

  return html`
    <div
      className=${cx(
        "vireli-app min-h-screen font-body text-slate-900",
        isThemeTransitioning && "is-theme-shifting",
      )}
      data-theme=${themeName}
      data-time-of-day=${timeMode}
    >
      <div
        className=${cx(
          "theme-transition-wash",
          isThemeTransitioning && "is-active",
        )}
        aria-hidden="true"
      ></div>

      <${AnimatePresence} mode="wait">
        ${!introComplete
          ? html`
              <${OpeningScreen}
                key="opening"
                onGetStarted=${handleOpeningGetStarted}
                onSignIn=${handleOpeningSignIn}
              />
            `
          : !profileStepComplete
          ? html`
                <${AccountScreen}
                  key="account"
                  profile=${profile}
                  googleClientId=${googleClientId}
                  googleAuthStatus=${googleAuthStatus}
                  googleAuthError=${googleAuthError}
                  emailAuthStep=${emailAuthStep}
                  emailAuthEmail=${emailAuthEmail}
                  emailAuthCode=${emailAuthCode}
                  emailAuthMode=${emailAuthMode}
                  emailAuthStatus=${emailAuthStatus}
                  emailAuthError=${emailAuthError}
                  emailAuthMessage=${emailAuthMessage}
                  onEmailChange=${handleEmailChange}
                  onEmailContinue=${handleEmailContinue}
                  onEmailCodeChange=${handleEmailCodeChange}
                  onEmailCodeKeyDown=${handleEmailCodeKeyDown}
                  onEmailCodePaste=${handleEmailCodePaste}
                  onEmailVerify=${handleEmailVerify}
                  onEmailResend=${handleEmailResend}
                  onEmailUseDifferentEmail=${handleEmailUseDifferentEmail}
                  onEmailModeChange=${handleEmailModeChange}
                  onContinueAsGuest=${handleContinueAsGuest}
                />
              `
          : !profile.setupComplete && currentSetupStep === 1
            ? html`
                <${SetupAboutScreen}
                  key="setup-about"
                  profileDraft=${profileDraft}
                  onProfileDraftChange=${handleProfileDraftChange}
                  onContinue=${handleSetupAboutContinue}
                />
              `
          : !profile.setupComplete && currentSetupStep === 2
            ? html`
                <${MoodCheckInScreen}
                  key="mood"
                  moodSelection=${moodSelection}
                  moodNote=${moodNote}
                  onMoodSelect=${handleMoodSelect}
                  onMoodNoteChange=${setMoodNote}
                  onMoodContinue=${handleMoodContinue}
                  onMoodSkip=${handleMoodSkip}
                />
              `
          : !profile.setupComplete && currentSetupStep === 3
            ? html`
                <${SetupScheduleBasicsScreen}
                  key="setup-schedule"
                  routineDraft=${routineDraft}
                  onRoutineChange=${handleRoutineChange}
                  onRoutineWorkloadSelect=${handleRoutineWorkloadSelect}
                  onContinue=${handleScheduleBasicsContinue}
                />
              `
          : !profile.setupComplete
            ? html`
                <${SetupRoutineBuilderScreen}
                  key="setup-routine"
                  routineDraft=${routineDraft}
                  onRoutineActivityChange=${handleRoutineActivityChange}
                  onRoutineActivityAdd=${handleRoutineActivityAdd}
                  onRoutineActivityRemove=${handleRoutineActivityRemove}
                  onSaveRoutine=${handleSaveRoutine}
                />
              `
          : html`
                <${DashboardShell}
                  key="dashboard"
                  activeTab=${activeTab}
                  todayLabel=${todayLabel}
                  timeMode=${timeMode}
                  moodSelection=${moodSelection}
                  moodInfo=${moodInfo}
                  moodNote=${moodNote}
                  feedbackDraft=${feedbackDraft}
                  feedbackSubmitted=${feedbackSubmitted}
                  dailyLogDraft=${dailyLogDraft}
                  dailyLogSubmitted=${dailyLogSubmitted}
                  chatDraft=${chatDraft}
                  messages=${messages}
                  recentAskHistory=${recentAskHistory}
                  archivedAskHistory=${archivedAskHistory}
                  profile=${profile}
                  profileDraft=${profileDraft}
                  isTyping=${isTyping}
                  chatError=${chatError}
                  savedClasses=${savedClasses}
                  routine=${routine}
                  homeworkItems=${homeworkItems}
                  homeworkDraft=${homeworkDraft}
                  calendarTasks=${calendarTasks}
                  calendarTaskDraft=${calendarTaskDraft}
                  editingCalendarTaskId=${editingCalendarTaskId}
                  calendarMonth=${calendarMonth}
                  calendarView=${calendarView}
                  selectedCalendarDate=${selectedCalendarDate}
                  calendarPreferences=${calendarPreferences}
                  dailyLogs=${dailyLogs}
                  thoughts=${thoughts}
                  thoughtDraft=${thoughtDraft}
                  classDraft=${classDraft}
                  routineDraft=${routineDraft}
                  onTabChange=${setActiveTab}
                  onHomeworkDraftChange=${handleHomeworkDraftChange}
                  onHomeworkSubmit=${handleHomeworkSubmit}
                  onHomeworkCompleteToggle=${handleHomeworkCompleteToggle}
                  onHomeworkDelete=${handleHomeworkDelete}
                  onPlanNotificationDismiss=${handlePlanNotificationDismiss}
                  onHomeworkReschedule=${handleHomeworkReschedule}
                  onCalendarTaskDraftChange=${handleCalendarTaskDraftChange}
                  onCalendarTaskSubmit=${handleCalendarTaskSubmit}
                  onCalendarTaskEdit=${handleCalendarTaskEdit}
                  onCalendarTaskCancelEdit=${handleCalendarTaskCancelEdit}
                  onCalendarMonthChange=${handleCalendarToday}
                  onCalendarViewChange=${setCalendarView}
                  onSelectedCalendarDateChange=${setSelectedCalendarDate}
                  onCalendarTaskToggle=${handleCalendarTaskToggle}
                  onCalendarTaskDelete=${handleCalendarTaskDelete}
                  onRoutineChange=${handleRoutineChange}
                  onRoutineWorkloadSelect=${handleRoutineWorkloadSelect}
                  onRoutineActivityChange=${handleRoutineActivityChange}
                  onRoutineActivityAdd=${handleRoutineActivityAdd}
                  onRoutineActivityRemove=${handleRoutineActivityRemove}
                  onSaveRoutine=${handleSaveRoutine}
                  onClassDraftChange=${setClassDraft}
                  onClassAdd=${handleClassAdd}
                  onClassUpdate=${handleClassUpdate}
                  onClassRemove=${handleClassRemove}
                  onProfileDraftChange=${handleProfileDraftChange}
                  onAccountSubmit=${handleAccountSubmit}
                  onDisconnectProfile=${handleDisconnectProfile}
                  onLoadAskHistory=${handleLoadAskHistory}
                  onChatDraftChange=${setChatDraft}
                  onChatSubmit=${handleChatSubmit}
                  onChatRetry=${handleChatRetry}
                  onFeedbackChange=${(value) => {
                    setFeedbackDraft((currentDraft) => ({
                      ...currentDraft,
                      text: value,
                    }));
                    setFeedbackSubmitted(false);
                  }}
                  onFeedbackAreaChange=${(value) => {
                    setFeedbackDraft((currentDraft) => ({
                      ...currentDraft,
                      area: value,
                    }));
                    setFeedbackSubmitted(false);
                  }}
                  onFeedbackSubmit=${handleFeedbackSubmit}
                  onDailyLogChange=${handleDailyLogChange}
                  onDailyActivityChange=${handleDailyActivityChange}
                  onDailyActivityAdd=${handleDailyActivityAdd}
                  onDailyActivityRemove=${handleDailyActivityRemove}
                  onDailyActivitiesLockToggle=${handleDailyActivitiesLockToggle}
                  onDailyLogSubmit=${handleDailyLogSubmit}
                  onThoughtDraftChange=${setThoughtDraft}
                  onThoughtAdd=${handleThoughtAdd}
                  onThoughtUpdate=${handleThoughtUpdate}
                  onThoughtDelete=${handleThoughtDelete}
                  onThoughtArchive=${handleThoughtArchive}
                  onThoughtHandled=${handleThoughtHandled}
                  onThoughtConvertToTask=${handleThoughtConvertToTask}
                  onThoughtAskVireli=${handleThoughtAskVireli}
                  onClearAskHistory=${handleClearAskHistory}
                  onClearDailyLogs=${handleClearDailyLogs}
                  onResetSubjects=${handleResetSubjects}
                  onCalendarPreferenceChange=${handleCalendarPreferenceChange}
                />
              `}
      </${AnimatePresence}>

      ${undoToast
        ? html`
            <div className="undo-toast" role="status">
              <span>${undoToast.message}</span>
              <button type="button" onClick=${handleUndoToast}>Undo</button>
            </div>
          `
        : null}
    </div>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);

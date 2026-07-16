const { useEffect, useMemo, useRef, useState } = React;
const { motion, AnimatePresence } = Motion;
const html = htm.bind(React.createElement);

const NAV_ITEMS = [
  { id: "daily", label: "Homework" },
  { id: "daily-log", label: "Daily Log" },
  { id: "ask", label: "Ask VIRELI" },
  { id: "improve", label: "How can we improve" },
  { id: "settings", label: "Settings" },
];

const CLASS_STORAGE_KEY = "vireli.savedClasses.v1";
const HOMEWORK_STORAGE_KEY = "vireli.homework.v1";
const PROFILE_STORAGE_KEY = "vireli.profile.v1";
const SCENARIO_AGENT_STORAGE_KEY = "vireli.scenarioAgent.v1";
const ASK_HISTORY_STORAGE_KEY = "vireli.askHistory.v1";
const DAILY_LOG_STORAGE_KEY = "vireli.dailyLog.v1";
const FEEDBACK_STORAGE_KEY = "vireli.feedback.v1";
const RECOMMENDATION_STORAGE_KEY = "vireli.recommendations.v1";

const DEFAULT_CLASS_OPTIONS = [
  { id: "math", label: "Math" },
  { id: "science", label: "Science" },
  { id: "social-studies", label: "Social Studies" },
  { id: "language-arts", label: "Language Arts" },
  { id: "other", label: "Other" },
];

const MOOD_OPTIONS = [
  { id: "good", label: "Good", text: "Bright, lifted, and ready enough." },
  { id: "ok", label: "Ok", text: "Steady, neutral, or still waking up." },
  { id: "bad", label: "Bad", text: "Heavy, tired, stressed, or low." },
];

const RESPONSE_TYPE_OPTIONS = [
  { id: "mental-health", label: "Mental Health" },
  { id: "homework", label: "Homework" },
  { id: "conversation", label: "Conversation" },
];

const EMPTY_HOMEWORK_DRAFT = {
  classId: "",
  title: "",
  topic: "",
  details: "",
  notes: "",
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
  password: "",
  authMode: "",
  createdAt: "",
  updatedAt: "",
};

const EMPTY_DAILY_LOG_DRAFT = {
  id: "",
  rating: "",
  couldBeBetter: "",
  activities: [""],
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

const INTRO_ANIMATION_SECONDS = 5.1;
const INTRO_SCREEN_DURATION_MS = 6100;
const THEME_TRANSITION_DURATION_MS = 2000;
const DAY_MODE_START_HOUR = 3;
const REFLECTION_MODE_START_HOUR = 15;
const CHAT_RESPONSE_DELAY_MS = 720;
const SCENARIO_AGENT_INTERVAL_MS = 45000;
const SCENARIO_AGENT_LOG_LIMIT = 24;
const ASK_HISTORY_LIMIT = 16;
const ASK_RECENT_WINDOW_DAYS = 7;
const RECOMMENDATION_LIMIT = 12;

const DAILY_LOG_RATINGS = ["Great", "Good", "OK", "Bad", "Miserable"];
const SCHEDULE_OPTIONS = ["Morning", "Afternoon", "Evening", "Custom"];

const FEEDBACK_AREAS = [
  "Homework",
  "Ask VIRELI",
  "Daily Log",
  "Settings",
  "Design",
  "Other",
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
      good: "Hi, I'm VIRELI. You seem like you have some energy today, so tell me what you want to sort out.",
      ok: "Hi, I'm VIRELI. Tell me what is on your mind, and I will help you find a clear next step.",
      bad: "Hi, I'm VIRELI. We can keep this calm and small. Tell me what feels hardest right now.",
      overwhelmed: "Hi, I'm VIRELI. Take it one piece at a time. What should we make less heavy first?",
    }[mood] || "Hi, I'm VIRELI. Tell me what is on your mind, and I will help you find a clear next step.";

  return [
    {
      id: makeId("assistant-intro"),
      role: "assistant",
      content: opener,
      createdAt: new Date().toISOString(),
    },
  ];
}

const SCENARIO_AGENT_PROMPTS = [
  {
    responseType: "mental-health",
    prompt: "I feel behind because everyone online seems happier and more successful than me",
    mood: "bad",
  },
  {
    responseType: "mental-health",
    prompt: "I have too much homework and I feel like I cannot keep up anymore",
    mood: "overwhelmed",
  },
  {
    responseType: "mental-health",
    prompt: "I feel left out at school and I do not know who to talk to",
    mood: "bad",
  },
  {
    responseType: "mental-health",
    prompt: "I am exhausted and worried about my future and grades",
    mood: "ok",
  },
  {
    responseType: "homework",
    prompt: "Explain how to solve a linear equation with slope and y-intercept",
    mood: "ok",
  },
  {
    responseType: "homework",
    prompt: "How do I write a thesis and use evidence in a Language Arts essay",
    mood: "ok",
  },
  {
    responseType: "homework",
    prompt: "What are variables and controls in a science experiment",
    mood: "ok",
  },
  {
    responseType: "homework",
    prompt: "How do I answer a social studies question about cause and effect in history",
    mood: "ok",
  },
  {
    responseType: "conversation",
    prompt: "My friend ignored me at lunch and I keep replaying every word",
    mood: "bad",
  },
  {
    responseType: "conversation",
    prompt: "I want to talk about why today felt weird even though nothing huge happened",
    mood: "ok",
  },
  {
    responseType: "conversation",
    prompt: "I am proud of myself but I do not know how to explain why",
    mood: "good",
  },
  {
    responseType: "conversation",
    prompt: "I need someone to actually listen before giving advice",
    mood: "ok",
  },
];

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
    .map((item) => ({
      id: item.id || makeId("homework"),
      classId: item.classId || "",
      classLabel: item.classLabel || "",
      title: item.title || "",
      topic: item.topic || "",
      details: item.details || item.notes || "",
      notes: item.notes || "",
      scheduledFor: item.scheduledFor || "",
      customSchedule: item.customSchedule || "",
      attachmentName: item.attachmentName || "",
      attachmentType: item.attachmentType || "",
      attachmentPreview: item.attachmentPreview || "",
      guidance: item.guidance || "",
      completed: Boolean(item.completed),
      createdAt: item.createdAt || new Date().toISOString(),
    }))
    .filter((item) => item.title);
}

function loadProfile() {
  const profile = readPersistentObject(PROFILE_STORAGE_KEY, EMPTY_PROFILE);
  return {
    ...EMPTY_PROFILE,
    ...profile,
    connected: Boolean(profile.connected),
    guest: Boolean(profile.guest),
    password: "",
  };
}

function getScheduleLabel(item) {
  if (item.scheduledFor === "Custom") {
    return item.customSchedule || "Custom time";
  }

  return item.scheduledFor || "Unscheduled";
}

function loadAskHistory() {
  return readPersistentArray(ASK_HISTORY_STORAGE_KEY)
    .map((entry) => ({
      id: entry.id || makeId("chat-history"),
      title: entry.title || "Ask VIRELI chat",
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: entry.updatedAt || entry.createdAt || new Date().toISOString(),
      messages: Array.isArray(entry.messages) ? entry.messages : [],
    }))
    .filter((entry) => entry.messages.length)
    .slice(0, ASK_HISTORY_LIMIT);
}

function saveAskHistory(entries) {
  writePersistentArray(ASK_HISTORY_STORAGE_KEY, entries.slice(0, ASK_HISTORY_LIMIT));
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
  return "Homework";
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

function loadScenarioAgentLog() {
  return readPersistentArray(SCENARIO_AGENT_STORAGE_KEY).slice(0, SCENARIO_AGENT_LOG_LIMIT);
}

function saveScenarioAgentLog(entries) {
  const boundedEntries = entries.slice(0, SCENARIO_AGENT_LOG_LIMIT);

  writePersistentArray(
    SCENARIO_AGENT_STORAGE_KEY,
    boundedEntries,
  );

  if (typeof window !== "undefined") {
    window.__VIRELI_SCENARIO_AGENT_STATUS__ = {
      active: true,
      lastRunAt: boundedEntries[0]?.createdAt || "",
      lastResponseType: boundedEntries[0]?.responseType || "",
      runCount: boundedEntries.length,
    };
  }

  if (typeof document !== "undefined" && document.body) {
    document.body.dataset.scenarioAgent = "active";
  }
}

function runScenarioAgentPass({ mood, moodNote, timeMode, previousLog = [] }) {
  const previousCount = previousLog.length;
  const scenario = SCENARIO_AGENT_PROMPTS[previousCount % SCENARIO_AGENT_PROMPTS.length];
  const recentEntry = previousLog[0];
  const response = buildCoachReply(scenario.prompt, {
    mood: scenario.mood || mood || "ok",
    moodNote,
    timeMode,
    responseType: scenario.responseType,
    responseIndex: previousCount,
    recentUserPrompt: recentEntry?.prompt || "",
    recentAssistantResponse: recentEntry?.response || "",
  });

  return {
    id: makeId("scenario"),
    createdAt: new Date().toISOString(),
    responseType: scenario.responseType,
    prompt: scenario.prompt,
    response,
  };
}

function normalizeRecommendation(entry = {}) {
  return {
    id: entry.id || makeId("recommendation"),
    category: entry.category || "planning",
    title: entry.title || "Small next step",
    message: entry.message || "Choose one helpful action and keep it simple.",
    actionLabel: entry.actionLabel || "Open",
    targetTab: entry.targetTab || "daily",
    priority: Number.isFinite(Number(entry.priority)) ? Number(entry.priority) : 1,
    createdAt: entry.createdAt || new Date().toISOString(),
  };
}

function loadRecommendations() {
  return readPersistentArray(RECOMMENDATION_STORAGE_KEY)
    .map(normalizeRecommendation)
    .slice(0, RECOMMENDATION_LIMIT);
}

function saveRecommendations(entries) {
  writePersistentArray(
    RECOMMENDATION_STORAGE_KEY,
    entries.map(normalizeRecommendation).slice(0, RECOMMENDATION_LIMIT),
  );
}

function createRecommendation(category, title, message, actionLabel, targetTab, priority = 1) {
  return normalizeRecommendation({
    id: makeId(`recommendation-${category}`),
    category,
    title,
    message,
    actionLabel,
    targetTab,
    priority,
    createdAt: new Date().toISOString(),
  });
}

function getRecommendationKey(recommendation) {
  return `${recommendation.category}|${recommendation.title}|${recommendation.targetTab}`;
}

function mergeRecommendations(nextRecommendations, existingRecommendations = []) {
  const seen = new Set();
  return [...nextRecommendations, ...existingRecommendations]
    .map(normalizeRecommendation)
    .sort((a, b) => b.priority - a.priority || new Date(b.createdAt) - new Date(a.createdAt))
    .filter((recommendation) => {
      const key = getRecommendationKey(recommendation);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, RECOMMENDATION_LIMIT);
}

function textContainsSafetySignal(text) {
  return MOOD_NOTE_SAFETY_PATTERNS.some((pattern) => pattern.test(text || ""));
}

function runRecommendationAgentPass({
  savedClasses = [],
  homeworkItems = [],
  moodSelection = "ok",
  askHistory = [],
  dailyLogs = [],
  timeMode = getTimeOfDayMode(),
  scenarioLog = [],
}) {
  const openHomeworkItems = homeworkItems.filter((item) => !item.completed);
  const unscheduledHomeworkItems = openHomeworkItems.filter((item) => !item.scheduledFor);
  const recentAskText = askHistory
    .slice(0, 4)
    .flatMap((entry) => entry.messages || [])
    .map((message) => message.content || "")
    .join(" ");
  const latestLogs = dailyLogs.slice(0, 3);
  const logText = latestLogs
    .map((log) =>
      [
        log.rating,
        log.couldBeBetter,
        ...(log.activities || []),
        log.wentWell,
        log.didNotGoWell,
        log.highlight,
      ].join(" "),
    )
    .join(" ");
  const recommendations = [];

  if (textContainsSafetySignal(`${recentAskText} ${logText}`)) {
    recommendations.push(
      createRecommendation(
        "mental-health",
        "Get support now",
        "If you might hurt yourself or you are not safe, contact a trusted adult, call 988, or call 911 for immediate danger.",
        "Open Ask VIRELI",
        "ask",
        10,
      ),
    );
  }

  if (savedClasses.length === 0) {
    recommendations.push(
      createRecommendation(
        "classes",
        "Add your classes",
        "Save your classes so VIRELI can organize homework and recommendations better.",
        "Open Settings",
        "settings",
        8,
      ),
    );
  } else if (savedClasses.length === 1) {
    recommendations.push(
      createRecommendation(
        "classes",
        "Add the rest of your schedule",
        "You only have one class saved. Add the others so homework planning feels complete.",
        "Manage classes",
        "settings",
        5,
      ),
    );
  }

  if (openHomeworkItems.length > 0) {
    const firstOpenItem = openHomeworkItems[0];
    recommendations.push(
      createRecommendation(
        "homework",
        "Pick one homework item first",
        `You have ${openHomeworkItems.length} open homework item${openHomeworkItems.length === 1 ? "" : "s"}. Start with ${firstOpenItem.topic || firstOpenItem.title || "one small task"}.`,
        "Open homework",
        "daily",
        7,
      ),
    );
  }

  if (unscheduledHomeworkItems.length > 0) {
    recommendations.push(
      createRecommendation(
        "planning",
        "Schedule unfinished work",
        `${unscheduledHomeworkItems.length} homework item${unscheduledHomeworkItems.length === 1 ? " needs" : "s need"} a time. Pick Morning, Afternoon, Evening, or Custom.`,
        "Add schedule",
        "daily",
        6,
      ),
    );
  }

  if (/(homework|math|english|science|social studies|language arts|essay|equation|assignment|study)/i.test(recentAskText)) {
    recommendations.push(
      createRecommendation(
        "ask-vireli",
        "Save Ask VIRELI homework topics",
        "Recent Ask VIRELI chats mention schoolwork. Save any unfinished topic as homework so it does not get lost.",
        "Open Ask VIRELI",
        "ask",
        5,
      ),
    );
  }

  if (/(stress|stressed|anxious|anxiety|overwhelmed|sad|tired|pressure|behind|lonely)/i.test(recentAskText)) {
    recommendations.push(
      createRecommendation(
        "mental-health",
        "Use a calmer support mode",
        "Ask VIRELI has stress signals. Use Mental Health mode and keep the next step small.",
        "Open Ask VIRELI",
        "ask",
        6,
      ),
    );
  }

  if (timeMode === "night" && dailyLogs.length === 0) {
    recommendations.push(
      createRecommendation(
        "daily-log",
        "Do a quick Daily Log",
        "Daily Log is open now. Add a few mini boxes so VIRELI can spot patterns over time.",
        "Open Daily Log",
        "daily-log",
        4,
      ),
    );
  }

  if (latestLogs.some((log) => ["Bad", "Miserable"].includes(log.rating))) {
    recommendations.push(
      createRecommendation(
        "mental-health",
        "Make the plan smaller",
        "Your recent Daily Log looks heavy. Keep tonight's plan shorter and ask someone you trust for support if needed.",
        "Open Daily Log",
        "daily-log",
        7,
      ),
    );
  }

  if (latestLogs.some((log) => ["Great", "Good"].includes(log.rating) || log.highlight)) {
    recommendations.push(
      createRecommendation(
        "daily-log",
        "Notice one win",
        "Your logs show something positive. Name one win before moving to the next task.",
        "Review logs",
        "settings",
        3,
      ),
    );
  }

  if (openHomeworkItems.length === 0 && savedClasses.length > 0 && scenarioLog.length > 0) {
    recommendations.push(
      createRecommendation(
        "planning",
        "Keep the board light",
        "Your homework board is clear. Add only what is real so VIRELI stays easy to trust.",
        "Open planner",
        "daily",
        2,
      ),
    );
  }

  if (moodSelection === "bad" || moodSelection === "overwhelmed") {
    recommendations.push(
      createRecommendation(
        "mental-health",
        "Start with one gentle step",
        "Your mood check-in was heavy. Choose one small task, then pause before adding more.",
        "Open Ask VIRELI",
        "ask",
        6,
      ),
    );
  }

  if (!recommendations.length) {
    recommendations.push(
      createRecommendation(
        "planning",
        "Choose one next step",
        "VIRELI is ready. Add homework, ask a question, or save a quick Daily Log when the day slows down.",
        "Open planner",
        "daily",
        1,
      ),
    );
  }

  return recommendations;
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
      <div className="brand-mark" aria-hidden="true">V</div>
      <div className="brand-meta">
        <span className="brand-name">VIRELI</span>
        <span className="brand-subtitle">Student wellness studio</span>
      </div>
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

function IntroScreen() {
  return html`
    <${motion.section}
      className="intro-screen min-h-screen relative flex items-center justify-center overflow-hidden px-6"
      initial=${{ opacity: 0 }}
      animate=${{ opacity: 1 }}
      exit=${{ opacity: 0 }}
      transition=${{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="intro-haze intro-haze-left"></div>
      <div className="intro-haze intro-haze-right"></div>
      <div className="intro-grid"></div>
      <div className="intro-title-shell">
        <${motion.div}
          initial=${{
            x: -260,
            opacity: 0,
            filter: "blur(18px)",
            scale: 0.94,
          }}
          animate=${{
            x: [-260, -40, 0, 0],
            opacity: [0, 0.72, 1, 1],
            filter: ["blur(18px)", "blur(4px)", "blur(0px)", "blur(0px)"],
            scale: [0.94, 0.99, 1.02, 1],
          }}
          transition=${{
            duration: INTRO_ANIMATION_SECONDS - 1.25,
            times: [0, 0.52, 0.82, 1],
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <span className="intro-overline">student wellness and productivity</span>
          <h1 className="intro-word font-display">VIRELI</h1>
        </${motion.div}>
        <${motion.p}
          className="intro-credit"
          initial=${{ opacity: 0, y: 10, filter: "blur(7px)" }}
          animate=${{ opacity: [0, 0, 0.86, 0.86], y: [10, 10, 0, 0], filter: ["blur(7px)", "blur(7px)", "blur(0px)", "blur(0px)"] }}
          transition=${{
            duration: 1.9,
            times: [0, 0.34, 0.72, 1],
            delay: INTRO_ANIMATION_SECONDS - 1.05,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          by KRIBU STUDIOS
        </${motion.p}>
      </div>
    </${motion.section}>
  `;
}

function MoodCheckInScreen({
  moodSelection,
  onMoodSelect,
}) {
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
            <p className="eyebrow">Mood pulse</p>
            <h2 className="font-display">How are you doing today?</h2>
            <p>
              Quick check. Pick what feels closest, then VIRELI will help with
              homework without making the day feel bigger than it is.
            </p>
          </div>

          <div className="mood-grid">
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
        </${motion.div}>
      </div>
    </${motion.section}>
  `;
}

function AccountScreen({
  profile,
  profileDraft,
  onProfileDraftChange,
  onAccountSubmit,
  onForgotPassword,
  onContinueAsGuest,
}) {
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
          className="mood-panel profile-panel google-auth-panel"
          initial=${{ opacity: 0, y: 28 }}
          animate=${{ opacity: 1, y: 0 }}
          transition=${{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mood-heading">
            <div className="google-auth-mark" aria-hidden="true">
              <span>V</span>
            </div>
            <p className="eyebrow">Account</p>
            <h2 className="font-display">Sign in to VIRELI</h2>
            <p>
              Save your classes, homework, chats, logs, and recommendations on
              this device. Real Google sign-in can be added later with Google OAuth.
            </p>
          </div>

          <form className="profile-form" onSubmit=${(event) => onAccountSubmit(event, "signin")}>
            <label className="field-stack">
              <span>Email</span>
              <input
                className="planning-input"
                value=${profileDraft.email}
                onInput=${(event) => onProfileDraftChange("email", event.target.value)}
                placeholder="you@gmail.com"
                type="email"
                autoComplete="email"
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
                autoComplete="current-password"
              />
            </label>
          </form>

          <div className="mood-control-row">
            <button type="button" className="secondary-button" onClick=${onForgotPassword}>
              Forgot password?
            </button>
            <button type="button" className="secondary-button" onClick=${onContinueAsGuest}>
              Continue as guest
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick=${(event) => onAccountSubmit(event, "signup")}
              disabled=${!profileDraft.email.trim() || !profileDraft.password.trim()}
            >
              Sign up
            </button>
            <button
              type="button"
              className="primary-button"
              onClick=${(event) => onAccountSubmit(event, "signin")}
              disabled=${!profileDraft.email.trim() || !profileDraft.password.trim()}
            >
              Sign in
            </button>
          </div>

          <p className="privacy-note">
            ${profile.connected
              ? "Signed in locally. This demo keeps profile data on this device."
              : "This is a local VIRELI account screen for now, not real Google authentication."}
          </p>
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
              this once, and you can edit the list later in Settings.
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

function DailyLogPanel({
  timeMode,
  dailyLogDraft,
  dailyLogSubmitted,
  onDailyLogChange,
  onDailyActivityChange,
  onDailyActivityAdd,
  onDailyActivityRemove,
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
                <span>What did you do today?</span>
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
                        />
                        <button
                          type="button"
                          className="secondary-button"
                          onClick=${() => onDailyActivityRemove(index)}
                          disabled=${activityItems.length <= 1}
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
                  disabled=${activityItems.length >= 8}
                >
                  Add another
                </button>
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

function PlanTodayTab({
  todayLabel,
  timeMode,
  savedClasses,
  selectedHomeworkClassIds,
  recommendations,
  homeworkItems,
  homeworkDraft,
  onRecommendationAction,
  onHomeworkClassToggle,
  onHomeworkDraftChange,
  onHomeworkFileChange,
  onHomeworkSubmit,
  onHomeworkCompleteToggle,
  onHomeworkDelete,
}) {
  const openHomeworkItems = homeworkItems.filter((item) => !item.completed);
  const completedHomeworkItems = homeworkItems.filter((item) => item.completed);
  const activeHomeworkClassIds = selectedHomeworkClassIds.length
    ? selectedHomeworkClassIds
    : homeworkDraft.classId
      ? [homeworkDraft.classId]
      : [];
  const planTitle = getPlanTodayTitle(timeMode);
  const planLead =
    "Track the classes with homework, add the topic, and keep the next step visible.";

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
          <p className="eyebrow">Homework</p>
          <h1 className="font-display">${planTitle}</h1>
          <p className="tab-heading-lead">${planLead}</p>
        </div>
        <span className="date-chip">${todayLabel}</span>
      </div>

      <div className="daily-grid">
        <article className="feature-card recommendation-card feature-card-quote-wide">
          <div className="card-topline card-topline-simple">
            <span className="micro-badge">Recommendation Agent</span>
          </div>
          <h3 className="font-display section-title-lg">VIRELI Recommendations</h3>
          <p>Short suggestions from your homework, mood, Ask VIRELI, and Daily Log patterns.</p>

          <div className="recommendation-list">
            ${recommendations.length
              ? recommendations.slice(0, 3).map(
                  (recommendation) => html`
                    <div
                      key=${recommendation.id}
                      className=${cx("recommendation-item", `is-${recommendation.category}`)}
                    >
                      <div>
                        <span className="recommendation-badge">${recommendation.category}</span>
                        <h4 className="font-display">${recommendation.title}</h4>
                        <p>${recommendation.message}</p>
                      </div>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick=${() => onRecommendationAction(recommendation.targetTab)}
                      >
                        ${recommendation.actionLabel}
                      </button>
                    </div>
                  `,
                )
              : html`
                  <div className="soft-note">
                    <p>Recommendations will appear after VIRELI has something useful to review.</p>
                  </div>
                `}
          </div>
        </article>

        <article className="feature-card feature-card-support">
          <div className="card-topline card-topline-simple">
            <span className="mood-chip">${savedClasses.length} classes</span>
          </div>
          <h3 className="font-display section-title-lg">Add homework</h3>
          <p>
            Choose the subject, name the topic, attach the work if you want,
            and VIRELI will keep a short guide with it.
          </p>

          <div className="chip-field homework-subject-picker">
            <span className="field-label">Which classes do you have homework for?</span>
            <div className="choice-chip-row">
              ${savedClasses.length
                ? savedClasses.map(
                    (schoolClass) => html`
                      <button
                        key=${`homework-pick-${schoolClass.id}`}
                        type="button"
                        className=${cx(
                          "choice-chip",
                          activeHomeworkClassIds.includes(schoolClass.id) && "is-selected",
                        )}
                        aria-pressed=${activeHomeworkClassIds.includes(schoolClass.id)}
                        onClick=${() => onHomeworkClassToggle(schoolClass.id)}
                      >
                        ${schoolClass.label}
                      </button>
                    `,
                  )
                : html`<span className="soft-note-inline">Add classes in Settings first.</span>`}
            </div>
          </div>

          <form className="homework-form" onSubmit=${onHomeworkSubmit}>
            <label className="field-stack">
              <span>Class</span>
              <select
                className="planning-input"
                value=${homeworkDraft.classId}
                onChange=${(event) => onHomeworkDraftChange("classId", event.target.value)}
                disabled=${savedClasses.length === 0}
              >
                <option value="">Choose a class</option>
                ${savedClasses.map(
                  (schoolClass) => html`
                    <option key=${schoolClass.id} value=${schoolClass.id}>
                      ${schoolClass.label}
                    </option>
                  `,
                )}
              </select>
            </label>

            <label className="field-stack">
              <span>Topic</span>
              <input
                className="planning-input"
                value=${homeworkDraft.topic}
                onInput=${(event) => onHomeworkDraftChange("topic", event.target.value)}
                placeholder="Algebra, fractions, essay writing, biology cells..."
              />
            </label>

            <label className="field-stack">
              <span>Attach homework</span>
              <input
                className="planning-input file-input"
                type="file"
                accept="image/*,.pdf,.txt,.doc,.docx"
                onChange=${onHomeworkFileChange}
              />
            </label>

            ${homeworkDraft.attachmentName
              ? html`
                  <div className="attachment-note">
                    <span>${homeworkDraft.attachmentName}</span>
                    <small>Saved as attachment context. VIRELI does not scan files in this version.</small>
                    ${homeworkDraft.attachmentPreview
                      ? html`<img src=${homeworkDraft.attachmentPreview} alt="Homework attachment preview" />`
                      : null}
                  </div>
                `
              : null}

            <label className="field-stack">
              <span>Details</span>
              <textarea
                className="planning-input planning-textarea"
                value=${homeworkDraft.details}
                onInput=${(event) => onHomeworkDraftChange("details", event.target.value)}
                placeholder="Type the question, directions, page numbers, or the part that is confusing."
                rows="4"
              ></textarea>
            </label>

            <label className="field-stack">
              <span>When will you work on it?</span>
              <select
                className="planning-input"
                value=${homeworkDraft.scheduledFor}
                onChange=${(event) => onHomeworkDraftChange("scheduledFor", event.target.value)}
              >
                <option value="">Choose a time</option>
                ${SCHEDULE_OPTIONS.map(
                  (option) => html`<option key=${option} value=${option}>${option}</option>`,
                )}
              </select>
            </label>

            ${homeworkDraft.scheduledFor === "Custom"
              ? html`
                  <label className="field-stack">
                    <span>Custom time</span>
                    <input
                      className="planning-input"
                      value=${homeworkDraft.customSchedule}
                      onInput=${(event) => onHomeworkDraftChange("customSchedule", event.target.value)}
                      placeholder="After dinner, 7:30 PM..."
                    />
                  </label>
                `
              : null}
          </form>

          <div className="card-footer-row">
            <span>
              ${savedClasses.length
                ? "Saved classes stay available after restart."
                : "Add classes in Settings to start tracking homework."}
            </span>
            <button
              type="button"
              className="secondary-button"
              onClick=${onHomeworkSubmit}
              disabled=${!homeworkDraft.classId || !homeworkDraft.topic.trim()}
            >
              Add
            </button>
          </div>
        </article>

        <article className="feature-card feature-card-quote feature-card-quote-wide">
          <h3 className="font-display">Homework list</h3>

          ${homeworkItems.length
            ? html`
                <div className="homework-list">
                  ${homeworkItems.map(
                    (item) => html`
                      <div key=${item.id} className=${cx("homework-item", item.completed && "is-complete")}>
                        <div>
                          <span className="eyebrow">
                            ${item.classLabel || getClassLabel(savedClasses, item.classId)}
                          </span>
                          <p>${item.title}</p>
                          ${item.topic
                            ? html`<small>Topic: ${item.topic}</small>`
                            : null}
                          ${item.attachmentName
                            ? html`<small>Attachment: ${item.attachmentName}</small>`
                            : null}
                          ${item.guidance
                            ? html`<small className="homework-guidance">${item.guidance}</small>`
                            : null}
                          ${item.details || item.notes
                            ? html`<small>${item.details || item.notes}</small>`
                            : null}
                        </div>
                        <div className="homework-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick=${() => onHomeworkCompleteToggle(item.id)}
                          >
                            ${item.completed ? "Reopen" : "Done"}
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick=${() => onHomeworkDelete(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    `,
                  )}
                </div>
              `
            : html`
                <p>
                  No homework added yet. Add one above when a class has work.
                </p>
              `}

          <blockquote className="font-display">
            ${completedHomeworkItems.length
              ? `${completedHomeworkItems.length} finished. Keep going gently.`
              : "A clear list makes the next step easier to trust."}
          </blockquote>
        </article>

        <article className="feature-card planner-chip-card feature-card-quote-wide">
          <h3 className="font-display">Bottom planner</h3>
          <p>Scheduled homework stays here as simple chips.</p>
          <div className="planner-chip-row">
            ${openHomeworkItems.length
              ? openHomeworkItems.map(
                  (item) => html`
                    <div key=${`planner-${item.id}`} className="planner-chip">
                      <span>${item.classLabel || getClassLabel(savedClasses, item.classId)}</span>
                      <strong>${getScheduleLabel(item)}</strong>
                      <small>${item.topic || item.title}</small>
                    </div>
                  `,
                )
              : html`<span className="soft-note-inline">No scheduled homework yet.</span>`}
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
  onDailyLogChange,
  onDailyActivityChange,
  onDailyActivityAdd,
  onDailyActivityRemove,
  onDailyLogSubmit,
}) {
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
            A short check-in for the end of the day.
          </p>
        </div>
      </div>

      <div className="daily-grid daily-log-grid">
        <${DailyLogPanel}
          timeMode=${timeMode}
          dailyLogDraft=${dailyLogDraft}
          dailyLogSubmitted=${dailyLogSubmitted}
          onDailyLogChange=${onDailyLogChange}
          onDailyActivityChange=${onDailyActivityChange}
          onDailyActivityAdd=${onDailyActivityAdd}
          onDailyActivityRemove=${onDailyActivityRemove}
          onDailyLogSubmit=${onDailyLogSubmit}
        />
      </div>
    </${motion.section}>
  `;
}

function AskVireliTab({
  messages,
  recentAskHistory,
  chatDraft,
  responseType,
  isTyping,
  chatError,
  onLoadAskHistory,
  onChatDraftChange,
  onResponseTypeChange,
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
          <h1 className="font-display">Ask what feels useful right now.</h1>
          <p className="tab-heading-lead">
            Share the real question, messy thought, or next-step problem. VIRELI
            will shape the answer around your mood, timing, and recent context.
          </p>
        </div>
      </div>

      <div className="assistant-shell">
        <div className="chat-shell">
          <div className="ask-empty-note">
            <p className="eyebrow">Open conversation</p>
            <h2 className="font-display">Ask naturally. VIRELI will meet the shape of the moment.</h2>
            <p>
              Planning, reflection, motivation, confusion, homework stress, or
              a small next step are all welcome here.
            </p>
          </div>

          ${recentAskHistory.length
            ? html`
                <div className="recent-chat-panel">
                  <span className="field-label">Recent chats</span>
                  <div className="recent-chat-row">
                    ${recentAskHistory.slice(0, 4).map(
                      (entry) => html`
                        <button
                          key=${entry.id}
                          type="button"
                          className="recent-chat-chip"
                          onClick=${() => onLoadAskHistory(entry.id)}
                        >
                          <span>${entry.title}</span>
                          <small>${formatDateTime(entry.updatedAt)}</small>
                        </button>
                      `,
                    )}
                  </div>
                </div>
              `
            : null}

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
              placeholder="Ask VIRELI anything you want help sorting..."
              aria-label="Ask VIRELI"
              disabled=${isTyping}
            />
            <div className="response-type-control" role="group" aria-label="Response type">
              ${RESPONSE_TYPE_OPTIONS.map(
                (option) => html`
                  <button
                    key=${option.id}
                    type="button"
                    className=${cx(
                      "response-type-button",
                      responseType === option.id && "is-selected",
                    )}
                    aria-pressed=${responseType === option.id}
                    onClick=${() => onResponseTypeChange(option.id)}
                    disabled=${isTyping}
                  >
                    ${option.label}
                  </button>
                `,
              )}
            </div>
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
  recommendations,
  profile,
  profileDraft,
  onClassDraftChange,
  onClassAdd,
  onClassUpdate,
  onClassRemove,
  onProfileDraftChange,
  onAccountSubmit,
  onDisconnectProfile,
  onClearAskHistory,
  onClearDailyLogs,
  onClearRecommendations,
  onResetSubjects,
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

      <div className="settings-grid">
        <article className="feature-card">
          <h3 className="font-display">Account</h3>
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
        </article>

        <article className="feature-card settings-class-card">
          <h3 className="font-display">Subjects</h3>
          <p>Add, edit, or remove the classes VIRELI uses for homework.</p>

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
        </article>

        <article className="feature-card">
          <h3 className="font-display">Archived chats</h3>
          <p>Chats not used in the last 7 days move here.</p>

          <div className="history-list">
            ${archivedAskHistory.length
              ? archivedAskHistory.map(
                  (entry) => html`
                    <details key=${entry.id} className="history-item">
                      <summary>
                        <span>${entry.title}</span>
                        <small>${formatDateTime(entry.updatedAt)}</small>
                      </summary>
                      <div className="history-messages">
                        ${entry.messages.map(
                          (message) => html`
                            <p key=${message.id || message.content}>
                              <strong>${message.role === "user" ? "You" : "VIRELI"}:</strong>
                              ${message.content}
                            </p>
                          `,
                        )}
                      </div>
                    </details>
                  `,
                )
              : html`<div className="soft-note"><p>No archived chats yet.</p></div>`}
          </div>
        </article>

        <article className="feature-card">
          <h3 className="font-display">Daily Logs</h3>
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
        </article>

        <article className="feature-card">
          <h3 className="font-display">Recommendation History</h3>
          <p>Recent suggestions from the VIRELI Recommendation Agent.</p>

          <div className="history-list">
            ${recommendations.length
              ? recommendations.map(
                  (recommendation) => html`
                    <div key=${recommendation.id} className="history-item recommendation-history-item">
                      <div>
                        <span className="recommendation-badge">${recommendation.category}</span>
                        <strong>${recommendation.title}</strong>
                        <p>${recommendation.message}</p>
                      </div>
                      <small>${formatDateTime(recommendation.createdAt)}</small>
                    </div>
                  `,
                )
              : html`<div className="soft-note"><p>No recommendations saved yet.</p></div>`}
          </div>
        </article>

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
  responseType,
  messages,
  recentAskHistory,
  archivedAskHistory,
  profile,
  profileDraft,
  isTyping,
  chatError,
  savedClasses,
  selectedHomeworkClassIds,
  recommendations,
  homeworkItems,
  homeworkDraft,
  dailyLogs,
  classDraft,
  onTabChange,
  onRecommendationAction,
  onHomeworkClassToggle,
  onHomeworkDraftChange,
  onHomeworkFileChange,
  onHomeworkSubmit,
  onHomeworkCompleteToggle,
  onHomeworkDelete,
  onClassDraftChange,
  onClassAdd,
  onClassUpdate,
  onClassRemove,
  onProfileDraftChange,
  onAccountSubmit,
  onDisconnectProfile,
  onLoadAskHistory,
  onChatDraftChange,
  onResponseTypeChange,
  onChatSubmit,
  onChatRetry,
  onFeedbackChange,
  onFeedbackAreaChange,
  onFeedbackSubmit,
  onDailyLogChange,
  onDailyActivityChange,
  onDailyActivityAdd,
  onDailyActivityRemove,
  onDailyLogSubmit,
  onClearAskHistory,
  onClearDailyLogs,
  onClearRecommendations,
  onResetSubjects,
}) {
  let activeView = null;

  if (activeTab === "daily") {
    activeView = html`
      <${PlanTodayTab}
        todayLabel=${todayLabel}
        timeMode=${timeMode}
        savedClasses=${savedClasses}
        selectedHomeworkClassIds=${selectedHomeworkClassIds}
        recommendations=${recommendations}
        homeworkItems=${homeworkItems}
        homeworkDraft=${homeworkDraft}
        onRecommendationAction=${onRecommendationAction}
        onHomeworkClassToggle=${onHomeworkClassToggle}
        onHomeworkDraftChange=${onHomeworkDraftChange}
        onHomeworkFileChange=${onHomeworkFileChange}
        onHomeworkSubmit=${onHomeworkSubmit}
        onHomeworkCompleteToggle=${onHomeworkCompleteToggle}
        onHomeworkDelete=${onHomeworkDelete}
      />
    `;
  } else if (activeTab === "daily-log") {
    activeView = html`
      <${DailyLogTab}
        timeMode=${timeMode}
        dailyLogDraft=${dailyLogDraft}
        dailyLogSubmitted=${dailyLogSubmitted}
        onDailyLogChange=${onDailyLogChange}
        onDailyActivityChange=${onDailyActivityChange}
        onDailyActivityAdd=${onDailyActivityAdd}
        onDailyActivityRemove=${onDailyActivityRemove}
        onDailyLogSubmit=${onDailyLogSubmit}
      />
    `;
  } else if (activeTab === "ask") {
    activeView = html`
      <${AskVireliTab}
        messages=${messages}
        recentAskHistory=${recentAskHistory}
        chatDraft=${chatDraft}
        responseType=${responseType}
        isTyping=${isTyping}
        chatError=${chatError}
        onLoadAskHistory=${onLoadAskHistory}
        onChatDraftChange=${onChatDraftChange}
        onResponseTypeChange=${onResponseTypeChange}
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
        recommendations=${recommendations}
        profile=${profile}
        profileDraft=${profileDraft}
        onClassDraftChange=${onClassDraftChange}
        onClassAdd=${onClassAdd}
        onClassUpdate=${onClassUpdate}
        onClassRemove=${onClassRemove}
        onProfileDraftChange=${onProfileDraftChange}
        onAccountSubmit=${onAccountSubmit}
        onDisconnectProfile=${onDisconnectProfile}
        onClearAskHistory=${onClearAskHistory}
        onClearDailyLogs=${onClearDailyLogs}
        onClearRecommendations=${onClearRecommendations}
        onResetSubjects=${onResetSubjects}
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
          <${BrandLockup} />
          <div className="header-pill">
            <span className="header-pill-label">${getPlanTodayTitle(timeMode)}</span>
            <strong>${savedClasses.length} classes</strong>
          </div>
        </header>

        <div className="dashboard-layout">
          <aside className="surface-panel sidebar-panel">
            <div className="sidebar-head">
              <p className="eyebrow">Navigation</p>
              <h2 className="font-display">Choose your space.</h2>
            </div>

            <nav className="sidebar-nav" aria-label="Primary">
              ${NAV_ITEMS.map(
                (item) => html`
                  <button
                    key=${item.id}
                    type="button"
                    className=${cx("nav-button", activeTab === item.id && "is-active")}
                    onClick=${() => onTabChange(item.id)}
                  >
                    ${item.id === "daily" ? getPlanTodayTitle(timeMode) : item.label}
                  </button>
                `,
              )}
            </nav>
          </aside>

          <main className="surface-panel content-panel">
            <${AnimatePresence} mode="wait">${activeView}</${AnimatePresence}>
          </main>
        </div>
      </div>
    </${motion.section}>
  `;
}

function App() {
  const [introComplete, setIntroComplete] = useState(false);
  const [moodSelection, setMoodSelection] = useState("");
  const [moodNote, setMoodNote] = useState("");
  const [moodCheckInComplete, setMoodCheckInComplete] = useState(false);
  const [profileStepComplete, setProfileStepComplete] = useState(() => {
    const savedProfile = loadProfile();
    return savedProfile.connected || savedProfile.guest;
  });
  const [activeTab, setActiveTab] = useState("daily");
  const [feedbackDraft, setFeedbackDraft] = useState(EMPTY_FEEDBACK_DRAFT);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [responseType, setResponseType] = useState("conversation");
  const [messages, setMessages] = useState(() => buildInitialMessages("ok"));
  const [askHistory, setAskHistory] = useState(loadAskHistory);
  const [recommendations, setRecommendations] = useState(loadRecommendations);
  const [profile, setProfile] = useState(loadProfile);
  const [profileDraft, setProfileDraft] = useState(() => loadProfile());
  const [isTyping, setIsTyping] = useState(false);
  const [chatError, setChatError] = useState("");
  const [lastFailedPrompt, setLastFailedPrompt] = useState("");
  const [savedClasses, setSavedClasses] = useState(loadSavedClasses);
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [selectedHomeworkClassIds, setSelectedHomeworkClassIds] = useState([]);
  const [customClassDraft, setCustomClassDraft] = useState("");
  const [customClassNames, setCustomClassNames] = useState([]);
  const [homeworkItems, setHomeworkItems] = useState(loadSavedHomework);
  const [homeworkDraft, setHomeworkDraft] = useState(EMPTY_HOMEWORK_DRAFT);
  const [dailyLogDraft, setDailyLogDraft] = useState(loadDailyLog);
  const [dailyLogs, setDailyLogs] = useState(loadDailyLogs);
  const [dailyLogSubmitted, setDailyLogSubmitted] = useState(false);
  const [classDraft, setClassDraft] = useState("");
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);
  const [timeMode, setTimeMode] = useState(() => getTimeOfDayMode());
  const previousThemeRef = useRef("default");
  const askSessionIdRef = useRef(makeId("ask-session"));

  const todayLabel = useMemo(() => formatDate(), []);
  const moodInfo = MOOD_DETAILS[moodSelection] || MOOD_DETAILS.unchecked;
  const themeName = getMoodTheme(moodSelection);
  const recentAskHistory = useMemo(() => getRecentAskHistory(askHistory), [askHistory]);
  const archivedAskHistory = useMemo(() => getArchivedAskHistory(askHistory), [askHistory]);
  const dashboardReady = profileStepComplete && savedClasses.length > 0;

  function refreshRecommendations(existingRecommendations = recommendations) {
    if (!dashboardReady) {
      return;
    }

    const nextRecommendations = mergeRecommendations(
      runRecommendationAgentPass({
        savedClasses,
        homeworkItems,
        moodSelection: moodSelection || "ok",
        askHistory: recentAskHistory,
        dailyLogs,
        timeMode,
        scenarioLog: loadScenarioAgentLog(),
      }),
      existingRecommendations,
    );

    setRecommendations(nextRecommendations);
    saveRecommendations(nextRecommendations);
  }

  function persistAskConversation(nextMessages = messages) {
    if (nextMessages.filter((message) => message.role === "user").length === 0) {
      return;
    }

    const now = new Date().toISOString();
    const historyEntry = {
      id: askSessionIdRef.current,
      title: getConversationTitle(nextMessages),
      createdAt: nextMessages[0]?.createdAt || now,
      updatedAt: now,
      messages: nextMessages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        source: message.source || "",
        model: message.model || "",
        createdAt: message.createdAt || now,
      })),
    };

    setAskHistory((currentHistory) => {
      const nextHistory = [
        historyEntry,
        ...currentHistory.filter((entry) => entry.id !== historyEntry.id),
      ].slice(0, ASK_HISTORY_LIMIT);

      saveAskHistory(nextHistory);
      return nextHistory;
    });
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setIntroComplete(true);
    }, INTRO_SCREEN_DURATION_MS);

    return () => window.clearTimeout(timerId);
  }, []);

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
    writePersistentObject(PROFILE_STORAGE_KEY, profile);
  }, [profile]);

  useEffect(() => {
    refreshRecommendations(recommendations);
  }, [
    dashboardReady,
    savedClasses,
    homeworkItems,
    askHistory,
    dailyLogs,
    moodSelection,
    timeMode,
  ]);

  useEffect(() => {
    persistAskConversation(messages);
  }, [messages]);

  useEffect(() => {
    function handleBeforeUnload() {
      if (messages.filter((message) => message.role === "user").length === 0) {
        return;
      }

      const now = new Date().toISOString();
      const historyEntry = {
        id: askSessionIdRef.current,
        title: getConversationTitle(messages),
        createdAt: messages[0]?.createdAt || now,
        updatedAt: now,
        messages,
      };
      const nextHistory = [
        historyEntry,
        ...askHistory.filter((entry) => entry.id !== historyEntry.id),
      ].slice(0, ASK_HISTORY_LIMIT);

      saveAskHistory(nextHistory);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [messages, askHistory]);

  useEffect(() => {
    if (!homeworkDraft.classId && savedClasses[0]) {
      setHomeworkDraft((currentDraft) => ({
        ...currentDraft,
        classId: savedClasses[0].id,
      }));
    }

    setSelectedHomeworkClassIds((currentIds) =>
      currentIds.filter((classId) =>
        savedClasses.some((schoolClass) => schoolClass.id === classId),
      ),
    );
  }, [savedClasses, homeworkDraft.classId]);

  useEffect(() => {
    if (!dashboardReady) {
      return undefined;
    }

    function runSilentScenarioAgent() {
      const previousLog = loadScenarioAgentLog();
      const nextEntry = runScenarioAgentPass({
        mood: moodSelection || "ok",
        moodNote,
        timeMode,
        previousLog,
      });

      saveScenarioAgentLog([nextEntry, ...previousLog]);
    }

    runSilentScenarioAgent();
    const intervalId = window.setInterval(
      runSilentScenarioAgent,
      SCENARIO_AGENT_INTERVAL_MS,
    );

    return () => window.clearInterval(intervalId);
  }, [dashboardReady, moodSelection, moodNote, timeMode]);

  function handleClassToggle(classId) {
    setSelectedClassIds((currentIds) =>
      currentIds.includes(classId)
        ? currentIds.filter((item) => item !== classId)
        : [...currentIds, classId],
    );
  }

  function handleMoodSelect(choice) {
    setMoodSelection(choice);
    setMoodCheckInComplete(true);
    askSessionIdRef.current = makeId("ask-session");
    setMessages(buildInitialMessages(choice));
  }

  function handleProfileDraftChange(field, value) {
    setProfileDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
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
      createdAt: profile.createdAt || now,
      updatedAt: now,
    };

    setProfile(nextProfile);
    setProfileDraft(nextProfile);
    setProfileStepComplete(true);
  }

  function handleForgotPassword() {
    window.alert("Password reset needs real Google/OAuth setup. For now, continue as guest or sign up locally on this device.");
  }

  function handleContinueAsGuest() {
    const now = new Date().toISOString();
    const nextProfile = {
      ...EMPTY_PROFILE,
      connected: false,
      guest: true,
      name: "Guest",
      authMode: "guest",
      createdAt: profile.createdAt || now,
      updatedAt: now,
    };

    setProfile(nextProfile);
    setProfileDraft(nextProfile);
    setProfileStepComplete(true);
  }

  function handleDisconnectProfile() {
    setProfile(EMPTY_PROFILE);
    setProfileDraft(EMPTY_PROFILE);
    setProfileStepComplete(false);
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
    setHomeworkDraft((currentDraft) => ({
      ...currentDraft,
      classId: classesToSave[0]?.id || "",
    }));
    setSelectedHomeworkClassIds(classesToSave[0] ? [classesToSave[0].id] : []);
    setCustomClassDraft("");
    setCustomClassNames([]);
  }

  function handleHomeworkClassToggle(classId) {
    setSelectedHomeworkClassIds((currentIds) => {
      const isSelected = currentIds.includes(classId);
      const nextIds = isSelected
        ? currentIds.filter((item) => item !== classId)
        : [...currentIds, classId];
      const nextClassId = nextIds[0] || "";

      setHomeworkDraft((currentDraft) => ({
        ...currentDraft,
        classId: isSelected && currentDraft.classId === classId
          ? nextClassId
          : classId,
      }));

      return nextIds;
    });
  }

  function handleHomeworkDraftChange(field, value) {
    setHomeworkDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  }

  function handleHomeworkSubmit(event) {
    event?.preventDefault?.();

    const topic = homeworkDraft.topic.trim();
    const title = homeworkDraft.title.trim() || topic;
    const classLabel = getClassLabel(savedClasses, homeworkDraft.classId);

    if (!homeworkDraft.classId || !topic) {
      return;
    }

    const guidance = buildHomeworkGuidance({
      classLabel,
      topic,
      title,
      details: homeworkDraft.details.trim(),
      attachmentName: homeworkDraft.attachmentName,
    });

    setHomeworkItems((currentItems) => [
      {
        id: makeId("homework"),
        classId: homeworkDraft.classId,
        classLabel,
        title,
        topic,
        details: homeworkDraft.details.trim(),
        notes: homeworkDraft.details.trim(),
        scheduledFor: homeworkDraft.scheduledFor,
        customSchedule: homeworkDraft.customSchedule.trim(),
        attachmentName: homeworkDraft.attachmentName,
        attachmentType: homeworkDraft.attachmentType,
        attachmentPreview: homeworkDraft.attachmentPreview,
        guidance,
        completed: false,
        createdAt: new Date().toISOString(),
      },
      ...currentItems,
    ]);
    setHomeworkDraft({
      ...EMPTY_HOMEWORK_DRAFT,
      classId: homeworkDraft.classId,
    });
  }

  function handleHomeworkFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setHomeworkDraft((currentDraft) => ({
        ...currentDraft,
        attachmentName: "",
        attachmentType: "",
        attachmentPreview: "",
      }));
      return;
    }

    const attachmentBase = {
      attachmentName: file.name,
      attachmentType: file.type || "file",
      attachmentPreview: "",
    };

    if (file.type.startsWith("image/") && file.size <= 500000) {
      const reader = new FileReader();
      reader.onload = () => {
        setHomeworkDraft((currentDraft) => ({
          ...currentDraft,
          ...attachmentBase,
          attachmentPreview: String(reader.result || ""),
        }));
      };
      reader.readAsDataURL(file);
      return;
    }

    setHomeworkDraft((currentDraft) => ({
      ...currentDraft,
      ...attachmentBase,
    }));
  }

  function handleHomeworkCompleteToggle(homeworkId) {
    setHomeworkItems((currentItems) =>
      currentItems.map((item) =>
        item.id === homeworkId
          ? { ...item, completed: !item.completed }
          : item,
      ),
    );
  }

  function handleHomeworkDelete(homeworkId) {
    setHomeworkItems((currentItems) =>
      currentItems.filter((item) => item.id !== homeworkId),
    );
  }

  function handleClassAdd(event) {
    event?.preventDefault?.();

    const label = normalizeClassName(classDraft);

    if (!label) {
      return;
    }

    setSavedClasses((currentClasses) =>
      dedupeClasses([...currentClasses, createClass(label)]),
    );
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
    setSelectedHomeworkClassIds((currentIds) =>
      currentIds.filter((item) => item !== classId),
    );
    setHomeworkDraft((currentDraft) =>
      currentDraft.classId === classId
        ? { ...currentDraft, classId: "" }
        : currentDraft,
    );
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
        setMessages((latestMessages) => [
          ...latestMessages,
          {
            id: makeId("assistant"),
            role: "assistant",
            content: buildCoachReply(trimmed, context),
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

  function handleRecommendationAction(targetTab) {
    setActiveTab(targetTab || "daily");
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

  function handleClearAskHistory() {
    if (!window.confirm("Clear archived Ask VIRELI chats? Recent chats will stay in Ask VIRELI.")) {
      return;
    }

    const nextHistory = getRecentAskHistory(askHistory);
    setAskHistory(nextHistory);
    saveAskHistory(nextHistory);
  }

  function handleClearDailyLogs() {
    if (!window.confirm("Clear saved Daily Logs?")) {
      return;
    }

    setDailyLogs([]);
    writePersistentArray(DAILY_LOG_STORAGE_KEY, []);
    setDailyLogDraft(loadDailyLog());
  }

  function handleClearRecommendations() {
    if (!window.confirm("Clear saved recommendations?")) {
      return;
    }

    setRecommendations([]);
    saveRecommendations([]);
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
          ? html`<${IntroScreen} key="intro" />`
          : !moodCheckInComplete
            ? html`
                <${MoodCheckInScreen}
                  key="mood"
                  moodSelection=${moodSelection}
                  onMoodSelect=${handleMoodSelect}
                />
              `
          : !profileStepComplete
            ? html`
                <${AccountScreen}
                  key="account"
                  profile=${profile}
                  profileDraft=${profileDraft}
                  onProfileDraftChange=${handleProfileDraftChange}
                  onAccountSubmit=${handleAccountSubmit}
                  onForgotPassword=${handleForgotPassword}
                  onContinueAsGuest=${handleContinueAsGuest}
                />
              `
          : savedClasses.length === 0
            ? html`
                <${ClassSetupScreen}
                  key="class-setup"
                  selectedClassIds=${selectedClassIds}
                  customClassDraft=${customClassDraft}
                  customClassNames=${customClassNames}
                  onClassToggle=${handleClassToggle}
                  onCustomClassDraftChange=${setCustomClassDraft}
                  onCustomClassAdd=${handleCustomClassAdd}
                  onCustomClassRemove=${handleCustomClassRemove}
                  onSaveClasses=${handleSaveSelectedClasses}
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
                  responseType=${responseType}
                  messages=${messages}
                  recentAskHistory=${recentAskHistory}
                  archivedAskHistory=${archivedAskHistory}
                  recommendations=${recommendations}
                  profile=${profile}
                  profileDraft=${profileDraft}
                  isTyping=${isTyping}
                  chatError=${chatError}
                  savedClasses=${savedClasses}
                  selectedHomeworkClassIds=${selectedHomeworkClassIds}
                  homeworkItems=${homeworkItems}
                  homeworkDraft=${homeworkDraft}
                  dailyLogs=${dailyLogs}
                  classDraft=${classDraft}
                  onTabChange=${setActiveTab}
                  onRecommendationAction=${handleRecommendationAction}
                  onHomeworkClassToggle=${handleHomeworkClassToggle}
                  onHomeworkDraftChange=${handleHomeworkDraftChange}
                  onHomeworkFileChange=${handleHomeworkFileChange}
                  onHomeworkSubmit=${handleHomeworkSubmit}
                  onHomeworkCompleteToggle=${handleHomeworkCompleteToggle}
                  onHomeworkDelete=${handleHomeworkDelete}
                  onClassDraftChange=${setClassDraft}
                  onClassAdd=${handleClassAdd}
                  onClassUpdate=${handleClassUpdate}
                  onClassRemove=${handleClassRemove}
                  onProfileDraftChange=${handleProfileDraftChange}
                  onAccountSubmit=${handleAccountSubmit}
                  onDisconnectProfile=${handleDisconnectProfile}
                  onLoadAskHistory=${handleLoadAskHistory}
                  onChatDraftChange=${setChatDraft}
                  onResponseTypeChange=${setResponseType}
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
                  onDailyLogSubmit=${handleDailyLogSubmit}
                  onClearAskHistory=${handleClearAskHistory}
                  onClearDailyLogs=${handleClearDailyLogs}
                  onClearRecommendations=${handleClearRecommendations}
                  onResetSubjects=${handleResetSubjects}
                />
              `}
      </${AnimatePresence}>
    </div>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);

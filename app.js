/**
 * Thingyan Love System — application logic
 */

const CONFIG = {
  QUIZ_POINTS_CORRECT: 15,
  QUIZ_POINTS_WRONG: 6,
  PREFIX: "tls_",
  /**
   * Voice Note + Video: put an MP4 path (same folder as the site) or a full https URL.
   * Example: "videos/kalaylay.mp4" — leave empty to show the placeholder box instead.
   */
  VOICE_VIDEO_URL: "",
  /** Optional poster image URL/path for the video (shown before play). */
  VOICE_VIDEO_POSTER_URL: "",
};

/** Same prize for every mystery box (Secret Surprise). */
const SURPRISE_PRIZE_TEXT =
  "Congratulation: You get 1.5L Kyats as Thingyan Pocket Money.";

const WISH_MISSION_ID = "m01";

function key(name) {
  return CONFIG.PREFIX + name;
}

const KEYS = {
  points: key("points"),
  quizIndex: key("quizIndex"),
  missionsCompleted: key("missionsCompleted"),
  claimedRewards: key("claimedRewards"),
  freeAnswer: key("freeAnswer"),
  completedMissionIds: key("completedMissionIds"),
  currentMission: key("currentMission"),
  surpriseRevealStyle: key("surpriseRevealStyle"),
};

const QUIZ = [
  {
    q: "Which connection is strongest in our love stack?",
    options: ["Wi-Fi", "Bluetooth", "Our heart connection 💛", "USB cable"],
    correct: 2,
  },
  {
    q: "Which flower is famous in Myanmar Thingyan?",
    options: ["Rose", "Padauk (Yellow) 🌼", "Tulip", "Sunflower"],
    correct: 1,
  },
  {
    q: "If our love is a program, what should it have?",
    options: ["Infinite loop of hugs", "Memory leaks of trust", "Syntax errors in kindness", "Bugs in loyalty"],
    correct: 0,
  },
  {
    q: "What is the best Thingyan deployment strategy for us?",
    options: ["Rollback", "Cold start", "Continuous delivery of love", "Silent fail"],
    correct: 2,
  },
  {
    q: "Your smile in festival light is like…",
    options: ["404 not found", "A cached happy response", "WEB not avaliable", "Waiting for network"],
    correct: 1,
  },
  {
    q: "Ping test: I choose you with what uptime?",
    options: ["99%", "99.9%", "100% forever 💙", "Only on weekends"],
    correct: 2,
  },
];

/** Missions sum = 176; with quiz max 6×15=90 → 266 max; gift costs sum = 200. */
const MYSTERY_MISSIONS = [
  {
    id: WISH_MISSION_ID,
    text: "Write your free Thingyan message in the box—whatever you want to tell me—then tap Mission complete. 💛",
    points: 35,
  },
  { id: "m02", text: "Please, Tell one favorite memory of us", points: 16 },
  { id: "m03", text: "Send one yellow Padauk-color photo for bonus vibes", points: 16 },
  { id: "m04", text: "Record a short voice note: “Happy Thingyan Par Ko Ko Yay” ", points: 18 },
  { id: "m05", text: "Say one reason KaLayLay still choose Ko Ko", points: 15 },
  { id: "m06", text: "Draw a tiny Padauk flower and send a photo", points: 18 },
  { id: "m07", text: "Text: our love runs better than any connection response", points: 14 },
  { id: "m08", text: "Send a selfie with something sky-blue or sun-yellow", points: 14 },
  { id: "m09", text: "Name one song that reminds KaLayLay of our love", points: 14 },
  { id: "m10", text: "Plan our next mini-date in one voice message", points: 16 },
];

/** Total gift cost 200 — easy to redeem everything with quiz + missions. */
const REWARDS = [
  {
    id: "cute_text",
    name: "Cute Text Message",
    cost: 25,
    unlock:
      "For my KaLayLay 💛 I’ll always be here for you. This cute letter is my promise: through every Thingyan splash and every quiet day, KaLayLay has got me. Soft words, big heart, only KaLayLay.",
  },
  {
    id: "voice_note",
    name: "Voice Note + Video",
    cost: 40,
    unlock:
      "For KaLayLay 🎬 — get one personal voice note and one little video from me: silly, sweet, and like a mini episode made only for my KaLayLay. 💙",
  },
  {
    id: "love_letter",
    name: "Love Letter",
    cost: 50,
    unlock:
      "For my KaLayLay ✉️  Only one person who is essential to my life. This love letter comes from my heart: every line says how much you matter, how my world is brighter with KaLayLay in it, and how Ko Ko always choose KaLayLay again and again.",
  },
  {
    id: "surprise",
    name: "Secret Surprise",
    cost: 85,
    unlock: SURPRISE_PRIZE_TEXT,
    isMysteryPick: true,
  },
];

let lastRedeemedId = null;
var surpriseRedeemPending = false;
/** Which box style was tapped before Collect (cute | love | party). */
var pendingSurpriseVariant = "party";

let state = {
  points: 0,
  quizIndex: 0,
  missionsCompleted: 0,
  claimedRewards: [],
  freeAnswer: "",
  completedMissionIds: [],
  currentMission: null,
  surpriseRevealStyle: "party",
};

function sanitizeClaimedRewards(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter(function (id) {
    return id !== "wallpaper" && REWARDS.some(function (r) {
      return r.id === id;
    });
  });
}

function loadState() {
  try {
    state.points = parseInt(localStorage.getItem(KEYS.points), 10);
    if (isNaN(state.points)) state.points = 0;
    state.quizIndex = parseInt(localStorage.getItem(KEYS.quizIndex), 10);
    if (isNaN(state.quizIndex)) state.quizIndex = 0;
    state.missionsCompleted = parseInt(localStorage.getItem(KEYS.missionsCompleted), 10);
    if (isNaN(state.missionsCompleted)) state.missionsCompleted = 0;
    const cr = localStorage.getItem(KEYS.claimedRewards);
    var rawClaimed = cr ? JSON.parse(cr) : [];
    state.claimedRewards = sanitizeClaimedRewards(rawClaimed);
    if (JSON.stringify(state.claimedRewards) !== JSON.stringify(rawClaimed)) {
      localStorage.setItem(KEYS.claimedRewards, JSON.stringify(state.claimedRewards));
    }
    state.freeAnswer = localStorage.getItem(KEYS.freeAnswer) || "";
    var cmi = localStorage.getItem(KEYS.completedMissionIds);
    state.completedMissionIds = cmi ? JSON.parse(cmi) : [];
    if (!Array.isArray(state.completedMissionIds)) state.completedMissionIds = [];
    const cm = localStorage.getItem(KEYS.currentMission);
    if (cm && cm.trim()) {
      try {
        state.currentMission = JSON.parse(cm);
      } catch (e) {
        state.currentMission = null;
      }
    } else {
      state.currentMission = null;
    }
    var srs = localStorage.getItem(KEYS.surpriseRevealStyle);
    if (srs === "cute" || srs === "love" || srs === "party") {
      state.surpriseRevealStyle = srs;
    } else {
      state.surpriseRevealStyle = "party";
    }
  } catch (e) {
    console.error(e);
  }
}

function saveState() {
  localStorage.setItem(KEYS.points, String(state.points));
  localStorage.setItem(KEYS.quizIndex, String(state.quizIndex));
  localStorage.setItem(KEYS.missionsCompleted, String(state.missionsCompleted));
  localStorage.setItem(KEYS.claimedRewards, JSON.stringify(state.claimedRewards));
  localStorage.setItem(KEYS.freeAnswer, state.freeAnswer);
  localStorage.setItem(KEYS.completedMissionIds, JSON.stringify(state.completedMissionIds));
  localStorage.setItem(KEYS.currentMission, state.currentMission ? JSON.stringify(state.currentMission) : "");
  localStorage.setItem(KEYS.surpriseRevealStyle, state.surpriseRevealStyle);
}

function addPoints(delta) {
  state.points = Math.max(0, state.points + delta);
  saveState();
  renderAll();
}

function setSystemMessage(text) {
  document.getElementById("systemMessage").textContent = text;
}

function renderStageVisibility() {
  const quizDone = state.quizIndex >= QUIZ.length;
  const stageMissions = document.getElementById("stageMissions");
  const stageShop = document.getElementById("stageShop");
  const hint = document.getElementById("stageFlowHint");

  [stageMissions, stageShop].forEach(function (el) {
    if (!el) return;
    el.classList.toggle("hidden", !quizDone);
  });

  if (hint) {
    hint.textContent = quizDone
      ? "Missions and the reward shop are open—right quiz answers earn extra points. 💛"
      : "Step 1 — Love Quiz (right answers = more points), then missions and the shop.";
  }
}

function renderDashboard() {
  const el = document.getElementById("displayPoints");
  if (el) el.textContent = state.points;
}

function renderQuiz() {
  const qEl = document.getElementById("quizQuestion");
  const optEl = document.getElementById("quizOptions");
  const progEl = document.getElementById("quizProgress");
  optEl.innerHTML = "";

  if (state.quizIndex >= QUIZ.length) {
    qEl.textContent = "Quiz module complete. Your love logic passed all checks. 💛";
    progEl.textContent = "All " + QUIZ.length + " questions cleared.";
    return;
  }

  const q = QUIZ[state.quizIndex];
  qEl.textContent = q.q;
  progEl.textContent =
    "Question " +
    (state.quizIndex + 1) +
    " / " +
    QUIZ.length +
    " · +" +
    CONFIG.QUIZ_POINTS_CORRECT +
    " if right, +" +
    CONFIG.QUIZ_POINTS_WRONG +
    " if not";

  q.options.forEach(function (opt, i) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn";
    b.textContent = opt;
    b.addEventListener("click", function () {
      handleQuizAnswer(i);
    });
    optEl.appendChild(b);
  });
}

function handleQuizAnswer(choice) {
  if (state.quizIndex >= QUIZ.length) return;
  const q = QUIZ[state.quizIndex];
  const correct = choice === q.correct;
  const pts = correct ? CONFIG.QUIZ_POINTS_CORRECT : CONFIG.QUIZ_POINTS_WRONG;
  state.points = Math.max(0, state.points + pts);
  state.quizIndex += 1;
  saveState();
  setSystemMessage(
    state.quizIndex >= QUIZ.length
      ? "Quiz done! Missions and the shop are yours. 💛"
      : correct
        ? "Yes! +" + pts + " love points — KaLayLay energy. 💛"
        : "Almost — still +" + pts + " points for playing. 💙"
  );
  renderQuiz();
  renderStageVisibility();
  renderDashboard();
}

function renderMission() {
  const box = document.getElementById("missionBox");
  const row = document.getElementById("missionCompleteRow");
  const genBtn = document.getElementById("genMission");
  var left = getMissionsNotCompleted();
  var drawable = getDrawableMissions();

  if (genBtn) {
    var noneLeft = left.length === 0;
    var cannotDraw = drawable.length === 0;
    genBtn.disabled = noneLeft || cannotDraw;
    genBtn.textContent = noneLeft ? "All missions done ✓" : "New mission card";
  }

  if (!state.currentMission) {
    box.className = "mission-card empty";
    if (left.length === 0) {
      box.textContent =
        "Every festival mission is complete—including free message. KaLayLay did all of them. 💛";
    } else {
      box.textContent =
        "No card yet. Tap “New mission card” for a random mission KaLayLay hasn’t finished.";
    }
    row.classList.add("hidden");
    return;
  }

  box.className = "mission-card";

  if (state.currentMission.id === WISH_MISSION_ID) {
    box.innerHTML =
      "<p class=\"mission-wish-intro\"><strong>Mission:</strong> " +
      escapeHtml(state.currentMission.text) +
      "</p>" +
      "<label class=\"prompt\" for=\"freeAnswer\">Your message</label>" +
      '<textarea id="freeAnswer"></textarea>' +
      '<p class="muted small-print">Write anything, just free messages or words and Mission complete. 💛</p>';
    var ta = document.getElementById("freeAnswer");
    if (ta) {
      ta.value = state.freeAnswer;
      ta.addEventListener("input", function () {
        state.freeAnswer = this.value;
        saveState();
        updateWishCompleteBtn();
      });
    }
    row.classList.remove("hidden");
    updateWishCompleteBtn();
    return;
  }

  box.innerHTML =
    "<strong>Mission:</strong> " +
    escapeHtml(state.currentMission.text) +
    "<br><span class=\"mission-pts\">Reward: +" +
    state.currentMission.points +
    " pts (one-time)</span>";
  row.classList.remove("hidden");
  var c2 = document.getElementById("completeMission");
  if (c2) c2.disabled = false;
}

function updateWishCompleteBtn() {
  var completeBtn = document.getElementById("completeMission");
  if (completeBtn) {
    completeBtn.disabled = state.freeAnswer.trim().length === 0;
  }
}

function getMissionsNotCompleted() {
  return MYSTERY_MISSIONS.filter(function (m) {
    return state.completedMissionIds.indexOf(m.id) === -1;
  });
}

function getDrawableMissions() {
  return getMissionsNotCompleted().filter(function (m) {
    return !state.currentMission || m.id !== state.currentMission.id;
  });
}

function resolveMissionId(missionObj) {
  if (!missionObj) return null;
  if (missionObj.id) return missionObj.id;
  var found = MYSTERY_MISSIONS.find(function (x) {
    return x.text === missionObj.text;
  });
  return found ? found.id : null;
}

function renderRewards() {
  const shop = document.getElementById("rewardShop");
  shop.innerHTML = "";
  REWARDS.forEach(function (r) {
    const claimed = state.claimedRewards.indexOf(r.id) !== -1;
    const can = !claimed && state.points >= r.cost && !surpriseRedeemPending;
    const div = document.createElement("div");
    div.className = "reward-card" + (claimed ? " claimed" : "");
    div.innerHTML =
      '<div class="reward-info"><div class="name">' +
      r.name +
      '</div><div class="meta">' +
      r.cost +
      " pts · " +
      (claimed ? "Claimed ✓" : state.points >= r.cost ? "Available" : "Need more pts") +
      "</div></div>";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-primary";
    btn.textContent = claimed ? "Redeemed" : r.isMysteryPick ? "Pick a box 🎁" : "Redeem";
    btn.disabled = claimed || !can;
    btn.addEventListener("click", function () {
      if (r.isMysteryPick) {
        openMysteryOverlay(r.id);
      } else {
        redeemReward(r.id);
      }
    });
    div.appendChild(btn);
    shop.appendChild(div);
  });
  renderRewardVault();
}

function surprisePrizeRevealHtml(variant) {
  var v =
    variant === "cute" || variant === "love" || variant === "party" ? variant : "party";
  var emoji = v === "cute" ? "💕" : v === "love" ? "💙" : "🎉";
  var label = v === "cute" ? "Cute" : v === "love" ? "Love" : "Celebration";
  return (
    '<div class="surprise-reveal-one surprise-reveal-one--' +
    v +
    '">' +
    '<span class="surprise-reveal-one__tag">' +
    emoji +
    " " +
    escapeHtml(label) +
    "</span>" +
    '<p class="surprise-reveal-one__prize">' +
    escapeHtml(SURPRISE_PRIZE_TEXT) +
    "</p>" +
    "</div>"
  );
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

/** Video player or placeholder under Voice Note + Video when claimed. */
function voiceVideoBlockHtml() {
  var url = (CONFIG.VOICE_VIDEO_URL || "").trim();
  var poster = (CONFIG.VOICE_VIDEO_POSTER_URL || "").trim();
  if (url) {
    var posterAttr = poster ? ' poster="' + escapeAttr(poster) + '"' : "";
    return (
      '<div class="reward-video-wrap">' +
      '<p class="reward-video-label">Your video for KaLayLay 🎬</p>' +
      '<video class="reward-video" controls playsinline preload="metadata"' +
      ' src="' +
      escapeAttr(url) +
      '"' +
      posterAttr +
      ">Video not supported in this browser.</video>" +
      "</div>"
    );
  }
  return (
    '<div class="reward-video-placeholder">' +
    "<strong>Video for KaLayLay</strong>" +
    "<p>Put an MP4 in your project folder and set <strong>VOICE_VIDEO_URL</strong> at the top of <strong>app.js</strong> (for example <code>videos/note.mp4</code> or a full <code>https://…</code> link), then refresh. Optional: <strong>VOICE_VIDEO_POSTER_URL</strong> for a thumbnail.</p>" +
    "</div>"
  );
}

function renderRewardVault() {
  const flash = document.getElementById("rewardVaultFlash");
  const list = document.getElementById("rewardVaultList");
  if (!flash || !list) return;

  const claimed = state.claimedRewards
    .map(function (id) {
      return REWARDS.find(function (x) {
        return x.id === id;
      });
    })
    .filter(Boolean);

  if (lastRedeemedId) {
    const just = REWARDS.find(function (x) {
      return x.id === lastRedeemedId;
    });
    if (just && state.claimedRewards.indexOf(lastRedeemedId) !== -1) {
      flash.classList.remove("hidden");
      if (just.id === "surprise") {
        flash.innerHTML =
          "<strong>✨ Just unlocked: " +
          escapeHtml(just.name) +
          "</strong>" +
          surprisePrizeRevealHtml(state.surpriseRevealStyle);
      } else if (just.id === "voice_note") {
        flash.innerHTML =
          "<strong>✨ Just unlocked: " +
          escapeHtml(just.name) +
          "</strong><p>" +
          escapeHtml(just.unlock) +
          "</p>" +
          voiceVideoBlockHtml();
      } else {
        flash.innerHTML =
          "<strong>✨ Just unlocked: " +
          escapeHtml(just.name) +
          "</strong><p>" +
          escapeHtml(just.unlock) +
          "</p>";
      }
    } else {
      flash.classList.add("hidden");
      flash.innerHTML = "";
    }
  } else {
    flash.classList.add("hidden");
    flash.innerHTML = "";
  }

  if (claimed.length === 0) {
    list.innerHTML = "";
    return;
  }

  list.innerHTML = claimed
    .map(function (r) {
      const isNew = r.id === lastRedeemedId;
      var body;
      if (r.id === "surprise") {
        body = surprisePrizeRevealHtml(state.surpriseRevealStyle);
      } else if (r.id === "voice_note") {
        body =
          "<div class=\"output\">" + escapeHtml(r.unlock) + "</div>" + voiceVideoBlockHtml();
      } else {
        body = "<div class=\"output\">" + escapeHtml(r.unlock) + "</div>";
      }
      return (
        '<div class="reward-output-card' +
        (isNew ? " is-new" : "") +
        '"><div class="name">' +
        escapeHtml(r.name) +
        "</div>" +
        body +
        "</div>"
      );
    })
    .join("");
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function redeemReward(rid) {
  const r = REWARDS.find(function (x) {
    return x.id === rid;
  });
  if (!r || r.isMysteryPick) return;
  if (state.claimedRewards.indexOf(rid) !== -1) return;
  if (state.points < r.cost) {
    setSystemMessage("Not enough love points yet—finish more missions. 💛");
    return;
  }
  state.points -= r.cost;
  state.claimedRewards.push(rid);
  lastRedeemedId = rid;
  saveState();
  setSystemMessage("Reward unlocked: " + r.name + ". 💛");
  renderAll();
  const vault = document.getElementById("rewardVault");
  if (vault) vault.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function finalizeSurpriseRedeem() {
  const rid = "surprise";
  const r = REWARDS.find(function (x) {
    return x.id === rid;
  });
  if (!r || state.claimedRewards.indexOf(rid) !== -1) {
    closeMysteryOverlay();
    return;
  }
  if (state.points < r.cost) {
    setSystemMessage("Not enough points.");
    closeMysteryOverlay();
    return;
  }
  state.points -= r.cost;
  state.claimedRewards.push(rid);
  lastRedeemedId = rid;
  state.surpriseRevealStyle = pendingSurpriseVariant;
  surpriseRedeemPending = false;
  saveState();
  setSystemMessage("Secret Surprise claimed for KaLayLay! 🎉");
  closeMysteryOverlay();
  renderAll();
  const vault = document.getElementById("rewardVault");
  if (vault) vault.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function openMysteryOverlay(rid) {
  if (rid !== "surprise") return;
  const r = REWARDS.find(function (x) {
    return x.id === rid;
  });
  if (!r || state.claimedRewards.indexOf(rid) !== -1) return;
  if (state.points < r.cost) return;

  const overlay = document.getElementById("mysteryOverlay");
  const stage = document.getElementById("mysteryStage");
  const result = document.getElementById("mysteryResult");
  if (!overlay || !stage || !result) return;

  surpriseRedeemPending = true;
  pendingSurpriseVariant = "party";

  stage.classList.remove("hidden");
  result.classList.add("hidden");
  result.innerHTML = "";
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");

  var boxes = overlay.querySelectorAll(".mystery-box");
  boxes.forEach(function (btn) {
    btn.disabled = false;
    btn.classList.remove("mystery-box--picked");
  });

  renderRewards();
}

function closeMysteryOverlay() {
  const overlay = document.getElementById("mysteryOverlay");
  if (overlay) {
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
  }
  surpriseRedeemPending = false;
  renderRewards();
}

function onMysteryBoxClick(e) {
  const overlay = document.getElementById("mysteryOverlay");
  const stage = document.getElementById("mysteryStage");
  const result = document.getElementById("mysteryResult");
  if (!overlay || !stage || !result) return;
  if (!result.classList.contains("hidden")) return;

  var raw = e.currentTarget.getAttribute("data-variant");
  pendingSurpriseVariant =
    raw === "cute" || raw === "love" || raw === "party" ? raw : "party";

  var boxes = overlay.querySelectorAll(".mystery-box");
  boxes.forEach(function (btn) {
    btn.disabled = true;
    btn.classList.add("mystery-box--picked");
  });

  stage.classList.add("hidden");
  result.classList.remove("hidden");
  result.innerHTML =
    surprisePrizeRevealHtml(pendingSurpriseVariant) +
    '<button type="button" class="btn btn-primary mystery-collect" id="mysteryCollectBtn">Collect prize ✓</button>';
  document.getElementById("mysteryCollectBtn").addEventListener("click", finalizeSurpriseRedeem);
}

function renderAll() {
  renderStageVisibility();
  renderDashboard();
  renderQuiz();
  renderMission();
  renderRewards();
}

function generateMission() {
  var left = getMissionsNotCompleted();
  if (left.length === 0) {
    state.currentMission = null;
    saveState();
    setSystemMessage("No missions left — KaLayLay finished everything. 💛");
    renderMission();
    return;
  }
  var drawable = getDrawableMissions();
  if (drawable.length === 0) {
    setSystemMessage("Finish the mission on screen first, then draw another. 💛");
    return;
  }
  var pick = drawable[Math.floor(Math.random() * drawable.length)];
  state.currentMission = {
    id: pick.id,
    text: pick.text,
    points: pick.points,
  };
  saveState();
  setSystemMessage("Mission on screen—finish it once, then draw another. 💙");
  renderAll();
}

function completeMission() {
  if (!state.currentMission) return;
  var mid = resolveMissionId(state.currentMission);
  var pts = state.currentMission.points;

  if (mid === WISH_MISSION_ID) {
    var ta = document.getElementById("freeAnswer");
    state.freeAnswer = ((ta && ta.value) || state.freeAnswer || "").trim();
    if (!state.freeAnswer) {
      setSystemMessage("Write KaLayLay's message before completing this mission. 💛");
      return;
    }
  }

  if (mid && state.completedMissionIds.indexOf(mid) === -1) {
    state.completedMissionIds.push(mid);
  }
  state.missionsCompleted += 1;
  state.points = Math.max(0, state.points + pts);
  state.currentMission = null;
  saveState();
  setSystemMessage("+" + pts + " pts—mission saved. Draw another if KaLayLay have any left. 💛");
  renderAll();
}

function resetAll() {
  if (!window.confirm("Erase all Thingyan Love System data on this device?")) return;
  Object.values(KEYS).forEach(function (k) {
    localStorage.removeItem(k);
  });
  [
    "lineShareDone",
    "wishSharedDone",
    "freePending",
    "adminMode",
    "adminLog",
    "showAnswerInAdmin",
    "wishDeliveryReady",
  ].forEach(function (legacy) {
    localStorage.removeItem(CONFIG.PREFIX + legacy);
  });
  state = {
    points: 0,
    quizIndex: 0,
    missionsCompleted: 0,
    claimedRewards: [],
    freeAnswer: "",
    completedMissionIds: [],
    currentMission: null,
    surpriseRevealStyle: "party",
  };
  saveState();
  lastRedeemedId = null;
  surpriseRedeemPending = false;
  closeMysteryOverlay();
  setSystemMessage("Reset complete. Thingyan Love System is fresh. 💛");
  renderAll();
}

function bindEvents() {
  document.getElementById("genMission").addEventListener("click", generateMission);
  document.getElementById("completeMission").addEventListener("click", completeMission);
  document.getElementById("resetAll").addEventListener("click", resetAll);

  var backdrop = document.getElementById("mysteryOverlayBackdrop");
  if (backdrop) backdrop.addEventListener("click", closeMysteryOverlay);
  var cancelBtn = document.getElementById("mysteryCancelBtn");
  if (cancelBtn) cancelBtn.addEventListener("click", closeMysteryOverlay);

  document.querySelectorAll(".mystery-box").forEach(function (btn) {
    btn.addEventListener("click", onMysteryBoxClick);
  });
}

loadState();
bindEvents();
renderAll();

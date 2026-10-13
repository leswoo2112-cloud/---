"use strict";

/* 한국사 퀴즈쇼 — app.js */
(() => {
  const D = window.QUIZ_DATA;
  const app = document.getElementById("app");

  if (!D || !app) {
    throw new Error(
      "questions.js를 먼저 불러와야 합니다."
    );
  }

  /* =====================================
     1. 공통 설정과 저장
  ===================================== */

  const STORAGE_KEY = "hanguksa-quiz-show-v1";
  const POINTS = 100;

  const questionMap = new Map(
    D.questions.map(q => [q.id, q])
  );

  const unitMap = new Map(
    D.units.map(u => [u.id, u])
  );

  const defaults = {
    mode: "solo",
    type: "all",
    count: 10,
    seconds: 30,
    teamCount: 2,
    teamNames: [
      "청룡팀",
      "백호팀",
      "주작팀",
      "현무팀",
      "해치팀",
      "봉황팀"
    ],
    unitIds: D.units.map(u => u.id),
    excludedIds: [],
    projector: false
  };

  let storageFailed = false;
  let saved = {};

  try {
    saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "{}"
    );

    if (
      !saved ||
      typeof saved !== "object" ||
      Array.isArray(saved)
    ) {
      saved = {};
    }
  } catch {
    storageFailed = true;
    saved = {};
  }

  const rawConfig = saved.config || {};

  function allowed(value, values, fallback) {
    return values.includes(value) ? value : fallback;
  }

  function validIds(value, map, fallback) {
    if (!Array.isArray(value)) return [...fallback];

    return [...new Set(value)].filter(
      id => typeof id === "string" && map.has(id)
    );
  }

  const config = {
    mode: allowed(
      rawConfig.mode,
      ["solo", "team"],
      defaults.mode
    ),

    type: allowed(
      rawConfig.type,
      ["all", "choice", "ox"],
      defaults.type
    ),

    count: allowed(
      rawConfig.count,
      [5, 10, 20, 26],
      defaults.count
    ),

    seconds: allowed(
      rawConfig.seconds,
      [0, 20, 30, 60],
      defaults.seconds
    ),

    teamCount: allowed(
      rawConfig.teamCount,
      [2, 3, 4, 5, 6],
      defaults.teamCount
    ),

    teamNames: defaults.teamNames.map((name, i) => {
      const value = rawConfig.teamNames?.[i];

      return typeof value === "string"
        ? value.trim().slice(0, 16) || name
        : name;
    }),

    unitIds: validIds(
      rawConfig.unitIds,
      unitMap,
      defaults.unitIds
    ),

    excludedIds: validIds(
      rawConfig.excludedIds,
      questionMap,
      []
    ),

    projector: rawConfig.projector === true
  };

  let history = Array.isArray(saved.history)
    ? saved.history
        .filter(item =>
          item &&
          typeof item === "object" &&
          Number.isFinite(item.at) &&
          Number.isInteger(item.total) &&
          item.total > 0 &&
          item.total <= D.questions.length &&
          ["solo", "team"].includes(item.mode) &&
          Number.isFinite(item.score) &&
          Number.isInteger(item.correct) &&
          item.correct >= 0 &&
          item.correct <= item.total
        )
        .slice(0, 30)
    : [];

  let screen = "home";
  let game = null;
  let ticker = null;
  let toastTimer = null;
  let resumeAfterHelp = false;

  function save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          config,
          history
        })
      );

      storageFailed = false;
      return true;
    } catch {
      if (!storageFailed) {
        toast(
          "저장이 제한된 브라우저입니다. " +
          "게임은 계속할 수 있지만 기록이 유지되지 않을 수 있어요."
        );
      }

      storageFailed = true;
      return false;
    }
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char])
    );
  }

  const esc = escapeHTML;

  function toast(message) {
    const el = document.getElementById("toast");

    clearTimeout(toastTimer);

    el.textContent = message;
    el.hidden = false;

    toastTimer = setTimeout(() => {
      el.hidden = true;
    }, 3800);
  }

  function focusMain() {
    app.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function option(value, label, current) {
    return `
      <option
        value="${esc(value)}"
        ${value === current ? "selected" : ""}
      >
        ${esc(label)}
      </option>
    `;
  }

  function shuffle(items) {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
  }

  function getPool(includeExcluded = false) {
    const units = new Set(config.unitIds);
    const excluded = new Set(config.excludedIds);

    return D.questions.filter(q =>
      units.has(q.unitId) &&
      (
        config.type === "all" ||
        q.type === config.type
      ) &&
      (
        includeExcluded ||
        !excluded.has(q.id)
      )
    );
  }

  function unitTitle(unitId) {
    return unitMap.get(unitId)?.title || "단원";
  }

  function sourceHTML(q) {
    return q.sourceIds.map(id => {
      const source = D.sources[id];

      if (!source) return "";

      return `
        <a
          class="source-link"
          href="${esc(source.url)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          ${esc(source.organization)}
          · ${esc(source.title)} ↗
        </a>
      `;
    }).join("<br>");
  }

  function applyProjector() {
    document.body.classList.toggle(
      "projector",
      config.projector
    );
  }

  /* =====================================
     2. 시작 화면
  ===================================== */

  function renderHome() {
    stopClock();
    screen = "home";

    const selectedUnits = new Set(config.unitIds);

    app.innerHTML = `
      <section class="hero">
        <span class="eyebrow">
          한국사 2 · 함께 배우는 역사
        </span>

        <h1>한국사 퀴즈쇼</h1>

        <p>역사를 배우고, 함께 도전하다</p>

        <div class="hero-divider"></div>
      </section>

      <div class="layout">
        <section class="panel ornament">
          <div class="panel-title">
            <h2>출제 범위</h2>
            <span class="badge">13개 단원</span>
          </div>

          <div class="row mb">
            <button
              class="btn btn-sm btn-green"
              data-action="select-all"
            >
              전체 선택
            </button>

            <button
              class="btn btn-sm btn-ghost"
              data-action="select-none"
            >
              선택 해제
            </button>

            <span
              id="unitCount"
              class="muted small"
            ></span>
          </div>

          ${D.chapters.map(chapter => {
            const list = D.units.filter(
              u => u.chapterId === chapter.id
            );

            return `
              <details class="chapter" open>
                <summary>
                  ${esc(chapter.number)}.
                  ${esc(chapter.title)}
                </summary>

                <div class="chapter-body">
                  <label class="check-row">
                    <input
                      type="checkbox"
                      data-chapter="${esc(chapter.id)}"
                    >

                    <span>
                      <strong>이 대단원 전체</strong>
                    </span>
                  </label>

                  ${list.map(unit => `
                    <label class="check-row">
                      <input
                        type="checkbox"
                        data-unit="${esc(unit.id)}"
                        ${
                          selectedUnits.has(unit.id)
                            ? "checked"
                            : ""
                        }
                      >

                      <span>
                        ${unit.number}.
                        ${esc(unit.title)}
                      </span>

                      <small>
                        ${
                          D.questions.filter(
                            q => q.unitId === unit.id
                          ).length
                        }문항
                      </small>
                    </label>
                  `).join("")}
                </div>
              </details>
            `;
          }).join("")}

          <div class="notice mt">
            ${esc(D.scopeNote)}
          </div>

          <div class="row mt">
            <button
              class="btn btn-sm"
              data-action="review"
            >
              문제 검토 · 제외
            </button>

            <button
              class="btn btn-sm"
              data-action="history"
            >
              최근 기록
            </button>
          </div>
        </section>

        <aside class="sticky-settings">
          <section class="panel ornament">
            <h2 class="mb">진행 설정</h2>

            <div class="mode-grid mb">
              <button
                class="mode-card"
                data-action="mode"
                data-value="solo"
                aria-pressed="${config.mode === "solo"}"
              >
                <strong>혼자 풀기</strong>
                <small>정답 확인 · 오답 복습</small>
              </button>

              <button
                class="mode-card"
                data-action="mode"
                data-value="team"
                aria-pressed="${config.mode === "team"}"
              >
                <strong>우리 반 팀전</strong>
                <small>한 화면 · 진행자 채점</small>
              </button>
            </div>

            <label class="field">
              <span>문제 유형</span>

              <select id="typeSelect">
                ${option("all", "객관식 + OX", config.type)}
                ${option("choice", "객관식만", config.type)}
                ${option("ox", "OX만", config.type)}
              </select>
            </label>

            <div class="form-grid">
              <label class="field">
                <span>문제 수</span>

                <select id="countSelect">
                  ${[5, 10, 20, 26].map(n =>
                    option(
                      n,
                      n === 26 ? "최대 26문제" : `${n}문제`,
                      config.count
                    )
                  ).join("")}
                </select>
              </label>

              <label class="field">
                <span>문제당 시간</span>

                <select id="secondsSelect">
                  ${[0, 20, 30, 60].map(n =>
                    option(
                      n,
                      n === 0 ? "제한 없음" : `${n}초`,
                      config.seconds
                    )
                  ).join("")}
                </select>
              </label>
            </div>

            <div ${config.mode === "team" ? "" : "hidden"}>
              <label class="field">
                <span>팀 수</span>

                <select id="teamCountSelect">
                  ${[2, 3, 4, 5, 6].map(n =>
                    option(n, `${n}팀`, config.teamCount)
                  ).join("")}
                </select>
              </label>

              <div class="form-grid">
                ${config.teamNames
                  .slice(0, config.teamCount)
                  .map((name, i) => `
                    <label class="field">
                      <span>${i + 1}팀 이름</span>

                      <input
                        class="input"
                        data-team-name="${i}"
                        value="${esc(name)}"
                        maxlength="16"
                        autocomplete="off"
                      >
                    </label>
                  `).join("")}
              </div>

              <div class="notice mb">
                학생들은 말이나 답판으로 답합니다.
                정답 공개 후 진행자가 맞힌 팀을 선택합니다.
                여러 팀에 동시에 점수를 줄 수 있습니다.
              </div>
            </div>

            <label class="check-row mb">
              <input
                id="projectorCheck"
                type="checkbox"
                ${config.projector ? "checked" : ""}
              >

              <span>프로젝터용 큰 글씨</span>
            </label>

            <div class="row between mb">
              <span class="muted">이번 출제</span>

              <span>
                <strong
                  id="actualCount"
                  class="pool-count"
                ></strong>
                문제
              </span>
            </div>

            <p
              id="poolMessage"
              class="small muted"
              role="status"
            ></p>

            <button
              id="startBtn"
              class="btn btn-primary btn-lg btn-wide"
              data-action="start"
            >
              퀴즈 시작
            </button>

            <p class="small muted mt">
              정답당 ${POINTS}점 · 오답 감점 없음<br>
              문제는 중복 없이 무작위 출제됩니다.
            </p>
          </section>

          ${
            storageFailed
              ? `
                <div class="notice mt">
                  현재 브라우저에서 기록 저장이
                  제한될 수 있습니다.
                </div>
              `
              : ""
          }
        </aside>
      </div>
    `;

    updateHomeSummary();
  }

  function updateHomeSummary() {
    if (screen !== "home") return;

    const pool = getPool();
    const actual = Math.min(config.count, pool.length);

    document.getElementById("unitCount").textContent =
      `${config.unitIds.length}개 단원 선택`;

    document.getElementById("actualCount").textContent =
      actual;

    document.getElementById("startBtn").disabled =
      actual === 0;

    document.getElementById("poolMessage").textContent =
      pool.length === 0
        ? "단원을 선택하거나 제외한 문제를 복원해 주세요."
        : (
          pool.length < config.count
            ? `사용 가능한 ${pool.length}문제를 모두 출제합니다.`
            : `사용 가능한 ${pool.length}문항 중 ${actual}문제를 출제합니다.`
        );

    document.querySelectorAll("[data-unit]")
      .forEach(input => {
        input.checked = config.unitIds.includes(
          input.dataset.unit
        );
      });

    document.querySelectorAll("[data-chapter]")
      .forEach(input => {
        const ids = D.units
          .filter(u => u.chapterId === input.dataset.chapter)
          .map(u => u.id);

        const selected = ids.filter(
          id => config.unitIds.includes(id)
        ).length;

        input.checked = selected === ids.length;
        input.indeterminate =
          selected > 0 && selected < ids.length;
      });
  }

  /* =====================================
     3. 문제 검토와 출제 제외
  ===================================== */

  function renderReview() {
    screen = "review";

    const pool = getPool(true);
    const excluded = new Set(config.excludedIds);

    app.innerHTML = `
      <div class="game-top">
        <div>
          <span class="eyebrow">수업 전 확인</span>
          <h2>문제 검토 · 제외</h2>
        </div>

        <button
          class="btn"
          data-action="home"
        >
          설정으로 돌아가기
        </button>
      </div>

      <div class="notice mb">
        시작 화면에서 고른 단원과 문제 유형을 표시합니다.
        체크한 문제만 출제합니다.
        출처 링크는 새 창에서 열립니다.
      </div>

      <section class="panel">
        <div class="row between mb">
          <strong id="reviewCount"></strong>

          <button
            class="btn btn-sm"
            data-action="restore-visible"
          >
            이 목록 모두 출제
          </button>
        </div>

        ${
          pool.length
            ? pool.map((q, i) => `
              <article class="review-card">
                <div class="row between">
                  <span class="badge">
                    ${esc(unitTitle(q.unitId))}
                  </span>

                  <label class="check-row">
                    <input
                      type="checkbox"
                      data-include="${esc(q.id)}"
                      ${excluded.has(q.id) ? "" : "checked"}
                    >
                    <span>출제</span>
                  </label>
                </div>

                <h3>
                  ${i + 1}. ${esc(q.question)}
                </h3>

                <p class="small muted">
                  ${
                    q.options.map((text, n) =>
                      `${n + 1}. ${esc(text)}`
                    ).join(" / ")
                  }
                </p>

                <p class="review-answer">
                  정답: ${esc(q.options[q.answer])}
                </p>

                <p>${esc(q.explanation)}</p>

                <p class="small">
                  <strong>핵심:</strong>
                  ${esc(q.keyPoint)}
                </p>

                ${sourceHTML(q)}
              </article>
            `).join("")
            : `
              <div class="empty-state">
                선택한 범위에 문제가 없습니다.
                시작 화면에서 단원을 선택해 주세요.
              </div>
            `
        }
      </section>
    `;

    updateReviewCount();
    focusMain();
  }

  function updateReviewCount() {
    const el = document.getElementById("reviewCount");

    if (!el) return;

    el.textContent =
      `목록 ${getPool(true).length}문항 · ` +
      `출제 가능 ${getPool().length}문항`;
  }

  // app.js 1/3 끝
  // 다음 2/3 코드를 이 아래에 이어 붙이세요.
  /* =====================================
     4. 게임 생성
  ===================================== */

  function prepareQuestion(q) {
    /*
     * 객관식 보기를 섞고 정답 위치도 함께 이동합니다.
     * 원본 데이터는 변경하지 않습니다.
     * OX는 O → X 순서를 유지합니다.
     */
    const order = q.type === "ox"
      ? q.options.map((_, i) => i)
      : shuffle(q.options.map((_, i) => i));

    return {
      ...q,
      options: order.map(i => q.options[i]),
      answer: order.indexOf(q.answer)
    };
  }

  function startGame(retryIds = null) {
    let pool;

    if (Array.isArray(retryIds)) {
      pool = [...new Set(retryIds)]
        .map(id => questionMap.get(id))
        .filter(Boolean);
    } else {
      pool = getPool();
    }

    if (!pool.length) {
      toast("출제할 문제가 없습니다.");
      return;
    }

    const retry = Array.isArray(retryIds);

    const count = retry
      ? pool.length
      : Math.min(config.count, pool.length);

    const mode = retry ? "solo" : config.mode;

    save();
    stopClock();

    game = {
      mode,
      retry,
      seconds: config.seconds,

      deck: shuffle(pool)
        .slice(0, count)
        .map(prepareQuestion),

      index: 0,
      records: [],
      score: 0,
      correct: 0,

      teams: mode === "team"
        ? config.teamNames
            .slice(0, config.teamCount)
            .map((name, i) => ({
              name: name.trim() || `팀 ${i + 1}`,
              score: 0
            }))
        : [],

      selected: null,
      revealed: false,
      expired: false,
      paused: false,

      awarded: new Set(),

      remainingMs: 0,
      deadline: null,

      finished: false,
      startedAt: Date.now()
    };

    loadQuestion();
  }

  function currentQuestion() {
    return game?.deck[game.index];
  }

  function loadQuestion() {
    stopClock();

    game.selected = null;
    game.revealed = false;
    game.expired = false;
    game.paused = false;
    game.awarded = new Set();

    game.remainingMs = game.seconds * 1000;
    game.deadline = null;

    renderGame();
    focusMain();

    runClock();
  }

  /* =====================================
     5. 타이머
  ===================================== */

  function stopClock() {
    if (ticker !== null) {
      clearInterval(ticker);
      ticker = null;
    }
  }

  function runClock() {
    stopClock();

    if (
      !game ||
      game.finished ||
      game.revealed ||
      game.paused ||
      game.expired ||
      game.seconds === 0
    ) {
      return;
    }

    game.deadline =
      performance.now() + game.remainingMs;

    tick();

    if (!game.expired) {
      ticker = setInterval(tick, 150);
    }
  }

  function tick() {
    if (
      !game ||
      game.finished ||
      game.paused ||
      game.revealed ||
      game.expired ||
      game.seconds === 0 ||
      game.deadline === null
    ) {
      return;
    }

    game.remainingMs = Math.max(
      0,
      game.deadline - performance.now()
    );

    updateClock();

    if (game.remainingMs <= 0) {
      expireQuestion();
    }
  }

  function updateClock() {
    const el = document.getElementById("timerValue");

    if (!el || !game) return;

    el.textContent = game.seconds === 0
      ? "∞"
      : Math.ceil(game.remainingMs / 1000);

    el.classList.toggle(
      "urgent",
      game.seconds > 0 &&
      game.remainingMs <= 5000
    );
  }

  function expireQuestion() {
    if (
      !game ||
      game.expired ||
      game.revealed ||
      game.finished
    ) {
      return;
    }

    stopClock();

    game.remainingMs = 0;
    game.expired = true;
    game.deadline = null;

    renderGame();

    toast(
      "시간 종료! 답이 잠겼습니다. 정답을 공개해 주세요."
    );
  }

  function timeIsUp() {
    if (
      game &&
      game.seconds > 0 &&
      !game.paused &&
      !game.revealed &&
      !game.expired &&
      game.deadline !== null &&
      performance.now() >= game.deadline
    ) {
      expireQuestion();
      return true;
    }

    return game?.expired === true;
  }

  function pauseGame() {
    if (
      !game ||
      game.finished ||
      game.revealed ||
      game.expired
    ) {
      return false;
    }

    if (timeIsUp()) return false;

    if (!game.paused) {
      if (
        game.seconds > 0 &&
        game.deadline !== null
      ) {
        game.remainingMs = Math.max(
          0,
          game.deadline - performance.now()
        );
      }

      stopClock();

      game.paused = true;
      game.deadline = null;

      renderGame();
      return true;
    }

    return false;
  }

  function resumeGame() {
    if (
      !game ||
      !game.paused ||
      game.finished
    ) {
      return;
    }

    game.paused = false;

    renderGame();
    runClock();
  }

  /* =====================================
     6. 게임 화면
  ===================================== */

  function renderGame() {
    screen = "game";

    const q = currentQuestion();
    const total = game.deck.length;

    const answered =
      game.index + (game.revealed ? 1 : 0);

    const progress = Math.round(
      answered / total * 100
    );

    const status = game.paused
      ? "일시 정지"
      : game.revealed
        ? "정답 공개"
        : game.expired
          ? "시간 종료"
          : "생각하는 시간";

    app.innerHTML = `
      <div class="game-top">
        <div>
          <span class="badge">
            ${
              game.mode === "solo"
                ? "혼자 풀기"
                : "우리 반 팀전"
            }
          </span>

          ${
            game.retry
              ? `
                <span class="badge badge-red">
                  오답 재도전
                </span>
              `
              : ""
          }

          <p class="small muted mt">
            ${esc(unitTitle(q.unitId))}
          </p>
        </div>

        <div class="row">
          ${
            game.mode === "solo"
              ? `
                <strong>
                  ${game.score.toLocaleString()}점
                </strong>
              `
              : ""
          }

          <div class="timer-box">
            <div
              id="timerValue"
              class="timer-value"
              aria-label="남은 시간"
            ></div>

            <div class="timer-label">
              ${status}
            </div>
          </div>

          <button
            class="btn btn-sm"
            data-action="pause"
            ${
              game.revealed || game.expired
                ? "disabled"
                : ""
            }
          >
            ${game.paused ? "계속하기" : "일시 정지"}
          </button>
        </div>
      </div>

      <div
        class="progress-track"
        role="progressbar"
        aria-label="문제 진행률"
        aria-valuemin="0"
        aria-valuemax="${total}"
        aria-valuenow="${answered}"
      >
        <div
          class="progress-fill"
          style="width:${progress}%"
        ></div>
      </div>

      <section class="panel ornament question-panel">
        <div class="row between">
          <span class="question-number">
            문제 ${game.index + 1} / ${total}
          </span>

          <span class="badge">
            ${q.type === "ox" ? "OX 퀴즈" : "객관식"}
          </span>
        </div>

        ${
          game.paused
            ? `
              <div class="empty-state">
                <h2>잠시 쉬어 가는 중</h2>

                <p class="mt">
                  계속하기를 누르면 문제가 다시 표시됩니다.
                </p>
              </div>
            `
            : `
              <h2 class="question-text">
                ${esc(q.question)}
              </h2>

              <div
                class="answers ${q.type === "ox" ? "ox" : ""}"
              >
                ${
                  q.options.map((text, i) =>
                    answerHTML(q, text, i)
                  ).join("")
                }
              </div>
            `
        }

        ${
          game.mode === "solo" &&
          !game.revealed &&
          !game.paused
            ? `
              <p class="small muted mt">
                ${
                  game.expired
                    ? "답이 잠겼습니다. 정답 공개를 눌러 주세요."
                    : "답을 선택한 뒤 정답 공개를 누르세요. 공개 전에는 수정할 수 있습니다."
                }
              </p>
            `
            : ""
        }

        ${
          game.mode === "team" &&
          !game.revealed &&
          !game.paused
            ? `
              <p class="small muted mt">
                각 팀은 말이나 답판으로 답하세요.
                진행자가 정답을 공개합니다.
              </p>
            `
            : ""
        }

        ${
          game.revealed
            ? explanationHTML(q)
            : ""
        }

        <div class="game-controls">
          <button
            class="btn btn-ghost"
            data-action="exit"
          >
            게임 나가기
          </button>

          ${
            game.revealed
              ? `
                <button
                  class="btn btn-primary"
                  data-action="next"
                >
                  ${
                    game.index === total - 1
                      ? "최종 결과 보기"
                      : "다음 문제"
                  }
                </button>
              `
              : `
                <button
                  class="btn btn-primary"
                  data-action="reveal"
                  ${
                    game.paused ||
                    (
                      game.mode === "solo" &&
                      game.selected === null &&
                      !game.expired
                    )
                      ? "disabled"
                      : ""
                  }
                >
                  정답 공개
                </button>
              `
          }
        </div>
      </section>

      ${
        game.mode === "team"
          ? teamBoardHTML()
          : ""
      }
    `;

    updateClock();
  }

  function answerHTML(q, text, index) {
    const classes = ["answer-btn"];

    if (
      !game.revealed &&
      game.selected === index
    ) {
      classes.push("selected");
    }

    if (game.revealed) {
      if (index === q.answer) {
        classes.push("correct");
      } else if (
        game.mode === "solo" &&
        index === game.selected
      ) {
        classes.push("wrong");
      } else {
        classes.push("dimmed");
      }
    }

    const disabled =
      game.mode === "team" ||
      game.revealed ||
      game.expired ||
      game.paused;

    const suffix = game.revealed
      ? (
        index === q.answer
          ? " · 정답"
          : (
            game.mode === "solo" &&
            index === game.selected
              ? " · 내 선택"
              : ""
          )
      )
      : "";

    return `
      <button
        class="${classes.join(" ")}"
        data-action="answer"
        data-index="${index}"
        aria-pressed="${game.selected === index}"
        aria-label="${esc(text + suffix)}"
        ${disabled ? "disabled" : ""}
      >
        ${
          q.type === "choice"
            ? `
              <span class="answer-label">
                ${index + 1}
              </span>
            `
            : ""
        }

        <span>
          ${esc(text)}

          ${
            suffix
              ? `
                <span class="small">
                  ${esc(suffix)}
                </span>
              `
              : ""
          }
        </span>
      </button>
    `;
  }

  function explanationHTML(q) {
    const correct =
      game.mode === "solo" &&
      game.selected === q.answer;

    const title = game.mode === "team"
      ? "정답을 확인하세요"
      : correct
        ? `정답입니다! +${POINTS}점`
        : game.selected === null
          ? "미응답 — 해설을 확인하세요"
          : "아쉬워요. 해설을 확인하세요";

    return `
      <section class="explanation">
        <h3>${title}</h3>

        <p>
          <strong>
            정답: ${esc(q.options[q.answer])}
          </strong>
        </p>

        <p>${esc(q.explanation)}</p>

        <p class="small">
          <strong>핵심:</strong>
          ${esc(q.keyPoint)}
        </p>

        <details>
          <summary>참고 출처 보기</summary>

          <div class="mt">
            ${sourceHTML(q)}
          </div>
        </details>

        ${
          game.mode === "team"
            ? `
              <div class="notice mt">
                아래 점수판에서 정답을 맞힌 팀을 선택하세요.
                다시 누르면 이 문제의 점수 부여를 취소합니다.
              </div>
            `
            : ""
        }
      </section>
    `;
  }

  function teamBoardHTML() {
    return `
      <section class="panel mt">
        <div class="panel-title">
          <h2>우리 반 점수판</h2>

          <span class="badge">
            정답당 ${POINTS}점
          </span>
        </div>

        <div class="teams-grid">
          ${game.teams.map((team, i) => `
            <div class="team-card">
              <div class="team-name">
                ${esc(team.name)}
              </div>

              <div class="team-score">
                ${team.score.toLocaleString()}
              </div>

              <button
                class="btn btn-sm team-award"
                data-action="award"
                data-index="${i}"
                aria-pressed="${game.awarded.has(i)}"
                ${game.revealed ? "" : "disabled"}
              >
                ${
                  game.awarded.has(i)
                    ? "✓ 반영됨 · 취소"
                    : `정답 +${POINTS}`
                }
              </button>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }

  /* =====================================
     7. 답 선택 / 채점 / 다음 문제
  ===================================== */

  function selectAnswer(index) {
    if (
      !game ||
      game.finished ||
      game.mode !== "solo" ||
      game.paused ||
      game.revealed ||
      timeIsUp()
    ) {
      return;
    }

    const q = currentQuestion();

    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= q.options.length
    ) {
      return;
    }

    game.selected = index;

    renderGame();
  }

  function revealAnswer() {
    if (
      !game ||
      game.finished ||
      game.revealed ||
      game.paused
    ) {
      return;
    }

    timeIsUp();

    if (
      game.mode === "solo" &&
      game.selected === null &&
      !game.expired
    ) {
      toast("먼저 답을 선택해 주세요.");
      return;
    }

    if (
      game.seconds > 0 &&
      !game.expired &&
      game.deadline !== null
    ) {
      game.remainingMs = Math.max(
        0,
        game.deadline - performance.now()
      );
    }

    stopClock();

    game.deadline = null;
    game.revealed = true;

    const q = currentQuestion();

    const correct =
      game.mode === "solo" &&
      game.selected === q.answer;

    if (correct) {
      game.score += POINTS;
      game.correct += 1;
    }

    game.records.push({
      id: q.id,
      unitId: q.unitId,
      correct,

      selectedText: game.selected === null
        ? null
        : q.options[game.selected],

      correctText: q.options[q.answer],
      expired: game.expired,
      teamAwards: []
    });

    renderGame();
  }

  function awardTeam(index) {
    if (
      !game ||
      game.finished ||
      game.mode !== "team" ||
      !game.revealed ||
      !Number.isInteger(index) ||
      !game.teams[index]
    ) {
      return;
    }

    if (game.awarded.has(index)) {
      game.awarded.delete(index);
      game.teams[index].score -= POINTS;
    } else {
      game.awarded.add(index);
      game.teams[index].score += POINTS;
    }

    const record =
      game.records[game.records.length - 1];

    record.teamAwards = [...game.awarded];

    renderGame();
  }

  function nextQuestion() {
    if (
      !game ||
      game.finished ||
      !game.revealed
    ) {
      return;
    }

    if (game.index >= game.deck.length - 1) {
      finishGame();
      return;
    }

    game.index += 1;

    loadQuestion();
  }

  // app.js 2/3 끝
  // 다음 3/3 코드를 이 아래에 이어 붙이세요.
  /* =====================================
     8. 결과
  ===================================== */

  function finishGame() {
    if (!game || game.finished) return;

    stopClock();

    game.finished = true;

    const topScore = game.mode === "team"
      ? Math.max(...game.teams.map(t => t.score))
      : game.score;

    history.unshift({
      at: Date.now(),
      mode: game.mode,
      retry: game.retry,
      total: game.deck.length,
      correct: game.correct,
      score: topScore,

      teams: game.teams.map(team => ({
        name: team.name,
        score: team.score
      })),

      wrongIds: game.mode === "solo"
        ? game.records
            .filter(record => !record.correct)
            .map(record => record.id)
        : []
    });

    history = history.slice(0, 30);

    save();
    renderResult();
  }

  function renderResult() {
    screen = "result";

    const total = game.deck.length;

    const wrong = game.records.filter(
      record => !record.correct
    );

    const percentage = Math.round(
      game.correct / total * 100
    );

    const topScore = game.mode === "team"
      ? Math.max(...game.teams.map(team => team.score))
      : game.score;

    const winners = game.teams.filter(
      team => team.score === topScore
    );

    app.innerHTML = `
      <section class="panel ornament">
        <div class="result-hero">
          <span class="eyebrow">
            오늘의 역사 한 판
          </span>

          <h2>
            ${
              game.mode === "solo"
                ? "퀴즈를 마쳤어요!"
                : "우리 반 퀴즈 결과"
            }
          </h2>

          <div class="result-score">
            ${topScore.toLocaleString()}점
          </div>

          <p class="muted">
            ${
              game.mode === "solo"
                ? `${total}문제 중 ${game.correct}문제 정답`
                : (
                  winners.length > 1
                    ? `공동 1위: ${
                        winners.map(
                          t => esc(t.name)
                        ).join(", ")
                      }`
                    : `1위: ${esc(winners[0].name)}`
                )
            }
          </p>
        </div>

        ${
          game.mode === "solo"
            ? `
              <div class="stats-grid">
                <div class="stat">
                  <strong>${percentage}%</strong>
                  <span>정답률</span>
                </div>

                <div class="stat">
                  <strong>${game.correct}</strong>
                  <span>정답</span>
                </div>

                <div class="stat">
                  <strong>${wrong.length}</strong>
                  <span>오답 · 미응답</span>
                </div>
              </div>
            `
            : `
              <div class="teams-grid mb">
                ${
                  [...game.teams]
                    .sort((a, b) => b.score - a.score)
                    .map(team => `
                      <div class="team-card">
                        <div class="team-name">
                          ${esc(team.name)}
                        </div>

                        <div class="team-score">
                          ${team.score.toLocaleString()}
                        </div>

                        <span class="small muted">
                          점
                        </span>
                      </div>
                    `).join("")
                }
              </div>

              <div class="notice mb">
                팀 점수는 진행자가 부여한 결과입니다.
                학생 개인의 정답률이나 성취도를
                나타내지 않습니다.
              </div>
            `
        }

        <div class="row">
          ${
            game.mode === "solo" && wrong.length
              ? `
                <button
                  class="btn btn-primary"
                  data-action="retry-wrong"
                >
                  오답 ${wrong.length}문제 다시 풀기
                </button>
              `
              : ""
          }

          <button
            class="btn btn-green"
            data-action="home"
          >
            범위 다시 선택
          </button>

          <button
            class="btn"
            data-action="history"
          >
            최근 기록
          </button>
        </div>
      </section>

      ${
        game.mode === "solo"
          ? unitResultHTML()
          : ""
      }

      <section class="panel mt">
        <h2 class="mb">문제별 복습</h2>

        ${game.records.map((record, i) => {
          const q = questionMap.get(record.id);

          return `
            <details class="review-card">
              <summary>
                ${
                  game.mode === "solo"
                    ? (
                      record.correct
                        ? "✓ 정답"
                        : "✕ 복습"
                    )
                    : `${record.teamAwards.length}팀 정답`
                }
                · ${i + 1}. ${esc(q.question)}
              </summary>

              <div class="mt">
                ${
                  game.mode === "solo"
                    ? `
                      <p class="small muted">
                        내 답:
                        ${
                          esc(
                            record.selectedText ?? "미응답"
                          )
                        }
                        ${
                          record.expired
                            ? " · 시간 종료"
                            : ""
                        }
                      </p>
                    `
                    : `
                      <p class="small muted">
                        정답 팀:
                        ${
                          record.teamAwards.length
                            ? record.teamAwards.map(
                                n => esc(game.teams[n].name)
                              ).join(", ")
                            : "없음"
                        }
                      </p>
                    `
                }

                <p class="review-answer">
                  정답: ${esc(record.correctText)}
                </p>

                <p>${esc(q.explanation)}</p>

                <p class="small">
                  <strong>핵심:</strong>
                  ${esc(q.keyPoint)}
                </p>

                ${sourceHTML(q)}
              </div>
            </details>
          `;
        }).join("")}
      </section>
    `;

    focusMain();
  }

  function unitResultHTML() {
    const rows = D.units.map(unit => {
      const records = game.records.filter(
        record => record.unitId === unit.id
      );

      if (!records.length) return "";

      const correct = records.filter(
        record => record.correct
      ).length;

      return `
        <tr>
          <td>${esc(unit.title)}</td>

          <td>
            ${correct} / ${records.length}
          </td>

          <td>
            ${
              Math.round(
                correct / records.length * 100
              )
            }%
          </td>
        </tr>
      `;
    }).join("");

    return `
      <section class="panel mt">
        <h2 class="mb">
          이번 게임 단원별 결과
        </h2>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">단원</th>
                <th scope="col">정답 / 출제</th>
                <th scope="col">정답률</th>
              </tr>
            </thead>

            <tbody>${rows}</tbody>
          </table>
        </div>

        <p class="small muted mt">
          이번에 출제된 문제만 집계한 결과입니다.
          문항 수가 적으므로 단원 전체의 이해도를
          뜻하지 않습니다.
        </p>
      </section>
    `;
  }

  /* =====================================
     9. 최근 기록
  ===================================== */

  function renderHistory() {
    stopClock();
    screen = "history";

    app.innerHTML = `
      <div class="game-top">
        <div>
          <span class="eyebrow">
            학습 기록
          </span>

          <h2>최근 30회 기록</h2>
        </div>

        <button
          class="btn"
          data-action="home"
        >
          시작 화면
        </button>
      </div>

      <section class="panel">
        ${
          history.length
            ? `
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">일시</th>
                      <th scope="col">방식</th>
                      <th scope="col">결과</th>
                      <th scope="col">점수</th>
                      <th scope="col">복습</th>
                    </tr>
                  </thead>

                  <tbody>
                    ${history.map((record, i) => {
                      const wrongIds =
                        Array.isArray(record.wrongIds)
                          ? record.wrongIds.filter(
                              id => questionMap.has(id)
                            )
                          : [];

                      return `
                        <tr>
                          <td>
                            ${
                              esc(
                                new Date(record.at)
                                  .toLocaleString(
                                    "ko-KR",
                                    {
                                      month: "numeric",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    }
                                  )
                              )
                            }
                          </td>

                          <td>
                            ${
                              record.mode === "team"
                                ? "팀전"
                                : record.retry
                                  ? "오답 복습"
                                  : "개인전"
                            }
                          </td>

                          <td>
                            ${
                              record.mode === "team"
                                ? `${record.total}문제 진행`
                                : `${record.correct} / ${record.total} 정답`
                            }
                          </td>

                          <td>
                            ${record.score.toLocaleString()}
                            ${
                              record.mode === "team"
                                ? "점 · 최고 팀"
                                : "점"
                            }
                          </td>

                          <td>
                            ${
                              record.mode === "solo" &&
                              wrongIds.length
                                ? `
                                  <button
                                    class="btn btn-sm"
                                    data-action="history-retry"
                                    data-index="${i}"
                                  >
                                    오답 복습
                                  </button>
                                `
                                : "—"
                            }
                          </td>
                        </tr>
                      `;
                    }).join("")}
                  </tbody>
                </table>
              </div>

              <button
                class="btn btn-sm btn-danger mt"
                data-action="clear-history"
              >
                최근 기록 삭제
              </button>
            `
            : `
              <div class="empty-state">
                아직 완료한 게임이 없습니다.
                퀴즈를 끝까지 풀면 기록이 표시됩니다.
              </div>
            `
        }

        <div class="notice mt">
          기록은 현재 브라우저에만 저장됩니다.
          다른 기기와 자동으로 동기화되지 않으며,
          진행 중인 게임은 새로고침하면 종료됩니다.
        </div>
      </section>
    `;

    focusMain();
  }

  /* =====================================
     10. 화면 이동
  ===================================== */

  function goHome() {
    if (
      screen === "game" &&
      game &&
      !game.finished
    ) {
      const wasPaused = pauseGame();

      const leave = window.confirm(
        "진행 중인 게임을 종료할까요?\n" +
        "완료하지 않은 게임은 기록에 저장되지 않습니다."
      );

      if (!leave) {
        if (wasPaused) resumeGame();
        return;
      }
    }

    stopClock();

    game = null;
    resumeAfterHelp = false;

    renderHome();
    focusMain();
  }

  /* =====================================
     11. 클릭 이벤트
  ===================================== */

  app.addEventListener("click", event => {
    const button = event.target.closest(
      "button[data-action]"
    );

    if (!button || button.disabled) return;

    const action = button.dataset.action;

    switch (action) {
      case "select-all":
        config.unitIds = D.units.map(
          unit => unit.id
        );

        save();
        updateHomeSummary();
        break;

      case "select-none":
        config.unitIds = [];

        save();
        updateHomeSummary();
        break;

      case "mode":
        config.mode = allowed(
          button.dataset.value,
          ["solo", "team"],
          "solo"
        );

        save();
        renderHome();
        break;

      case "start":
        startGame();
        break;

      case "review":
        renderReview();
        break;

      case "restore-visible": {
        const visibleIds = new Set(
          getPool(true).map(q => q.id)
        );

        config.excludedIds =
          config.excludedIds.filter(
            id => !visibleIds.has(id)
          );

        save();
        renderReview();

        toast(
          "이 목록의 문제를 모두 출제하도록 설정했어요."
        );

        break;
      }

      case "history":
        renderHistory();
        break;

      case "home":
      case "exit":
        goHome();
        break;

      case "answer":
        selectAnswer(
          Number(button.dataset.index)
        );
        break;

      case "reveal":
        revealAnswer();
        break;

      case "next":
        nextQuestion();
        break;

      case "award":
        awardTeam(
          Number(button.dataset.index)
        );
        break;

      case "pause":
        if (game?.paused) {
          resumeGame();
        } else {
          pauseGame();
        }
        break;

      case "retry-wrong":
        if (game?.finished) {
          const ids = game.records
            .filter(record => !record.correct)
            .map(record => record.id);

          startGame(ids);
        }
        break;

      case "history-retry": {
        const record = history[
          Number(button.dataset.index)
        ];

        if (
          record &&
          Array.isArray(record.wrongIds)
        ) {
          startGame(record.wrongIds);
        }

        break;
      }

      case "clear-history":
        if (
          window.confirm(
            "최근 게임 기록을 모두 삭제할까요?\n" +
            "출제 설정과 문제 제외 설정은 유지됩니다."
          )
        ) {
          history = [];

          save();
          renderHistory();

          toast("최근 기록을 삭제했어요.");
        }

        break;
    }
  });

  /* =====================================
     12. 설정 변경 이벤트
  ===================================== */

  app.addEventListener("change", event => {
    const target = event.target;

    if (target.matches("[data-unit]")) {
      const ids = new Set(config.unitIds);
      const id = target.dataset.unit;

      if (target.checked) {
        ids.add(id);
      } else {
        ids.delete(id);
      }

      config.unitIds = [...ids];

      save();
      updateHomeSummary();
      return;
    }

    if (target.matches("[data-chapter]")) {
      const ids = new Set(config.unitIds);

      D.units
        .filter(
          unit =>
            unit.chapterId === target.dataset.chapter
        )
        .forEach(unit => {
          if (target.checked) {
            ids.add(unit.id);
          } else {
            ids.delete(unit.id);
          }
        });

      config.unitIds = [...ids];

      save();
      updateHomeSummary();
      return;
    }

    if (target.matches("[data-include]")) {
      const ids = new Set(config.excludedIds);
      const id = target.dataset.include;

      if (target.checked) {
        ids.delete(id);
      } else {
        ids.add(id);
      }

      config.excludedIds = [...ids];

      save();
      updateReviewCount();
      return;
    }

    if (target.matches("[data-team-name]")) {
      const i = Number(target.dataset.teamName);

      const name = target.value
        .trim()
        .slice(0, 16);

      config.teamNames[i] =
        name || defaults.teamNames[i];

      target.value = config.teamNames[i];

      save();
      return;
    }

    switch (target.id) {
      case "typeSelect":
        config.type = allowed(
          target.value,
          ["all", "choice", "ox"],
          "all"
        );
        break;

      case "countSelect":
        config.count = allowed(
          Number(target.value),
          [5, 10, 20, 26],
          10
        );
        break;

      case "secondsSelect":
        config.seconds = allowed(
          Number(target.value),
          [0, 20, 30, 60],
          30
        );
        break;

      case "teamCountSelect":
        config.teamCount = allowed(
          Number(target.value),
          [2, 3, 4, 5, 6],
          2
        );

        save();
        renderHome();
        return;

      case "projectorCheck":
        config.projector = target.checked;

        applyProjector();
        break;

      default:
        return;
    }

    save();
    updateHomeSummary();
  });

  /*
   * 입력 중 다른 버튼을 눌러도
   * 팀 이름의 최신 값이 유지되도록 처리합니다.
   */
  app.addEventListener("input", event => {
    const target = event.target;

    if (!target.matches("[data-team-name]")) {
      return;
    }

    const i = Number(target.dataset.teamName);

    config.teamNames[i] =
      target.value.slice(0, 16);
  });

  /* =====================================
     13. 상단 메뉴 / 전체 화면
  ===================================== */

  document.getElementById("homeBtn")
    .addEventListener("click", goHome);

  const helpDialog =
    document.getElementById("helpDialog");

  document.getElementById("helpBtn")
    .addEventListener("click", () => {
      resumeAfterHelp = false;

      if (screen === "game") {
        resumeAfterHelp = pauseGame();
      }

      if (
        typeof helpDialog.showModal === "function"
      ) {
        helpDialog.showModal();
      } else {
        window.alert(
          "범위와 모드를 선택한 뒤 퀴즈를 시작하세요.\n" +
          "개인전은 답을 고르고 정답 공개를 누릅니다.\n" +
          "팀전은 정답 공개 후 진행자가 팀 점수를 부여합니다."
        );

        if (resumeAfterHelp) {
          resumeGame();
        }

        resumeAfterHelp = false;
      }
    });

  helpDialog.addEventListener("close", () => {
    if (
      resumeAfterHelp &&
      screen === "game"
    ) {
      resumeGame();
    }

    resumeAfterHelp = false;
  });

  const fullscreenButton =
    document.getElementById("fullscreenBtn");

  fullscreenButton.addEventListener(
    "click",
    async () => {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else if (
          document.documentElement.requestFullscreen
        ) {
          await document.documentElement
            .requestFullscreen();
        } else {
          toast(
            "이 브라우저는 전체 화면 전환을 지원하지 않습니다."
          );
        }
      } catch {
        toast(
          "전체 화면으로 전환하지 못했어요. " +
          "브라우저의 전체 화면 기능을 이용해 주세요."
        );
      }
    }
  );

  document.addEventListener(
    "fullscreenchange",
    () => {
      fullscreenButton.textContent =
        document.fullscreenElement
          ? "전체 화면 종료"
          : "전체 화면";
    }
  );

  /* =====================================
     14. 키보드 지원
  ===================================== */

  document.addEventListener("keydown", event => {
    if (
      event.repeat ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      screen !== "game" ||
      helpDialog.open
    ) {
      return;
    }

    const target = event.target;

    if (
      target instanceof HTMLElement &&
      (
        target.matches(
          "input, select, textarea"
        ) ||
        target.isContentEditable
      )
    ) {
      return;
    }

    if (/^[1-4]$/.test(event.key)) {
      event.preventDefault();

      selectAnswer(
        Number(event.key) - 1
      );
    }
  });

  /*
   * 다른 탭을 보는 동안에도 시간이 경과합니다.
   * 돌아오면 실제 남은 시간을 즉시 반영합니다.
   */
  document.addEventListener(
    "visibilitychange",
    () => {
      if (
        !document.hidden &&
        screen === "game" &&
        game &&
        !game.paused &&
        !game.revealed &&
        !game.expired
      ) {
        tick();
      }
    }
  );

  /* =====================================
     15. 시작
  ===================================== */

  applyProjector();
  renderHome();

  window.QUIZ_APP_READY = true;
})();
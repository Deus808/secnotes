/* ==========================================================================
   SecNotes 展示端 · 进入站点通知（仿手机通知横幅）
   --------------------------------------------------------------------------
   在进入网站时弹出一条淡蓝色通知，提示本站最近一次同步时间。
   · 同步时间取自 window.SEC_BLOG.stats.builtAt（格式 YYYY-MM-DD HH:MM）
   · 提供「不再提示」勾选，状态存 localStorage（值为当前 builtAt，站点更新后
     会重新展示，避免用户错过新内容）
   -   纯前端、无依赖、注入 `</body>` 前即可用
   ========================================================================== */
(function () {
  var LS_KEY = "secnotes_notice_dismiss";

  // 等待数据文件加载完成（data/notes.js 由源站 boot() 动态注入，属异步加载）
  function getBuiltAt(timeoutMs, done) {
    var deadline = Date.now() + timeoutMs;
    var timer;
    (function poll() {
      var b = window.SEC_BLOG && window.SEC_BLOG.stats && window.SEC_BLOG.stats.builtAt;
      if (b) return done(b);
      if (Date.now() > deadline) return done("");
      timer = setTimeout(poll, 120);
    })();
  }

  // “2026-09-15 17:04” → “9月15日 17:04”；不合法则返回空串
  function formatBuiltAt(v) {
    var m = String(v || "").match(/^\s*\d{4}-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})/);
    if (!m) return "";
    return parseInt(m[1], 10) + "月" + parseInt(m[2], 10) + "日 " +
           m[3] + ":" + m[4];
  }

  // 是否已「不再提示」（在同一版本 builtAt 下）
  function isDismissed(builtAt) {
    try { return localStorage.getItem(LS_KEY) === builtAt; }
    catch (e) { return false; }
  }
  function markDismissed(builtAt) {
    try { localStorage.setItem(LS_KEY, builtAt || "unknown"); } catch (e) {}
  }

  function build(builtAt) {
    var text = formatBuiltAt(builtAt);
    // 未完善的同步时间 → 提示站主还没起床
    var bodyHTML = text
      ? '本网站最近一次同步时间为 <b>' + text + '</b>'
      : '本站同步时间暂未完善，站主还没起床，请耐心等待～';

    var wrap = document.createElement("div");
    wrap.className = "sn-wrap";
    wrap.innerHTML =
      '<div class="sn-card">' +
        '<div class="sn-title"><span>站点通知</span><span class="sn-badge">新知</span></div>' +
        '<p class="sn-text">' + bodyHTML + '</p>' +
        '<label class="sn-opt"><input type="checkbox" id="snDont">不再提示</label>' +
        '<button class="sn-close" id="snClose" aria-label="关闭" title="关闭">&times;</button>' +
      '</div>';
    document.body.appendChild(wrap);

    var shown = false;
    function show() { if (!shown) { shown = true; replace("sn-show"); } }
    function hide() { wrap.classList.remove("sn-show"); wrap.classList.add("sn-hide"); }
    function dismiss() { markDismissed(builtAt); hide(); }
    function replace(cls) {
      wrap.className = "sn-wrap " + cls;
    }

    document.getElementById("snClose").addEventListener("click", dismiss);
    document.getElementById("snDont").addEventListener("change", function (e) {
      if (e.target.checked) markDismissed(builtAt);
    });
    wrap.addEventListener("click", function (e) { if (e.target === wrap) dismiss(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") dismiss();
    });

    // 进入后稍作停顿再滑入，避免与首屏渲染抢视觉
    setTimeout(show, 650);
  }

  // 若设置了「本地不再提醒该版本」，直接跳过；否则正常弹出
  getBuiltAt(4000, function (builtAt) {
    if (isDismissed(builtAt)) return;
    build(builtAt);
  });
})();
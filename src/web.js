/* Prompt Optimize — browser half.
 *
 * A composer seat plus one anchored panel: rewrite the current draft, review a
 * line diff before it replaces anything, undo for nine seconds, keep a local
 * version history, and turn a finished prompt into a reusable template.
 *
 * Everything here is a plain module-loader bundle: React comes from the host's
 * module table, the panel portals to <body> (the docked composer clips fixed
 * children), and every colour is a --dsw-alias-* theme token.
 */
window.__ModuleLoader__.load({
  id: "@minus77/dsh-prompt-optimize",
  factory(require) {
    const React = require("react");
    const ReactDOM = require("react-dom");
    const h = React.createElement;
    const createPortal = ReactDOM.createPortal ?? ReactDOM.default?.createPortal;
    const { useCallback, useEffect, useMemo, useRef, useState } = React;

    const MODELS_ROUTE = "/prompt-optimize/models";
    const OPTIMIZE_ROUTE = "/prompt-optimize/optimize";
    const VARIABLES_ROUTE = "/prompt-optimize/variables";
    const REVIEW_ROUTE = "/prompt-optimize/review";
    const PIN_KEY = "dsh.prompt-optimize/model";
    const HISTORY_KEY = "dsh.prompt-optimize/history";
    const HISTORY_MAX = 50;
    const CUSTOM_KEY = "dsh.prompt-optimize/custom-templates";
    const CUSTOM_CATEGORY = "自定义";
    /** Checkup dimensions in display order: [key, label]. */
    const REVIEW_DIMS = [
      ["clarity", "清晰度"],
      ["context", "上下文"],
      ["format", "输出格式"],
      ["constraints", "约束"],
      ["examples", "示例"],
      ["robustness", "鲁棒性"],
    ];
    const CLIP = 4000;
    const UNDO_MS = 9000;

    /* ------------------------------------------------------------------ *
     * Styles
     * ------------------------------------------------------------------ */

    const STYLE_ID = "dsh-prompt-optimize-style";

    const CSS = `
.po-seat{display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 9px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:1;cursor:pointer;white-space:nowrap;transition:background .12s ease,color .12s ease,border-color .12s ease}
.po-seat:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.po-seat[data-open="true"]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3)}
.po-seat[disabled]{opacity:.55;cursor:default}
.po-dot{width:6px;height:6px;border-radius:999px;background:var(--dsw-alias-brand-primary);animation:po-pulse 1.1s ease-in-out infinite}
.po-panel{position:fixed;z-index:1200;display:flex;flex-direction:column;min-height:180px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:14px;box-shadow:0 18px 48px rgba(0,0,0,.18),0 2px 8px rgba(0,0,0,.08);overflow:hidden;font:inherit;animation:po-in .14s ease-out}
@keyframes po-in{from{opacity:0;transform:translateY(4px) scale(.995)}to{opacity:1;transform:none}}
@keyframes po-pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes po-spin{to{transform:rotate(360deg)}}
.po-head{display:flex;align-items:center;gap:8px;height:44px;padding:0 8px 0 12px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:none}
.po-title{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;letter-spacing:.01em;min-width:0}
.po-title span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.po-count{font-size:11px;font-weight:500;color:var(--dsw-alias-label-tertiary);border:1px solid var(--dsw-alias-border-l1);border-radius:999px;padding:1px 7px}
.po-spacer{flex:1}
.po-iconbtn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.po-iconbtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.po-iconbtn[disabled]{opacity:.4;cursor:default}
.po-iconbtn[data-active="true"]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.po-toolbar{display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:none}
.po-tabs{display:inline-flex;align-items:center;gap:2px;padding:2px;border-radius:9px;background:var(--dsw-alias-interactive-bg-hover);flex:none}
.po-tab{height:24px;padding:0 10px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
.po-tab[aria-selected="true"]{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);box-shadow:0 1px 2px rgba(0,0,0,.10)}
.po-tab[disabled]{opacity:.5;cursor:default}
.po-pick{display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 8px;margin-left:auto;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer;max-width:190px}
.po-pick:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.po-pick span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.po-body{flex:1;min-height:0;overflow:auto;padding:10px 12px 12px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin}
.po-body > *{flex:none}
.po-note{font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-tertiary);margin:0}
.po-banner{display:flex;align-items:flex-start;gap:7px;padding:8px 10px;border-radius:9px;border:1px solid color-mix(in srgb,var(--dsw-alias-state-error) 30%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error) 8%,transparent);color:var(--dsw-alias-state-error);font-size:12px;line-height:1.5}
.po-card{border:1px solid var(--dsw-alias-border-l1);border-radius:11px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}
.po-cardhead{display:flex;align-items:center;gap:6px;padding:7px 9px;min-height:34px}
.po-cardtitle{font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary);display:flex;align-items:center;gap:6px;min-width:0;flex:none}
.po-cardtitle span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.po-meta{font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.po-chip{display:inline-flex;align-items:center;gap:4px;height:20px;padding:0 7px;border-radius:999px;font-size:11px;line-height:1;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-interactive-bg-hover);white-space:nowrap}
.po-chip[data-tone="warn"]{color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 10%,transparent)}
.po-text{margin:0;padding:0 10px 10px;white-space:pre-wrap;word-break:break-word;font-size:12.5px;line-height:1.62;color:var(--dsw-alias-label-primary);font-family:inherit}
.po-rich{padding:0 10px 10px;font-size:12.5px;line-height:1.62;color:var(--dsw-alias-label-primary)}
.po-rich p{margin:0 0 6px;white-space:pre-wrap;word-break:break-word}
.po-rich p:last-child{margin-bottom:0}
.po-rich h3,.po-rich h4,.po-rich h5,.po-rich h6{margin:9px 0 4px;font-size:12.5px;font-weight:600;line-height:1.45}
.po-rich h3:first-child,.po-rich h4:first-child,.po-rich h5:first-child{margin-top:0}
.po-rich ul,.po-rich ol{margin:0 0 6px;padding-left:18px}
.po-rich li{margin:2px 0;white-space:pre-wrap;word-break:break-word}
.po-rich strong{font-weight:600}
.po-rich code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.92em;padding:1px 4px;border-radius:4px;background:var(--dsw-alias-interactive-bg-hover)}
.po-rich hr{border:0;border-top:1px solid var(--dsw-alias-border-l1);margin:9px 0}
.po-text[data-muted="true"]{color:var(--dsw-alias-label-secondary)}
.po-caret{display:inline-block;width:2px;height:1em;margin-left:1px;vertical-align:-2px;background:var(--dsw-alias-brand-primary);animation:po-blink 1s step-end infinite}
@keyframes po-blink{50%{opacity:0}}
.po-field{display:flex;flex-direction:column;gap:5px}
.po-label{font-size:11.5px;font-weight:500;color:var(--dsw-alias-label-secondary)}
.po-input{width:100%;box-sizing:border-box;min-height:56px;max-height:160px;resize:vertical;padding:8px 9px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;line-height:1.5;outline:none}
.po-input:focus{border-color:var(--dsw-alias-brand-primary)}
.po-input::placeholder{color:var(--dsw-alias-label-tertiary)}
.po-hint{font-size:11px;color:var(--dsw-alias-label-tertiary)}
.po-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;padding:26px 16px;text-align:center}
.po-empty svg{color:var(--dsw-alias-label-tertiary);opacity:.8}
.po-empty strong{font-size:12.5px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.po-empty p{margin:0;font-size:11.5px;line-height:1.55;color:var(--dsw-alias-label-tertiary);max-width:300px}
.po-foot{display:flex;align-items:center;gap:6px;padding:8px 10px;border-top:1px solid var(--dsw-alias-border-l1);flex:none;flex-wrap:wrap}
.po-foot .po-meta{flex:1;min-width:80px}
.po-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;height:28px;padding:0 11px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
.po-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}
.po-btn[disabled]{opacity:.45;cursor:default;background:transparent}
.po-btn[data-variant="primary"]{background:var(--dsw-alias-button-primary-fill);border-color:transparent;color:var(--dsw-alias-label-primary-foreground,#fff)}
.po-btn[data-variant="primary"]:hover{background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-button-primary-fill));opacity:.92}
.po-btn[data-variant="ghost"]{border-color:transparent;color:var(--dsw-alias-label-secondary)}
.po-btn[data-variant="ghost"]:hover{color:var(--dsw-alias-label-primary)}
.po-menu{position:absolute;z-index:1300;min-width:250px;max-width:min(360px,calc(100vw - 32px));max-height:320px;overflow:auto;padding:5px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1);box-shadow:0 14px 36px rgba(0,0,0,.18);animation:po-in .12s ease-out}
.po-menugroup{padding:6px 8px 3px;font-size:10.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}
.po-menuitem{display:flex;align-items:flex-start;gap:8px;width:100%;box-sizing:border-box;padding:7px 8px;border:0;border-radius:7px;background:transparent;text-align:left;color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer}
.po-menuitem:hover{background:var(--dsw-alias-interactive-bg-hover)}
.po-menuitem[data-checked="true"]{background:var(--dsw-alias-interactive-bg-hover)}
.po-menuitem .po-mi{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.po-menuitem strong{font-size:12px;font-weight:600;display:flex;align-items:center;gap:5px}
.po-menuitem small{font-size:11px;line-height:1.4;color:var(--dsw-alias-label-tertiary);white-space:normal}
.po-menucheck{flex:none;width:14px;color:var(--dsw-alias-brand-primary);margin-top:2px}
.po-diff{border-top:1px solid var(--dsw-alias-border-l1);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;line-height:1.55}
.po-row{display:flex;gap:8px;padding:1px 10px;white-space:pre-wrap;word-break:break-word}
.po-row[data-t="add"]{background:color-mix(in srgb,var(--dsw-alias-state-success) 11%,transparent)}
.po-row[data-t="del"]{background:color-mix(in srgb,var(--dsw-alias-state-error) 10%,transparent)}
.po-row[data-t="gap"]{color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-interactive-bg-hover);font-family:inherit;font-size:10.5px;padding:2px 10px}
.po-sign{flex:none;width:10px;color:var(--dsw-alias-label-tertiary);user-select:none}
.po-cols{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--dsw-alias-border-l1);border-top:1px solid var(--dsw-alias-border-l1)}
.po-col{background:var(--dsw-alias-bg-layer-1);min-width:0}
.po-colhead{display:flex;align-items:center;justify-content:space-between;padding:6px 9px;font-size:11px;font-weight:600;color:var(--dsw-alias-label-secondary);border-bottom:1px solid var(--dsw-alias-border-l1)}
.po-col .po-text{max-height:min(46vh,420px);overflow:auto;padding:8px 9px;font-size:12px}
.po-history{display:flex;flex-direction:column;gap:6px}
.po-hrow{border:1px solid var(--dsw-alias-border-l1);border-radius:9px;overflow:hidden}
.po-hhead{display:flex;align-items:center;gap:7px;width:100%;box-sizing:border-box;padding:8px 9px;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.po-hhead:hover{background:var(--dsw-alias-interactive-bg-hover)}
.po-hmain{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.po-hline{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--dsw-alias-label-tertiary)}
.po-hsnippet{font-size:12px;color:var(--dsw-alias-label-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.po-ver{flex:none;font-size:10.5px;font-weight:600;color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l1);border-radius:5px;padding:1px 4px}
.po-hbody{border-top:1px solid var(--dsw-alias-border-l1);padding:8px 9px;display:flex;flex-direction:column;gap:7px}
.po-hblock{display:flex;flex-direction:column;gap:3px}
.po-hblock label{font-size:10.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}
.po-hblock p{margin:0;font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-secondary);white-space:pre-wrap;max-height:88px;overflow:auto}
.po-hactions{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.po-chips{display:flex;flex-wrap:wrap;gap:5px;padding:0 10px 10px}
.po-varchip{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-interactive-bg-hover);font-size:11px;max-width:100%}
.po-varchip code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--dsw-alias-brand-primary)}
.po-varchip em{font-style:normal;color:var(--dsw-alias-label-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}
.po-seg{display:inline-flex;align-items:center;gap:2px;padding:2px;border-radius:8px;background:var(--dsw-alias-interactive-bg-hover)}
.po-toast{position:fixed;z-index:1400;left:50%;bottom:26px;transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:8px 10px 8px 14px;border-radius:10px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);box-shadow:0 10px 30px rgba(0,0,0,.16);font-size:12px;color:var(--dsw-alias-label-primary);animation:po-in .14s ease-out}
.po-toast button{height:24px;padding:0 9px;border:0;border-radius:6px;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer}
.po-toast button:hover{background:var(--dsw-alias-interactive-bg-active)}
.po-vtabs{display:inline-flex;align-items:center;gap:2px;padding:2px;border-radius:8px;background:var(--dsw-alias-interactive-bg-hover);flex:none}
.po-vtab{height:22px;padding:0 8px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:4px}
.po-vtab[aria-selected="true"]{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);box-shadow:0 1px 2px rgba(0,0,0,.10)}
.po-vtab b{font-weight:700}
.po-check{padding:0 0 2px}
.po-scoreline{display:flex;align-items:baseline;gap:6px;padding:2px 10px 0}
.po-score{font-size:22px;font-weight:700;letter-spacing:-.02em;line-height:1.1;color:var(--dsw-alias-label-primary)}
.po-score small{font-size:11px;font-weight:500;color:var(--dsw-alias-label-tertiary);margin-left:2px}
.po-dims{display:grid;grid-template-columns:1fr 1fr;gap:5px 10px;padding:8px 10px}
.po-dim{display:flex;flex-direction:column;gap:3px;min-width:0}
.po-dimhead{display:flex;align-items:center;justify-content:space-between;font-size:10.5px;color:var(--dsw-alias-label-secondary);gap:6px}
.po-dimhead span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.po-bar{height:4px;border-radius:999px;background:var(--dsw-alias-interactive-bg-hover);overflow:hidden}
.po-bar i{display:block;height:100%;border-radius:999px;background:var(--dsw-alias-brand-primary)}
.po-bar[data-tone="low"] i{background:var(--dsw-alias-state-error)}
.po-bar[data-tone="mid"] i{background:var(--dsw-alias-state-business-primary)}
.po-issues{display:flex;flex-direction:column;border-top:1px solid var(--dsw-alias-border-l1)}
.po-issue{padding:8px 10px;display:flex;flex-direction:column;gap:4px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.po-issue:last-child{border-bottom:0}
.po-issuehead{display:flex;align-items:center;gap:6px;min-width:0}
.po-issuehead strong{font-size:12px;font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.po-sev{flex:none;font-size:10px;font-weight:600;padding:1px 6px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary)}
.po-sev[data-sev="high"]{color:var(--dsw-alias-state-error);border-color:color-mix(in srgb,var(--dsw-alias-state-error) 40%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error) 8%,transparent)}
.po-sev[data-sev="medium"]{color:var(--dsw-alias-state-business-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 40%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 8%,transparent)}
.po-quote{margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:1.5;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-interactive-bg-hover);border-radius:6px;padding:4px 6px;white-space:pre-wrap;word-break:break-word;max-height:86px;overflow:auto}
.po-fix{margin:0;font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-primary)}
.po-fix small{display:block;font-size:10.5px;color:var(--dsw-alias-label-tertiary);margin-top:2px}
@media (prefers-reduced-motion:reduce){.po-panel,.po-menu,.po-toast{animation:none}.po-dot,.po-caret{animation:none}}
`;

    function ensureStyle() {
      if (!document.getElementById(STYLE_ID)) {
        const element = document.createElement("style");
        element.id = STYLE_ID;
        element.textContent = CSS;
        document.head.appendChild(element);
      }
    }

    /* ------------------------------------------------------------------ *
     * Icons — stroke-only, 24 grid
     * ------------------------------------------------------------------ */

    const PATHS = {
      spark: "M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9z",
      chevronDown: "m6 9 6 6 6-6",
      chevronLeft: "m15 6-6 6 6 6",
      x: "M6 6l12 12M18 6 6 18",
      clock: "M12 7v5l3 2",
      copy: "M9 9h10v10H9zM5 15V5h10",
      check: "m5 13 4 4L19 7",
      stop: "M7 7h10v10H7z",
      refresh: "M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5",
      send: "M4.5 12 20 4l-5.5 16-2.4-6.6z",
      braces: "M9 4c-2 0-2 2.5-2 4s-.6 3-2 3c1.4 0 2 1.5 2 3s0 4 2 4M15 4c2 0 2 2.5 2 4s.6 3 2 3c-1.4 0-2 1.5-2 3s0 4-2 4",
      columns: "M4 5h7v14H4zM13 5h7v14h-7z",
      alert: "M12 4 3 20h18zM12 10v5M12 17.6v.4",
      trash: "M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13",
      arrowRight: "M4 12h15m-6-6 6 6-6 6",
      plus: "M12 5v14M5 12h14",
      lock: "M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5z",
    };

    function Icon({ name, size = 14, className }) {
      const children = [];
      if (name === "clock") children.push(h("circle", { key: "c", cx: 12, cy: 12, r: 8.2 }));
      if (name === "alert") children.push(h("path", { key: "p", d: PATHS.alert, strokeLinejoin: "round" }));
      else children.push(h("path", { key: "p", d: PATHS[name] ?? PATHS.spark, strokeLinecap: "round", strokeLinejoin: "round" }));
      if (name === "stop") children.push(h("path", { key: "f", d: PATHS.stop, fill: "currentColor", stroke: "none" }));
      return h("svg", {
        viewBox: "0 0 24 24",
        width: size,
        height: size,
        className,
        "aria-hidden": true,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.7,
        style: { flex: "none", display: "block" },
      }, children);
    }

    /* ------------------------------------------------------------------ *
     * Copy
     * ------------------------------------------------------------------ */

    const EN = {
      "提示词优化": "Prompt optimizer",
      "提示词": "Prompt",
      "迭代优化": "Iterate",
      "优化结果": "Result",
      "生成中": "Writing",
      "原稿": "Source",
      "展开": "Expand",
      "收起": "Collapse",
      "复制": "Copy",
      "已复制": "Copied",
      "复制结果": "Copy result",
      "替换草稿": "Replace draft",
        "已替换草稿 · 9 秒内可撤销": "Draft replaced · undo for 9s",
      "发送": "Send",
      "停止": "Stop",
      "重试": "Retry",
      "撤销": "Undo",
      "关闭": "Close",
      "返回": "Back",
      "优化历史": "History",
      "版本对比": "Compare versions",
      "清空": "Clear",
      "删除": "Delete",
      "写回": "Use version",
      "对比版本": "Compare",
      "跟随当前模型": "Follow current model",
      "模板": "Template",
      "模型": "Model",
      "草稿已更新": "Draft changed",
      "模板已切换": "Template changed",
      "用新模板重跑": "Rerun with template",
      "开始迭代": "Iterate",
      "想在这一版上改什么？": "What should change in this version?",
      "例如：把语气改得更直接，删掉示例。": "For example: make the tone more direct, drop the examples.",
      "在输入框写点内容，打开后会自动优化": "Write a draft first, then open this panel.",
      "正在准备…": "Preparing…",
      "输入框还是空的": "The composer is empty",
      "写完草稿再打开，这里会给出更清楚的版本。": "Write a draft, then reopen this panel for a clearer version.",
      "确认替换草稿": "Replace the draft?",
      "替换后 9 秒内可撤销": "You can undo for 9 seconds after replacing.",
      "取消": "Cancel",
      "可参数化片段": "Reusable placeholders",
      "写回模板": "Apply template",
      "写回后仍可继续编辑": "Applied to the draft; keep editing from there.",
      "位置对不上，无法套用": "The spans no longer line up, so the template was not applied.",
      "抽取中…": "Extracting…",
      "抽取变量": "Extract placeholders",
      "保留优化记录？": "Keep a local history?",
      "记录只留在这台电脑，不会上传。": "Records stay on this computer and are never uploaded.",
      "不保留": "Don't keep",
      "保留": "Keep",
      "要不要留着优化记录？": "Turn on local history?",
      "历史记录已关闭，可随时重新开启。": "History is off. You can turn it back on anytime.",
      "开启历史": "Turn on history",
      "还没有记录": "No records yet",
      "每完成一次优化，这里会留一份。": "Each finished rewrite leaves one here.",
      "结构变化（本机分析）": "Structural change (local analysis)",
      "原稿为空": "The source is empty",
      "草稿为空": "The draft is empty",
      "没有可对比的版本": "No version to compare",
      "替换": "Replace",
      "保存": "Save",
      "个变量": "placeholders",
      "版本": "v",
      "只改你指出的地方": "Only change what you point at",
      "刚刚": "just now",
      "昨天": "Yesterday",
      "分钟前": "min ago",
      "小时前": "h ago",
      "字": "chars",
      "重试一次": "Try again",
      "模型没有返回内容": "The model returned nothing",
      "已替换": "Replaced",
      "优化中": "Optimizing",
      "清空历史": "Clear history",
      "确认清空": "Confirm clear",
      "行未显示": "lines hidden",
      "适合": "Good for",
      "写一句修改意见再开始。": "Add a note about what should change.",
      "删除这条": "Delete this record",
      "历史只存在本机": "History lives on this device",
      "再来一次": "Run again",
      "原样保留": "kept as-is",
      "新增": "added",
      "删除行": "removed",
      "结构": "structure",
      "目标": "goal",
      "约束": "constraints",
      "格式": "format",
      "示例": "examples",
      "步骤": "steps",
      "边界": "limits",
      "验收": "acceptance",
      "体检": "Checkup",
      "重新体检": "Re-check",
      "体检中…": "Checking…",
      "提示词体检": "Prompt checkup",
      "体检失败": "Checkup failed",
      "综合分": "Overall",
      "清晰度": "Clarity",
      "上下文": "Context",
      "输出格式": "Format",
      "约束": "Constraints",
      "示例": "Examples",
      "鲁棒性": "Robustness",
      "高": "High",
      "中": "Medium",
      "低": "Low",
      "未发现问题": "No issues found",
      "这版已经没什么可挑的。": "Nothing worth flagging in this version.",
      "条建议，可直接替换": "fixes, applied in place",
      "应用": "Apply",
      "已应用": "Applied",
      "位置已变，无法直接套用": "The quote moved, so this fix cannot be applied directly",
      "体检只读，不改动草稿": "The checkup is read-only",
      "再来一版": "Another version",
      "上一版": "Previous",
      "最新": "Latest",
      "两版对比": "Two versions",
      "本机分析": "local analysis",
      "自定义": "Custom",
      "新建自定义模板": "New custom template",
      "写好要求，以后一键复用": "Write the instruction once, reuse it later",
      "自定义模板": "Custom template",
      "模板名称": "Template name",
      "例如：客服口吻": "e.g. Support-agent tone",
      "改写要求": "Rewrite instruction",
      "例如：把语气改成客服口吻，结尾加一句道歉，不要超过 150 字。": "e.g. Use a support-agent tone, end with an apology, keep it under 150 words.",
      "适用对象": "Applies to",
      "保存": "Save",
      "导入 JSON": "Import JSON",
      "导出全部": "Export all",
      "写一句改写要求再保存。": "Write an instruction before saving.",
      "这个文件里没有可导入的模板。": "This file has no templates to import.",
      "导入失败": "Import failed",
      "自定义模板只保存在这台浏览器里，不会上传。": "Custom templates stay in this browser; nothing is uploaded.",
    };

    function detectEnglish() {
      const lang = document.documentElement?.lang || navigator.language || "";
      return /^en(\b|-)/i.test(String(lang));
    }

    function useEnglish() {
      const [english, setEnglish] = useState(detectEnglish);
      useEffect(() => {
        const read = () => setEnglish(detectEnglish());
        const observer = typeof MutationObserver === "function"
          ? new MutationObserver(read)
          : null;
        observer?.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
        return () => observer?.disconnect();
      }, []);
      return english;
    }

    function makeT(english) {
      return (text) => (english ? EN[text] ?? text : text);
    }

    function pick(row, base, english) {
      if (!row) return "";
      const value = english ? row[`${base}En`] : row[base];
      return typeof value === "string" && value.length > 0 ? value : row[base] ?? "";
    }

    /* ------------------------------------------------------------------ *
     * Small pure helpers
     * ------------------------------------------------------------------ */

    function copyText(text) {
      if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
      return new Promise((resolve, reject) => {
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        try {
          document.execCommand("copy") ? resolve() : reject(new Error("copy failed"));
        } finally {
          area.remove();
        }
      });
    }

    function countChars(text) {
      return Array.from(String(text ?? "")).length;
    }

    function shortNumber(value) {
      return Number(value).toLocaleString();
    }

    function usageLabel(usage) {
      if (!usage || typeof usage.inputTokens !== "number") return "";
      const input = usage.inputTokens;
      const output = typeof usage.outputTokens === "number" ? usage.outputTokens : 0;
      return `${shortNumber(input)} → ${shortNumber(output)} tok`;
    }

    function secondsLabel(ms) {
      if (!ms || ms < 0) return "";
      return `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)}s`;
    }

    function timeLabel(timestamp, english) {
      const then = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - then.getTime();
      if (diff < 60_000) return english ? "just now" : "刚刚";
      if (diff < 3_600_000) {
        const minutes = Math.floor(diff / 60_000);
        return english ? `${minutes} min ago` : `${minutes} 分钟前`;
      }
      const sameDay = then.toDateString() === now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const hhmm = `${String(then.getHours()).padStart(2, "0")}:${String(then.getMinutes()).padStart(2, "0")}`;
      if (sameDay) return hhmm;
      if (then.toDateString() === yesterday.toDateString()) return english ? `Yesterday ${hhmm}` : `昨天 ${hhmm}`;
      return english
        ? `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][then.getMonth()]} ${then.getDate()}`
        : `${then.getMonth() + 1} 月 ${then.getDate()} 日`;
    }

    function clip(text) {
      const value = String(text ?? "");
      return value.length > CLIP ? `${value.slice(0, CLIP)}…` : value;
    }

    /* ------------------------------------------------------------------ *
     * Line diff
     * ------------------------------------------------------------------ */

    function splitLines(text) {
      return String(text ?? "").replace(/\r\n?/g, "\n").split("\n");
    }

    /**
     * Line-level LCS. Above the cap the diff degrades to "everything replaced",
     * which is honest about what was not compared.
     */
    function diffLines(before, after) {
      const a = splitLines(before);
      const b = splitLines(after);
      if (a.length > 400 || b.length > 400) {
        return [
          ...a.map((text) => ({ t: "del", text })),
          ...b.map((text) => ({ t: "add", text })),
        ];
      }
      const rows = [];
      const table = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
      for (let i = a.length - 1; i >= 0; i -= 1) {
        for (let j = b.length - 1; j >= 0; j -= 1) {
          table[i][j] = a[i] === b[j]
            ? table[i + 1][j + 1] + 1
            : Math.max(table[i + 1][j], table[i][j + 1]);
        }
      }
      let i = 0;
      let j = 0;
      while (i < a.length && j < b.length) {
        if (a[i] === b[j]) {
          rows.push({ t: "same", text: a[i] });
          i += 1;
          j += 1;
        } else if (table[i + 1][j] >= table[i][j + 1]) {
          rows.push({ t: "del", text: a[i] });
          i += 1;
        } else {
          rows.push({ t: "add", text: b[j] });
          j += 1;
        }
      }
      while (i < a.length) rows.push({ t: "del", text: a[i++] });
      while (j < b.length) rows.push({ t: "add", text: b[j++] });
      return rows;
    }

    /** Keep `context` unchanged lines around each change, fold the rest. */
    function collapseDiff(rows, context = 2) {
      const keep = new Array(rows.length).fill(false);
      rows.forEach((row, index) => {
        if (row.t === "same") return;
        for (let at = Math.max(0, index - context); at <= Math.min(rows.length - 1, index + context); at += 1) {
          keep[at] = true;
        }
      });
      const result = [];
      let skipped = 0;
      rows.forEach((row, index) => {
        if (keep[index]) {
          if (skipped > 0) {
            result.push({ t: "gap", text: `${skipped}` });
            skipped = 0;
          }
          result.push(row);
        } else {
          skipped += 1;
        }
      });
      if (skipped > 0) result.push({ t: "gap", text: `${skipped}` });
      return result;
    }

    const STRUCTURE_MARKERS = [
      { label: "目标", labelEn: "goal", pattern: /目标|目的|goal|objective|task/i },
      { label: "约束", labelEn: "constraints", pattern: /约束|限制|不得|禁止|constraint|must not|limit/i },
      { label: "格式", labelEn: "format", pattern: /格式|输出为|JSON|Markdown|format|output/i },
      { label: "示例", labelEn: "examples", pattern: /示例|例如|样例|example|e\.g\./i },
      { label: "步骤", labelEn: "steps", pattern: /步骤|第一步|step\s*1|first,|then,|流程/i },
      { label: "边界", labelEn: "limits", pattern: /边界|例外|如果|edge case|exception|fallback/i },
      { label: "验收", labelEn: "acceptance", pattern: /验收|完成标准|检查项|acceptance|done when/i },
    ];

    /** Compare the structure of two prompts without calling a model. */
    function analyzeChange(before, after) {
      const a = String(before ?? "");
      const b = String(after ?? "");
      const rows = diffLines(a, b);
      const gained = [];
      const lost = [];
      for (const marker of STRUCTURE_MARKERS) {
        const had = marker.pattern.test(a);
        const has = marker.pattern.test(b);
        if (has && !had) gained.push(marker);
        if (had && !has) lost.push(marker);
      }
      return {
        beforeChars: countChars(a),
        afterChars: countChars(b),
        added: rows.filter((row) => row.t === "add").length,
        removed: rows.filter((row) => row.t === "del").length,
        gained,
        lost,
      };
    }

    /* ------------------------------------------------------------------ *
     * Local history store
     * ------------------------------------------------------------------ */

    function emptyStore() {
      return { version: 1, consent: "unknown", entries: [] };
    }

    function normalizeEntry(raw) {
      if (!raw || typeof raw !== "object" || typeof raw.id !== "string" || typeof raw.output !== "string") return null;
      return {
        id: raw.id,
        rootId: typeof raw.rootId === "string" && raw.rootId.length > 0 ? raw.rootId : raw.id,
        parentId: typeof raw.parentId === "string" ? raw.parentId : "",
        at: typeof raw.at === "number" ? raw.at : Date.now(),
        mode: raw.mode === "iterate" ? "iterate" : "user",
        template: typeof raw.template === "string" ? raw.template : "",
        templateId: typeof raw.templateId === "string" ? raw.templateId : "",
        model: typeof raw.model === "string" ? raw.model : "",
        input: typeof raw.input === "string" ? raw.input : "",
        output: raw.output,
        usage: raw.usage && typeof raw.usage === "object" ? raw.usage : null,
        elapsedMs: typeof raw.elapsedMs === "number" ? raw.elapsedMs : 0,
      };
    }

    function loadStore() {
      try {
        const text = localStorage.getItem(HISTORY_KEY);
        if (!text) return emptyStore();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          return { version: 1, consent: "yes", entries: parsed.map(normalizeEntry).filter(Boolean) };
        }
        if (!parsed || typeof parsed !== "object") return emptyStore();
        const consent = parsed.consent === "yes" || parsed.consent === "no" ? parsed.consent : "unknown";
        const entries = Array.isArray(parsed.entries) ? parsed.entries.map(normalizeEntry).filter(Boolean) : [];
        return { version: 1, consent, entries: entries.slice(0, HISTORY_MAX) };
      } catch {
        return emptyStore();
      }
    }

    function persist(store) {
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify({
          version: 1,
          consent: store.consent,
          entries: store.entries.slice(0, HISTORY_MAX),
        }));
      } catch {
        // A full or disabled storage must not break the panel.
      }
    }

    /* ------------------------------------------------------------------ *
     * Custom templates (local to this browser)
     * ------------------------------------------------------------------ */

    function normalizeCustom(raw) {
      if (!raw || typeof raw !== "object") return null;
      const instruction = typeof raw.instruction === "string" ? raw.instruction.trim().slice(0, 2000) : "";
      if (instruction.length === 0) return null;
      const label = typeof raw.label === "string" && raw.label.trim().length > 0
        ? raw.label.trim().slice(0, 60)
        : instruction.slice(0, 24);
      return {
        id: typeof raw.id === "string" && raw.id.length > 0
          ? raw.id
          : `c-${Math.random().toString(36).slice(2, 10)}`,
        label,
        instruction,
        mode: raw.mode === "iterate" ? "iterate" : "user",
      };
    }

    function loadCustoms() {
      try {
        const text = localStorage.getItem(CUSTOM_KEY);
        if (!text) return [];
        const parsed = JSON.parse(text);
        const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.templates) ? parsed.templates : [];
        return rows.map(normalizeCustom).filter(Boolean).slice(0, 40);
      } catch {
        return [];
      }
    }

    function persistCustoms(rows) {
      try {
        localStorage.setItem(CUSTOM_KEY, JSON.stringify({ version: 1, templates: rows }));
      } catch {
        // Custom templates are a convenience; a full storage keeps the panel usable.
      }
    }

    function customToRow(entry) {
      return {
        id: entry.id,
        mode: entry.mode,
        category: CUSTOM_CATEGORY,
        label: entry.label,
        labelEn: entry.label,
        description: entry.instruction,
        descriptionEn: entry.instruction,
        useWhen: "按你写的固定要求改写",
        useWhenEn: "Follows the instruction you saved",
        instruction: entry.instruction,
        custom: true,
      };
    }

    /** Oldest-first chain that shares a root id. */
    function chainOf(entries, rootId) {
      return entries
        .filter((entry) => entry.rootId === rootId)
        .slice()
        .sort((a, b) => a.at - b.at);
    }

    /** Drop one entry and re-parent its direct children onto its parent. */
    function dropEntry(store, id) {
      const target = store.entries.find((entry) => entry.id === id);
      if (!target) return store;
      const entries = store.entries
        .filter((entry) => entry.id !== id)
        .map((entry) => (entry.parentId === id ? { ...entry, parentId: target.parentId } : entry));
      return { ...store, entries };
    }

    /* ------------------------------------------------------------------ *
     * HTTP
     * ------------------------------------------------------------------ */

    let catalogCache = null;
    let catalogAt = 0;

    async function loadCatalog() {
      if (catalogCache && Date.now() - catalogAt < 30_000) return catalogCache;
      const response = await fetch(MODELS_ROUTE, { headers: { accept: "application/json" } });
      if (!response.ok) throw new Error(`无法读取模型目录（HTTP ${response.status}）。`);
      catalogCache = await response.json();
      catalogAt = Date.now();
      return catalogCache;
    }

    async function readError(response) {
      try {
        const payload = await response.json();
        if (payload && typeof payload.message === "string" && payload.message.length > 0) return payload.message;
      } catch {
        // Fall through to the status line.
      }
      return `请求失败（HTTP ${response.status}）。`;
    }

    /**
     * POST one optimize request and turn its NDJSON body into callbacks.
     * Resolves with the final `done` payload.
     */
    async function streamOptimize(body, onDelta, signal) {
      const response = await fetch(OPTIMIZE_ROUTE, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/x-ndjson" },
        body: JSON.stringify(body),
        signal,
      });
      if (!response.ok) throw new Error(await readError(response));
      if (!response.body) throw new Error("这个浏览器不支持流式响应。");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let final = null;
      let failure = null;

      const handle = (line) => {
        if (!line.trim()) return;
        let message;
        try {
          message = JSON.parse(line);
        } catch {
          return;
        }
        if (message.type === "delta" && typeof message.text === "string") onDelta(message.text);
        else if (message.type === "done") final = message;
        else if (message.type === "error") failure = message.message || "模型调用失败。";
      };

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let at;
        while ((at = buffer.indexOf("\n")) >= 0) {
          handle(buffer.slice(0, at));
          buffer = buffer.slice(at + 1);
        }
      }
      buffer += decoder.decode();
      if (buffer.trim().length > 0) handle(buffer);
      if (failure) throw new Error(failure);
      if (!final) throw new Error("连接提前结束了，没有收到完整结果。");
      return final;
    }

    /** POST JSON to one of the JSON routes; a failed status becomes its message. */
    async function postJson(route, body, signal) {
      const response = await fetch(route, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(body),
        signal,
      });
      if (!response.ok) throw new Error(await readError(response));
      return response.json();
    }

    /* ------------------------------------------------------------------ *
     * Component
     * ------------------------------------------------------------------ */

    const EMPTY_CATALOG = {
      current: null,
      groups: [],
      modes: [
        { id: "user", label: "提示词", labelEn: "Prompt" },
        { id: "iterate", label: "迭代优化", labelEn: "Iterate" },
      ],
      templates: [],
      defaults: { user: "", iterate: "" },
      extraction: true,
    };

    function parsePin(value) {
      if (typeof value !== "string" || value.length === 0) return null;
      const at = value.indexOf("/");
      if (at <= 0 || at === value.length - 1) return null;
      return { provider: value.slice(0, at), model: value.slice(at + 1) };
    }

    function readPin() {
      try {
        return localStorage.getItem(PIN_KEY) ?? "";
      } catch {
        return "";
      }
    }

    function writePin(value) {
      try {
        if (value) localStorage.setItem(PIN_KEY, value);
        else localStorage.removeItem(PIN_KEY);
      } catch {
        // Persisting the pin is a convenience, never a requirement.
      }
    }

    function templatesForMode(catalog, mode) {
      const rows = catalog?.templates ?? [];
      return mode === "iterate" ? rows.filter((row) => row.mode === "iterate") : rows.filter((row) => row.mode === "user");
    }

    function modelLabel(catalog, pin) {
      const parsed = parsePin(pin);
      if (!parsed) return "";
      for (const group of catalog?.groups ?? []) {
        if (group.provider !== parsed.provider) continue;
        const model = group.models.find((entry) => entry.id === parsed.model);
        return model?.name ?? parsed.model;
      }
      return parsed.model;
    }

    const INLINE_MARK = /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`)/g;

    function inlineMarkup(text, keyPrefix) {
      const nodes = [];
      let rest = 0;
      let index = 0;
      for (const match of String(text).matchAll(INLINE_MARK)) {
        if (match.index > rest) nodes.push(text.slice(rest, match.index));
        const token = match[0];
        if (token.startsWith("`")) {
          nodes.push(h("code", { key: `${keyPrefix}-c${index}` }, token.slice(1, -1)));
        } else {
          nodes.push(h("strong", { key: `${keyPrefix}-b${index}` }, token.slice(2, -2)));
        }
        rest = match.index + token.length;
        index += 1;
      }
      if (rest < text.length) nodes.push(text.slice(rest));
      return nodes;
    }

    /**
     * Render the small Markdown subset the optimizer itself asks models to
     * produce (headings, bullets, bold, inline code). Anything else stays
     * literal text; the raw string is what gets copied or written back.
     */
    function renderMarkup(text, keyPrefix) {
      const prefix = keyPrefix || "mk";
      const lines = String(text ?? "").split("\n");
      const blocks = [];
      let items = null;
      const flush = () => {
        if (!items) return;
        blocks.push(h(items.ordered ? "ol" : "ul", { key: `${prefix}-l${blocks.length}` },
          items.rows.map((row, at) => h("li", { key: `${prefix}-i${at}` }, inlineMarkup(row, `${prefix}-i${at}`)))));
        items = null;
      };
      lines.forEach((line, at) => {
        const key = `${prefix}-${at}`;
        if (/^\s*$/.test(line)) { flush(); return; }
        if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) { flush(); blocks.push(h("hr", { key })); return; }
        const heading = /^\s{0,3}(#{1,6})\s+(.*)$/.exec(line);
        if (heading) {
          flush();
          const level = Math.min(6, heading[1].length + 2);
          blocks.push(h(`h${level}`, { key }, inlineMarkup(heading[2], key)));
          return;
        }
        const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
        const ordered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
        if (bullet || ordered) {
          const next = { ordered: Boolean(ordered), rows: [] };
          if (items && items.ordered === next.ordered) next.rows = items.rows;
          else flush();
          next.rows.push((bullet || ordered)[1]);
          items = next;
          return;
        }
        flush();
        blocks.push(h("p", { key }, inlineMarkup(line, key)));
      });
      flush();
      return blocks;
    }

    function Button({ children, variant, disabled, onClick, title, icon, ...rest }) {
      return h("button", {
        type: "button",
        className: "po-btn",
        "data-variant": variant,
        disabled,
        onClick,
        title,
        ...rest,
      }, icon ? h(Icon, { name: icon, size: 13 }) : null, children);
    }

    /** One row in the model, version or template menu. */
    function menuRow({ key, checked, icon, onClick, title, notes = [] }) {
      const mark = icon ?? (checked ? "check" : null);
      return h("button", {
        key,
        type: "button",
        className: "po-menuitem",
        ...(checked === undefined ? {} : { "data-checked": checked ? "true" : "false" }),
        onClick,
      },
        h("span", { className: "po-menucheck" }, mark ? h(Icon, { name: mark, size: 12 }) : null),
        h("span", { className: "po-mi" },
          h("strong", null, title),
          ...notes.map((note, index) => h("small", { key: index }, note)),
        ),
      );
    }

    function IconButton({ name, label, onClick, disabled, active, size = 14 }) {
      return h("button", {
        type: "button",
        className: "po-iconbtn",
        "aria-label": label,
        title: label,
        "data-active": active ? "true" : undefined,
        disabled,
        onClick,
      }, h(Icon, { name, size }));
    }

    function pruneEntries(entries) {
      let list = entries.slice().sort((a, b) => b.at - a.at);
      while (list.length > HISTORY_MAX) {
        const oldest = list[list.length - 1];
        const chain = list.filter((entry) => entry.rootId === oldest.rootId);
        list = chain.length > 1 ? list.filter((entry) => entry.rootId !== oldest.rootId) : list.slice(0, -1);
      }
      return list;
    }

    function withEntry(store, entry) {
      return { ...store, entries: pruneEntries([entry, ...store.entries]) };
    }

    function PromptOptimizer(props) {
      ensureStyle();
      const english = useEnglish();
      const T = useMemo(() => makeT(english), [english]);

      const useInput = props.useInput;
      const inputActions = props.inputActions;
      const sessionId = typeof props.sessionId === "string" ? props.sessionId : "";
      const draft = typeof useInput === "function" ? useInput((state) => state?.draft ?? "") : "";
      const draftRef = useRef(draft);
      draftRef.current = typeof draft === "string" ? draft : "";
      const resultRef = useRef("");

      const [open, setOpen] = useState(false);
      const [view, setView] = useState("run");
      const [mode, setMode] = useState("user");
      const [templateId, setTemplateId] = useState("");
      const [feedback, setFeedback] = useState("");
      const [result, setResult] = useState("");
      const [status, setStatus] = useState("idle");
      const [error, setError] = useState("");
      const [modelUsed, setModelUsed] = useState("");
      const [anchor, setAnchor] = useState(null);
      const [pin, setPin] = useState(readPin);
      const [catalog, setCatalog] = useState(null);
      const [vars, setVars] = useState(null);
      const [extracting, setExtracting] = useState(false);
      const [usage, setUsage] = useState(null);
      const [elapsedMs, setElapsedMs] = useState(0);
      const [flash, setFlash] = useState("");
      const [menu, setMenu] = useState(null);
      const [openId, setOpenId] = useState("");
      const [store, setStore] = useState(loadStore);
      const [consentEntry, setConsentEntry] = useState(null);
      const [rootId, setRootId] = useState("");
      const [cmpId, setCmpId] = useState("");
      const [review, setReview] = useState(false);
      const [undoText, setUndoText] = useState("");
      const [copied, setCopied] = useState("");
      const [sourceOpen, setSourceOpen] = useState(false);
      const [usedSource, setUsedSource] = useState("");
      const [usedTemplateId, setUsedTemplateId] = useState("");
      const [clearArmed, setClearArmed] = useState(false);
      const [alt, setAlt] = useState(null);
      const [check, setCheck] = useState(null);
      const [checking, setChecking] = useState(false);
      const [checkError, setCheckError] = useState("");
      const [customs, setCustoms] = useState(loadCustoms);
      const [editForm, setEditForm] = useState(null);

      const seatRef = useRef(null);
      const panelRef = useRef(null);
      const abortRef = useRef(null);
      const extractRef = useRef(null);
      const checkRef = useRef(null);
      const timers = useRef(new Set());
      const autoSigRef = useRef("");
      const lastSigRef = useRef("");
      const carryRef = useRef("");
      const flushRef = useRef(0);
      const undoSeqRef = useRef(0);
      const storeRef = useRef(store);
      storeRef.current = store;
      const runRef = useRef(null);
      const runningRef = useRef(false);
      resultRef.current = result;

      const busy = status === "running";
      const panelCatalog = catalog ?? EMPTY_CATALOG;
      const customRows = customs.filter((entry) => entry.mode === mode).map(customToRow);
      const family = [...templatesForMode(panelCatalog, mode), ...customRows];
      const templateRow = family.find((row) => row.id === templateId) ?? family[0] ?? null;
      const sourceNow = mode === "iterate" ? result || draft : draft;
      const chain = chainOf(store.entries, rootId);
      const cmpEntry = chain.find((entry) => entry.id === cmpId) ?? chain[chain.length - 1] ?? null;

      const later = (fn, ms) => {
        const id = window.setTimeout(() => {
          timers.current.delete(id);
          fn();
        }, ms);
        timers.current.add(id);
        return id;
      };

      const place = useCallback(() => {
        const seat = seatRef.current?.getBoundingClientRect();
        if (!seat) return;
        // The composer grows upward, so anchoring to the seat would cover the
        // very draft the panel asks you to approve. Anchor to the top of the
        // composer's own textarea instead and let the panel take what is left.
        let top = seat.top;
        // Composer may be a textarea or a contenteditable editor, depending on
        // the DSH build; accept either as the top edge to sit above.
        const fields = document.querySelectorAll('textarea, [contenteditable="true"], [role="textbox"]');
        fields.forEach((field) => {
          if (panelRef.current?.contains(field)) return;
          const box = field.getBoundingClientRect();
          if (box.width < 120 || box.height < 18) return;
          if (box.top > seat.top - 4 || box.bottom < seat.top - 600) return;
          top = Math.min(top, box.top);
        });
        const width = Math.min(520, window.innerWidth - 24);
        const left = Math.max(12, Math.min(seat.right - width, window.innerWidth - width - 12));
        const maxHeight = Math.max(160, Math.min(window.innerHeight * 0.72, top - 16));
        setAnchor({ left, bottom: Math.max(12, window.innerHeight - top + 8), width, maxHeight });
      }, []);

      const close = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        checkRef.current?.abort();
        checkRef.current = null;
        setOpen(false);
        setMenu(null);
        setReview(false);
        setStatus((current) => (current === "running" ? "idle" : current));
      }, []);

      const openPanel = useCallback(() => {
        if (open) return;
        autoSigRef.current = "";
        setView("run");
        setReview(false);
        setError("");
        setOpen(true);
      }, [open]);

      useEffect(() => {
        let cancelled = false;
        loadCatalog()
          .then((value) => { if (!cancelled) setCatalog(value); })
          .catch(() => { if (!cancelled) setCatalog(EMPTY_CATALOG); });
        return () => { cancelled = true; };
      }, []);

      useEffect(() => {
        if (!catalog) return;
        if (family.length === 0) return;
        if (family.some((row) => row.id === templateId)) return;
        const preferred = catalog.defaults?.[mode];
        const fallback = family.some((row) => row.id === preferred) ? preferred : family[0].id;
        setTemplateId(fallback);
      }, [catalog, mode, templateId, family]);

      useEffect(() => {
        if (!open) return undefined;
        place();
        const onResize = () => place();
        window.addEventListener("resize", onResize);
        window.addEventListener("scroll", onResize, true);
        const onKey = (event) => {
          if (event.key !== "Escape") return;
          if (menu) { event.stopPropagation(); setMenu(null); return; }
          if (review) { event.stopPropagation(); setReview(false); return; }
          if (runningRef.current) {
            // Stop the stream but keep the panel and the partial text.
            event.stopPropagation();
            abortRef.current?.abort();
            return;
          }
          event.stopPropagation();
          close();
        };
        const onDown = (event) => {
          const target = event.target;
          if (!(target instanceof Node)) return;
          if (panelRef.current?.contains(target) || seatRef.current?.contains(target)) return;
          if (target instanceof Element && target.closest(".po-menu")) return;
          // Clicking into the composer to edit the draft must not throw away a
          // running rewrite or a pending diff review.
          if (runningRef.current || review) return;
          close();
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onDown);
        return () => {
          window.removeEventListener("resize", onResize);
          window.removeEventListener("scroll", onResize, true);
          document.removeEventListener("keydown", onKey);
          document.removeEventListener("mousedown", onDown);
        };
      }, [open, menu, review, place, close]);

      useEffect(() => () => {
        timers.current.forEach((id) => window.clearTimeout(id));
        abortRef.current?.abort();
        extractRef.current?.abort();
        checkRef.current?.abort();
      }, []);

      useEffect(() => {
        if (!open || view !== "run" || review || !catalog || mode === "iterate") return undefined;
        if (!String(draft ?? "").trim()) return undefined;
        if (autoSigRef.current === mode) return undefined;
        const id = window.setTimeout(() => {
          autoSigRef.current = mode;
          const signature = `${mode}|${templateId}|${draft}`;
          if (lastSigRef.current === signature && resultRef.current) return;
          runRef.current?.();
        }, 220);
        return () => window.clearTimeout(id);
      }, [open, view, review, catalog, mode, draft, templateId]);

      function recordEntry({ text, sourceText, template, elapsed, model, tokenUsage }) {
        const latest = storeRef.current.entries[0];
        if (latest && latest.input === clip(sourceText) && latest.output === clip(text)) return;
        const parent = mode === "iterate"
          ? storeRef.current.entries.find((entry) => entry.output === sourceText)
          : null;
        const entry = {
          id: `po-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          rootId: parent?.rootId ?? "",
          parentId: parent?.id ?? "",
          at: Date.now(),
          mode,
          template: pick(template, "label", english),
          templateId: template.id,
          model: typeof model === "string" ? model : "",
          input: clip(sourceText),
          output: clip(text),
          usage: tokenUsage ?? null,
          elapsedMs: elapsed,
        };
        if (!entry.rootId) entry.rootId = entry.id;
        if (storeRef.current.consent === "no") return;
        if (storeRef.current.consent === "unknown") {
          setConsentEntry(entry);
          return;
        }
        setStore((previous) => {
          const next = withEntry(previous, entry);
          persist(next);
          return next;
        });
      }

      async function run() {
        if (busy || runningRef.current) return;
        const currentDraft = draftRef.current;
        const sourceText = mode === "iterate" ? resultRef.current || currentDraft : currentDraft;
        if (!sourceText.trim()) {
          setError(T("输入框还是空的"));
          return;
        }
        if (mode === "iterate" && !feedback.trim()) {
          setError(T("写一句修改意见再开始。"));
          return;
        }
        const picked = family.find((row) => row.id === templateId) ?? family[0];
        if (!picked) {
          setError(T("正在准备…"));
          return;
        }

        const body = {
          optimizationMode: mode,
          targetPrompt: currentDraft || sourceText,
          templateId: picked.id,
        };
        if (picked.custom) body.customTemplate = { label: picked.label, instruction: picked.instruction };
        if (mode === "iterate") {
          body.lastOptimizedPrompt = sourceText;
          body.iterateInput = feedback.trim();
        }
        const pinned = parsePin(pin);
        if (pinned) {
          body.provider = pinned.provider;
          body.model = pinned.model;
        }
        if (sessionId) body.sessionId = sessionId;

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        runningRef.current = true;
        carryRef.current = "";
        const previous = resultRef.current;
        if (previous.trim().length > 0) {
          setAlt({ text: previous, model: modelUsed, usage, elapsedMs });
        }
        setStatus("running");
        setError("");
        setResult("");
        setVars(null);
        setCheck(null);
        setCheckError("");
        setUsage(null);
        setElapsedMs(0);
        setReview(false);
        setConsentEntry(null);
        setUsedSource(sourceText);
        setUsedTemplateId(picked.id);
        const started = performance.now();

        try {
          const final = await streamOptimize(body, (chunk) => {
            carryRef.current += chunk;
            if (flushRef.current) return;
            flushRef.current = later(() => {
              flushRef.current = 0;
              setResult(carryRef.current);
            }, 70);
          }, controller.signal);
          if (flushRef.current) {
            window.clearTimeout(flushRef.current);
            flushRef.current = 0;
          }
          const text = typeof final.text === "string" ? final.text : carryRef.current;
          const elapsed = Math.round(performance.now() - started);
          carryRef.current = text;
          setResult(text);
          setModelUsed(typeof final.model === "string" ? final.model : "");
          setUsage(final.usage ?? null);
          setElapsedMs(elapsed);
          setStatus("done");
          lastSigRef.current = `${mode}|${picked.id}|${sourceText}`;
          recordEntry({ text, sourceText, template: picked, elapsed, model: final.model, tokenUsage: final.usage });
        } catch (failure) {
          if (flushRef.current) {
            window.clearTimeout(flushRef.current);
            flushRef.current = 0;
          }
          if (controller.signal.aborted) {
            setResult(carryRef.current);
            setStatus(carryRef.current ? "done" : "idle");
            return;
          }
          setResult(carryRef.current);
          setStatus("error");
          setError(failure instanceof Error ? failure.message : String(failure));
        } finally {
          runningRef.current = false;
          if (abortRef.current === controller) abortRef.current = null;
        }
      }
      runRef.current = run;

      function openEditor(entry) {
        setMenu(null);
        setEditForm(entry
          ? { id: entry.id, label: entry.label, instruction: entry.instruction, mode: entry.mode }
          : { id: "", label: "", instruction: "", mode: mode === "iterate" ? "iterate" : "user" });
        setError("");
        setView("edit");
      }

      function saveCustom() {
        if (!editForm) return;
        const instruction = editForm.instruction.trim();
        if (instruction.length === 0) {
          setError(T("写一句改写要求再保存。"));
          return;
        }
        const entry = {
          id: editForm.id || `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          label: editForm.label.trim().slice(0, 60) || instruction.slice(0, 24),
          instruction: instruction.slice(0, 2000),
          mode: editForm.mode === "iterate" ? "iterate" : "user",
        };
        const next = customs.filter((row) => row.id !== entry.id).concat(entry);
        setCustoms(next);
        persistCustoms(next);
        setTemplateId(entry.id);
        setEditForm(null);
        setView("run");
        setError("");
      }

      function removeCustom() {
        if (!editForm?.id) return;
        const next = customs.filter((row) => row.id !== editForm.id);
        setCustoms(next);
        persistCustoms(next);
        setEditForm(null);
        setTemplateId("");
        setView("run");
      }

      function exportCustoms() {
        const payload = JSON.stringify({ version: 1, templates: customs }, null, 2);
        const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "prompt-optimize-templates.json";
        link.click();
        later(() => URL.revokeObjectURL(url), 1000);
      }

      function importCustoms(event) {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        file.text().then((text) => {
          let rows = [];
          try {
            const parsed = JSON.parse(text);
            rows = (Array.isArray(parsed) ? parsed : Array.isArray(parsed?.templates) ? parsed.templates : [])
              .map(normalizeCustom)
              .filter(Boolean);
          } catch {
            rows = [];
          }
          if (rows.length === 0) {
            setError(T("这个文件里没有可导入的模板。"));
            return;
          }
          const merged = customs.slice();
          for (const row of rows) {
            const at = merged.findIndex((item) => item.id === row.id);
            if (at >= 0) merged[at] = row;
            else merged.push(row);
          }
          const next = merged.slice(0, 40);
          setCustoms(next);
          persistCustoms(next);
          setError("");
        }).catch(() => setError(T("导入失败")));
      }

      function chooseMode(next) {
        if (busy || next === mode) return;
        autoSigRef.current = "";
        setMode(next);
        setMenu(null);
        setError("");
        setReview(false);
        const nextFamily = templatesForMode(panelCatalog, next);
        const preferred = panelCatalog.defaults?.[next];
        const nextTemplate = nextFamily.some((row) => row.id === preferred) ? preferred : nextFamily[0]?.id;
        if (nextTemplate) setTemplateId(nextTemplate);
        if (next === "iterate") later(() => panelRef.current?.querySelector("textarea")?.focus(), 80);
      }

      function pickTemplate(id) {
        setTemplateId(id);
        setMenu(null);
      }

      function accept() {
        if (!result) return;
        setReview(true);
        setMenu(null);
      }

      /** Every path that overwrites the composer leaves the same undo trail. */
      function writeDraft(next) {
        const previous = draftRef.current;
        inputActions?.setDraft?.(next);
        undoSeqRef.current += 1;
        const seq = undoSeqRef.current;
        setUndoText(previous);
        later(() => {
          if (undoSeqRef.current === seq) setUndoText("");
        }, UNDO_MS);
      }

      /** Write the result back, flash, and close on every path that accepts it. */
      function commit(next) {
        writeDraft(next);
        setFlash("done");
        later(() => setFlash(""), 1800);
        close();
      }

      function confirmReplace() {
        if (!result) return;
        setVars(null);
        setReview(false);
        commit(result);
      }

      function undo() {
        if (!undoText) return;
        inputActions?.setDraft?.(undoText);
        undoSeqRef.current += 1;
        setUndoText("");
        setFlash("");
      }

      function send() {
        if (!result) return;
        inputActions?.setDraft?.(result);
        inputActions?.submit?.();
        setFlash("done");
        later(() => setFlash(""), 1800);
        close();
      }

      async function extract() {
        if (!result || extracting) return;
        extractRef.current?.abort();
        const controller = new AbortController();
        extractRef.current = controller;
        setExtracting(true);
        setVars(null);
        setError("");
        try {
          const payload = await postJson(VARIABLES_ROUTE, {
            promptContent: result,
            ...(parsePin(pin) ?? {}),
            ...(sessionId ? { sessionId } : {}),
          }, controller.signal);
          setVars(payload);
        } catch (failure) {
          if (!controller.signal.aborted) {
            setError(failure instanceof Error ? failure.message : String(failure));
          }
        } finally {
          if (extractRef.current === controller) extractRef.current = null;
          setExtracting(false);
        }
      }

      async function runCheck() {
        if (!result || checking || busy) return;
        checkRef.current?.abort();
        const controller = new AbortController();
        checkRef.current = controller;
        setChecking(true);
        setCheckError("");
        setCheck(null);
        try {
          const payload = await postJson(REVIEW_ROUTE, {
            promptContent: result,
            ...(parsePin(pin) ?? {}),
            ...(sessionId ? { sessionId } : {}),
          }, controller.signal);
          setCheck(payload);
        } catch (failure) {
          if (!controller.signal.aborted) {
            setCheckError(failure instanceof Error ? failure.message : String(failure));
          }
        } finally {
          if (checkRef.current === controller) checkRef.current = null;
          setChecking(false);
        }
      }

      /** Replace one quoted span in place; the rest of the result stays byte-identical. */
      function applyIssue(issue) {
        if (!issue || typeof issue.quote !== "string" || typeof issue.replacement !== "string") return;
        const at = result.indexOf(issue.quote);
        if (at < 0) return;
        const next = result.slice(0, at) + issue.replacement + result.slice(at + issue.quote.length);
        setResult(next);
        setCheck((current) => (current
          ? { ...current, issues: current.issues.filter((row) => row.quote !== issue.quote) }
          : current));
      }

      function swapVariant() {
        if (!alt) return;
        const current = { text: result, model: modelUsed, usage, elapsedMs };
        setResult(alt.text);
        setModelUsed(alt.model ?? "");
        setUsage(alt.usage ?? null);
        setElapsedMs(alt.elapsedMs ?? 0);
        setAlt(current);
        setCheck(null);
        setCheckError("");
      }

      function applyTemplated() {
        if (!vars || typeof vars.templated !== "string") return;
        commit(vars.templated);
      }

      function toggleMenu(name, event) {
        if (menu?.name === name) {
          setMenu(null);
          return;
        }
        const rect = event.currentTarget.getBoundingClientRect();
        const width = Math.min(name === "template" ? 340 : 280, window.innerWidth - 24);
        const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
        const goUp = window.innerHeight - rect.bottom < 320 && rect.top > 320;
        setMenu({
          name,
          width,
          left,
          ...(goUp ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
        });
      }

      function choosePin(value) {
        setPin(value);
        writePin(value);
        setMenu(null);
      }

      function grantConsent(entry) {
        setStore((previous) => {
          const next = entry ? withEntry({ ...previous, consent: "yes" }, entry) : { ...previous, consent: "yes" };
          persist(next);
          return next;
        });
        setConsentEntry(null);
      }

      function declineConsent() {
        setStore((previous) => {
          const next = { ...previous, consent: "no" };
          persist(next);
          return next;
        });
        setConsentEntry(null);
      }

      function openCompare(entry) {
        setRootId(entry.rootId);
        setCmpId(entry.id);
        setView("compare");
        setMenu(null);
      }

      function restore(entry) {
        commit(entry.output);
      }

      function removeEntry(id) {
        setStore((previous) => {
          const next = dropEntry(previous, id);
          persist(next);
          return next;
        });
      }

      function clearHistory() {
        if (!clearArmed) {
          setClearArmed(true);
          later(() => setClearArmed(false), 3000);
          return;
        }
        setStore((previous) => {
          const next = { ...previous, entries: [] };
          persist(next);
          return next;
        });
        setClearArmed(false);
      }

      function copy(value, tag) {
        copyText(value).then(() => {
          setCopied(tag);
          later(() => setCopied(""), 1500);
        }).catch(() => {});
      }

      const head = (() => {
        if (review) {
          return h("div", { className: "po-head" },
            h(IconButton, { name: "chevronLeft", label: T("返回"), onClick: () => setReview(false) }),
            h("div", { className: "po-title" }, h("span", null, T("确认替换草稿"))),
            h("div", { className: "po-spacer" }),
            h(IconButton, { name: "x", label: T("关闭"), onClick: close }),
          );
        }
        if (view === "edit") {
          return h("div", { className: "po-head" },
            h(IconButton, {
              name: "chevronLeft",
              label: T("返回"),
              onClick: () => { setEditForm(null); setView("run"); },
            }),
            h("div", { className: "po-title" },
              h(Icon, { name: "braces", size: 14 }),
              h("span", null, T("自定义模板")),
            ),
            h("div", { className: "po-spacer" }),
            h(IconButton, { name: "x", label: T("关闭"), onClick: close }),
          );
        }
        if (view === "history" || view === "compare") {
          return h("div", { className: "po-head" },
            h(IconButton, { name: "chevronLeft", label: T("返回"), onClick: () => setView(view === "compare" ? "history" : "run") }),
            h("div", { className: "po-title" },
              h(Icon, { name: "clock", size: 14 }),
              h("span", null, T(view === "compare" ? "版本对比" : "优化历史")),
              view === "history" ? h("span", { className: "po-count" }, String(store.entries.length)) : null,
            ),
            h("div", { className: "po-spacer" }),
            view === "history" && store.entries.length > 0
              ? h("button", {
                type: "button",
                className: "po-btn",
                "data-variant": "ghost",
                onClick: clearHistory,
              }, T(clearArmed ? "确认清空" : "清空"))
              : null,
            h(IconButton, { name: "x", label: T("关闭"), onClick: close }),
          );
        }
        return h("div", { className: "po-head" },
          h("div", { className: "po-title" },
            h(Icon, { name: "spark", size: 14 }),
            h("span", null, T("提示词优化")),
            busy ? h("span", { className: "po-dot" }) : null,
          ),
          h("div", { className: "po-spacer" }),
          h("span", { style: { position: "relative", display: "inline-flex" } },
            h(IconButton, { name: "clock", label: T("优化历史"), onClick: () => { setView("history"); setMenu(null); } }),
            store.entries.length > 0 ? h("span", {
              className: "po-dot",
              style: { position: "absolute", top: 5, right: 5, width: 5, height: 5, animation: "none" },
            }) : null,
          ),
          h(IconButton, { name: "x", label: T("关闭"), onClick: close }),
        );
      })();

      const toolbar = view === "run" && !review ? h("div", { className: "po-toolbar" },
        h("div", { className: "po-tabs", role: "tablist" },
          (panelCatalog.modes ?? EMPTY_CATALOG.modes).map((entry) => h("button", {
            key: entry.id,
            type: "button",
            role: "tab",
            className: "po-tab",
            "aria-selected": mode === entry.id ? "true" : "false",
            disabled: busy,
            onClick: () => chooseMode(entry.id),
          }, T(entry.label))),
        ),
        h("button", {
          type: "button",
          className: "po-pick",
          "aria-haspopup": "menu",
          "aria-expanded": menu?.name === "template" ? "true" : "false",
          onClick: (event) => toggleMenu("template", event),
        },
          h("span", null, templateRow ? pick(templateRow, "label", english) : T("模板")),
          h(Icon, { name: "chevronDown", size: 12 }),
        ),
      ) : null;

      const errorBanner = error ? h("div", { className: "po-banner", role: "alert" },
        h(Icon, { name: "alert", size: 14 }),
        h("span", null, error),
      ) : null;

      const consentCard = store.consent === "unknown" && consentEntry ? h("div", { className: "po-card" },
        h("div", { className: "po-cardhead" },
          h("div", { className: "po-cardtitle" }, h(Icon, { name: "clock", size: 13 }), h("span", null, T("保留优化记录？"))),
        ),
        h("p", { className: "po-note", style: { padding: "0 10px 8px" } }, T("记录只留在这台电脑，不会上传。")),
        h("div", { className: "po-hactions", style: { padding: "0 10px 10px" } },
          h(Button, { onClick: declineConsent }, T("不保留")),
          h(Button, { variant: "primary", onClick: () => grantConsent(consentEntry) }, T("保留")),
        ),
      ) : null;

      const iterateField = view === "run" && mode === "iterate" ? h("div", { className: "po-field" },
        h("label", { className: "po-label" }, T("想在这一版上改什么？")),
        h("textarea", {
          className: "po-input",
          value: feedback,
          placeholder: T("例如：把语气改得更直接，删掉示例。"),
          onChange: (event) => setFeedback(event.target.value),
          onKeyDown: (event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              event.stopPropagation();
              run();
            }
          },
        }),
        h("span", { className: "po-hint" }, `${T("原稿")} ${countChars(sourceNow)} ${T("字")} · ${T("只改你指出的地方")}`),
      ) : null;

      const resultCard = view === "run" && (result || busy) ? h("div", { className: "po-card" },
        h("div", { className: "po-cardhead" },
          busy ? h("span", { className: "po-dot" }) : null,
          h("div", { className: "po-cardtitle" },
            h("span", null, T(busy ? "生成中" : "优化结果")),
          ),
          result && alt ? h("button", {
            type: "button",
            className: "po-vtab",
            title: T("换一版"),
            onClick: swapVariant,
          }, h(Icon, { name: "refresh", size: 11 }), h("span", null, `${T("另一版")} ${countChars(alt.text)}`)) : null,
          result && usedSource && usedSource !== sourceNow
            ? h("span", { className: "po-chip", "data-tone": "warn" }, T("草稿已更新"))
            : null,
          result && usedTemplateId && usedTemplateId !== (templateRow?.id ?? "")
            ? h("span", { className: "po-chip", "data-tone": "warn" }, T("模板已切换"))
            : null,
          h("div", { className: "po-spacer" }),
          h("span", { className: "po-meta" }, [
            modelUsed ? modelUsed.split("/").slice(1).join("/") || modelUsed : "",
            elapsedMs ? secondsLabel(elapsedMs) : "",
            result ? `${countChars(result)} ${T("字")}` : "",
            usageLabel(usage),
          ].filter(Boolean).join(" · ")),
          result ? h(IconButton, {
            name: "check",
            label: T(checking ? "体检中…" : check ? "重新体检" : "体检"),
            disabled: busy || checking,
            onClick: runCheck,
          }) : null,
          result ? h(IconButton, {
            name: copied === "result" ? "check" : "copy",
            label: T(copied === "result" ? "已复制" : "复制"),
            onClick: () => copy(result, "result"),
          }) : null,
          result ? h(IconButton, {
            name: "braces",
            label: T(extracting ? "抽取中…" : "抽取变量"),
            disabled: extracting,
            onClick: extract,
          }) : null,
        ),
        h("div", { className: "po-rich" }, renderMarkup(result, "result"), busy ? h("span", { className: "po-caret" }) : null),
        vars ? h("div", { className: "po-vars" },
          h("div", { className: "po-cardhead", style: { borderTop: "1px solid var(--dsw-alias-border-l1)" } },
            h("div", { className: "po-cardtitle" }, h("span", null, T("可参数化片段")),
              h("span", { className: "po-chip" }, `${vars.variables?.length ?? 0} ${T("个变量")}`)),
            h("div", { className: "po-spacer" }),
            h(Button, {
              variant: "ghost",
              disabled: typeof vars.templated !== "string",
              onClick: applyTemplated,
            }, T("写回模板")),
          ),
          h("div", { className: "po-chips" },
            (vars.variables ?? []).map((variable) => h("span", { key: variable.name, className: "po-varchip" },
              h("code", null, `{{${variable.name}}}`),
              h("em", null, variable.value),
            )),
          ),
          h("p", { className: "po-note", style: { padding: "0 10px 10px" } },
            vars.templatedError ? vars.templatedError : T("写回后仍可继续编辑")),
        ) : null,
      ) : null;

      const dimTone = (value) => (value === null || value === undefined ? undefined : value < 60 ? "low" : value < 80 ? "mid" : "ok");

      const checkCard = view === "run" && (check || checking || checkError) ? h("div", { className: "po-card" },
        h("div", { className: "po-cardhead" },
          h("div", { className: "po-cardtitle" }, h(Icon, { name: "check", size: 13 }), h("span", null, T("提示词体检"))),
          check ? h("span", { className: "po-chip" }, `${check.score} / 100`) : null,
          checking ? h("span", { className: "po-chip" }, T("体检中…")) : null,
          h("div", { className: "po-spacer" }),
          check?.model ? h("span", { className: "po-meta" }, check.model.split("/").slice(1).join("/") || check.model) : null,
          check && !checking ? h(IconButton, { name: "refresh", label: T("重新体检"), onClick: runCheck }) : null,
        ),
        checking
          ? h("div", { className: "po-empty", style: { padding: "14px 12px" } },
            h("span", { className: "po-dot" }),
            h("p", null, T("体检只读，不改动草稿")))
          : null,
        checkError
          ? h("p", { className: "po-note", style: { padding: "0 10px 10px", color: "var(--dsw-alias-state-error)" } },
            `${T("体检失败")}：${checkError}`)
          : null,
        check && !checking ? h("div", { className: "po-check" },
          h("div", { className: "po-scoreline" },
            h("div", { className: "po-score" }, String(check.score), h("small", null, "/100")),
            h("p", { className: "po-note", style: { flex: 1, minWidth: 0 } }, check.summary || ""),
          ),
          h("div", { className: "po-dims" }, REVIEW_DIMS.map(([key, label]) => {
            const value = check.dims?.[key];
            return h("div", { key, className: "po-dim" },
              h("div", { className: "po-dimhead" },
                h("span", null, T(label)),
                h("span", null, value === null || value === undefined ? "—" : String(value)),
              ),
              h("div", { className: "po-bar", "data-tone": dimTone(value) },
                h("i", { style: { width: `${value ?? 0}%` } })),
            );
          })),
          check.issues.length > 0
            ? h("div", { className: "po-issues" }, check.issues.map((issue) => {
              const present = result.includes(issue.quote);
              return h("div", { key: issue.quote, className: "po-issue" },
                h("div", { className: "po-issuehead" },
                  h("span", { className: "po-sev", "data-sev": issue.severity },
                    T(issue.severity === "high" ? "高" : issue.severity === "low" ? "低" : "中")),
                  h("strong", { title: issue.title }, issue.title || issue.why || ""),
                  h(Button, {
                    variant: "ghost",
                    disabled: !present,
                    title: present ? T("应用") : T("位置已变，无法直接套用"),
                    onClick: () => applyIssue(issue),
                  }, T("应用")),
                ),
                h("pre", { className: "po-quote" }, issue.quote),
                h("p", { className: "po-fix" }, issue.replacement, issue.why ? h("small", null, issue.why) : null),
              );
            }))
            : h("p", { className: "po-note", style: { padding: "2px 10px 10px" } },
              h("strong", null, T("未发现问题")), " · ", T("这版已经没什么可挑的。")),
        ) : null,
      ) : null;

      const sourceCard = view === "run" && (result || busy) && sourceNow.trim() ? h("div", { className: "po-card" },
        h("button", {
          type: "button",
          className: "po-cardhead",
          style: { width: "100%", border: 0, background: "transparent", cursor: "pointer", textAlign: "left" },
          onClick: () => setSourceOpen((value) => !value),
        },
          h("div", { className: "po-cardtitle" }, h("span", null, T("原稿"))),
          h("div", { className: "po-spacer" }),
          h("span", { className: "po-meta" }, `${countChars(sourceNow)} ${T("字")}`),
          h(Icon, { name: sourceOpen ? "chevronDown" : "chevronRight", size: 12 }),
        ),
        sourceOpen ? h("pre", { className: "po-text", "data-muted": "true" }, sourceNow) : null,
      ) : null;

      const emptyState = view === "run" && !result && !busy && !sourceNow.trim()
        ? h("div", { className: "po-empty" },
          h(Icon, { name: "spark", size: 30 }),
          h("strong", null, T("输入框还是空的")),
          h("p", null, T("写完草稿再打开，这里会给出更清楚的版本。")),
        )
        : null;

      const runView = h("div", { className: "po-body" },
        errorBanner,
        consentCard,
        iterateField,
        resultCard,
        checkCard,
        sourceCard,
        emptyState,
      );

      const historyRows = store.entries.map((entry) => {
        const version = chainOf(store.entries, entry.rootId).findIndex((row) => row.id === entry.id) + 1;
        const expanded = openId === entry.id;
        const delta = countChars(entry.output) - countChars(entry.input);
        return h("div", { key: entry.id, className: "po-hrow" },
          h("button", {
            type: "button",
            className: "po-hhead",
            onClick: () => setOpenId(expanded ? "" : entry.id),
          },
            h("div", { className: "po-hmain" },
              h("div", { className: "po-hline" },
                h("span", null, timeLabel(entry.at, english)),
                h("span", null, "·"),
                h("span", null, entry.template || entry.templateId),
                h("span", { className: "po-spacer" }),
                h("span", null, `${delta >= 0 ? "+" : ""}${delta} ${T("字")}`),
              ),
              h("div", { className: "po-hsnippet" }, entry.output.split("\n")[0] || T("原稿为空")),
            ),
            h("span", { className: "po-ver" }, `v${version}`),
            h(Icon, { name: expanded ? "chevronDown" : "arrowRight", size: 13 }),
          ),
          expanded ? h("div", { className: "po-hbody" },
            h("div", { className: "po-hblock" }, h("label", null, T("原稿")), h("p", null, entry.input)),
            h("div", { className: "po-hblock" }, h("label", null, T("优化结果")), h("div", { className: "po-rich", style: { padding: 0 } }, renderMarkup(entry.output, `h-${entry.id}`))),
            h("div", { className: "po-hactions" },
              h(Button, { variant: "ghost", onClick: () => copy(entry.output, entry.id) }, T(copied === entry.id ? "已复制" : "复制")),
              h(Button, { variant: "ghost", onClick: () => restore(entry) }, T("写回")),
              h(Button, { variant: "ghost", onClick: () => openCompare(entry) }, T("对比版本")),
              h("div", { className: "po-spacer" }),
              h(IconButton, { name: "trash", label: T("删除这条"), onClick: () => removeEntry(entry.id) }),
            ),
          ) : null,
        );
      });

      const historyView = h("div", { className: "po-body" },
        store.consent === "unknown"
          ? h("div", { className: "po-empty" },
            h(Icon, { name: "clock", size: 28 }),
            h("strong", null, T("要不要留着优化记录？")),
            h("p", null, T("记录只留在这台电脑，不会上传。")),
            h("div", { className: "po-hactions" },
              h(Button, { onClick: declineConsent }, T("不保留")),
              h(Button, { variant: "primary", onClick: () => grantConsent(null) }, T("保留")),
            ),
          )
          : store.consent === "no"
            ? h("div", { className: "po-empty" },
              h(Icon, { name: "clock", size: 28 }),
              h("strong", null, T("历史记录已关闭，可随时重新开启。")),
              h(Button, { onClick: () => grantConsent(null) }, T("开启历史")),
            )
            : store.entries.length === 0
              ? h("div", { className: "po-empty" },
                h(Icon, { name: "clock", size: 28 }),
                h("strong", null, T("还没有记录")),
                h("p", null, T("每完成一次优化，这里会留一份。")),
              )
              : h("div", { className: "po-history" }, historyRows),
      );

      const compareView = cmpEntry ? h("div", { className: "po-body" },
        h("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
          h("button", {
            type: "button",
            className: "po-pick",
            style: { marginLeft: 0 },
            onClick: (event) => toggleMenu("version", event),
          },
            h("span", null, `v${Math.max(1, chain.findIndex((row) => row.id === cmpEntry.id) + 1)} · ${timeLabel(cmpEntry.at, english)}`),
            h(Icon, { name: "chevronDown", size: 12 }),
          ),
          h("div", { className: "po-spacer" }),
          h("span", { className: "po-meta" }, cmpEntry.template),
        ),
        h("div", { className: "po-cols" },
          h("div", { className: "po-col" },
            h("div", { className: "po-colhead" },
              h("span", null, `${T("原稿")} v1`),
              h("span", null, `${countChars(chain[0]?.input ?? "")} ${T("字")}`),
            ),
            h("pre", { className: "po-text" }, chain[0]?.input ?? ""),
          ),
          h("div", { className: "po-col" },
            h("div", { className: "po-colhead" },
              h("span", null, `${T("优化结果")} v${Math.max(1, chain.findIndex((row) => row.id === cmpEntry.id) + 1)}`),
              h("span", null, `${countChars(cmpEntry.output)} ${T("字")}`),
            ),
            h("div", { className: "po-rich" }, renderMarkup(cmpEntry.output, "cmp")),
          ),
        ),
        (() => {
          const analysis = analyzeChange(chain[0]?.input ?? "", cmpEntry.output);
          const parts = [];
          if (analysis.gained.length) parts.push(`+${analysis.gained.map((marker) => T(marker.label)).join(" +")}`);
          if (analysis.lost.length) parts.push(`−${analysis.lost.map((marker) => T(marker.label)).join(" −")}`);
          if (parts.length === 0) parts.push(`${analysis.added} ${T("新增")} / ${analysis.removed} ${T("删除行")}`);
          return h("p", { className: "po-note" }, `${T("结构变化（本机分析）")}：${parts.join(" · ")}`);
        })(),
      ) : h("div", { className: "po-body" },
        h("div", { className: "po-empty" }, h("strong", null, T("没有可对比的版本"))),
      );

      const editView = editForm ? h("div", { className: "po-body" },
        error ? h("p", { className: "po-note", style: { color: "var(--dsw-alias-state-error)" } }, error) : null,
        h("div", { className: "po-field" },
          h("label", { className: "po-note" }, T("模板名称")),
          h("input", {
            className: "po-input",
            style: { minHeight: 34, maxHeight: 34 },
            value: editForm.label,
            placeholder: T("例如：客服口吻"),
            maxLength: 60,
            onChange: (event) => setEditForm((form) => ({ ...form, label: event.target.value })),
          }),
        ),
        h("div", { className: "po-field" },
          h("label", { className: "po-note" }, T("改写要求")),
          h("textarea", {
            className: "po-input",
            style: { minHeight: 132 },
            value: editForm.instruction,
            placeholder: T("例如：把语气改成客服口吻，结尾加一句道歉，不要超过 150 字。"),
            maxLength: 2000,
            onChange: (event) => setEditForm((form) => ({ ...form, instruction: event.target.value })),
          }),
        ),
        h("div", { className: "po-field" },
          h("label", { className: "po-note" }, T("适用对象")),
          h("div", { className: "po-tabs" },
            h("button", {
              type: "button",
              className: "po-tab",
              "aria-selected": editForm.mode === "user" ? "true" : "false",
              onClick: () => setEditForm((form) => ({ ...form, mode: "user" })),
            }, T("提示词")),
            h("button", {
              type: "button",
              className: "po-tab",
              "aria-selected": editForm.mode === "iterate" ? "true" : "false",
              onClick: () => setEditForm((form) => ({ ...form, mode: "iterate" })),
            }, T("迭代优化")),
          ),
        ),
        h("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" } },
          h(Button, { variant: "primary", onClick: saveCustom, icon: "check" }, T("保存")),
          editForm.id ? h(Button, { variant: "ghost", onClick: removeCustom, icon: "trash" }, T("删除")) : null,
          h("label", {
            className: "po-btn",
            "data-variant": "ghost",
            style: { cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 },
          },
            h(Icon, { name: "plus", size: 12 }),
            T("导入 JSON"),
            h("input", {
              type: "file",
              accept: "application/json,.json",
              style: { display: "none" },
              onChange: importCustoms,
            }),
          ),
          customs.length > 0 ? h(Button, { variant: "ghost", onClick: exportCustoms, icon: "arrowRight" }, T("导出全部")) : null,
        ),
        h("p", { className: "po-note" }, T("自定义模板只保存在这台浏览器里，不会上传。")),
      ) : null;

      const reviewRows = result ? collapseDiff(diffLines(draft, result), 2) : [];
      const reviewView = h("div", { className: "po-body", style: { padding: 0 } },
        result
          ? h("div", { className: "po-diff" },
            reviewRows.map((row, index) => h("div", {
              key: `${row.t}-${index}`,
              className: "po-row",
              "data-t": row.t,
            },
              h("span", { className: "po-sign" }, row.t === "add" ? "+" : row.t === "del" ? "−" : row.t === "gap" ? "···" : " "),
              h("span", null, row.t === "gap" ? `${row.text} ${T("行未显示")}` : row.text || " "),
            )),
          )
          : h("div", { className: "po-empty" }, h("strong", null, T("草稿为空"))),
      );

      const footer = view === "run" && !review ? h("div", { className: "po-foot" },
        h("button", {
          type: "button",
          className: "po-pick",
          style: { marginLeft: 0, maxWidth: 210 },
          onClick: (event) => toggleMenu("model", event),
          title: T("模型"),
        },
          h(Icon, { name: parsePin(pin) ? "lock" : "spark", size: 12 }),
          h("span", null, parsePin(pin) ? modelLabel(panelCatalog, pin) : T("跟随当前模型")),
          h(Icon, { name: "chevronDown", size: 11 }),
        ),
        h("span", { className: "po-meta", title: templateRow ? pick(templateRow, "useWhen", english) : "" }, templateRow ? pick(templateRow, "useWhen", english) : ""),
        h("div", { className: "po-spacer" }),
        busy
          ? h(Button, { onClick: () => abortRef.current?.abort(), icon: "stop" }, T("停止"))
          : mode === "iterate" && result
            ? h("div", { style: { display: "flex", gap: 6 } },
              h(Button, { variant: "ghost", onClick: accept }, T("替换草稿")),
              h(Button, { variant: "primary", onClick: run, icon: "refresh" }, T("开始迭代")),
            )
            : result && usedTemplateId && usedTemplateId !== (templateRow?.id ?? "")
              ? h("div", { style: { display: "flex", gap: 6 } },
                h(Button, { variant: "ghost", onClick: accept }, T("替换草稿")),
                h(Button, { variant: "primary", onClick: run, icon: "refresh" }, T("用新模板重跑")),
              )
              : result
                ? h("div", { style: { display: "flex", gap: 6 } },
                  h(Button, { variant: "ghost", onClick: run, icon: "refresh", title: T("再来一版") }, T("再来一版")),
                  h(Button, { variant: "ghost", onClick: send, icon: "send" }, T("发送")),
                  h(Button, { variant: "primary", onClick: accept, icon: "arrowRight" }, T("替换草稿")),
                )
                : status === "error"
                  ? h(Button, { onClick: run, icon: "refresh" }, T("重试"))
                  : h("span", { className: "po-meta" }, T("在输入框写点内容，打开后会自动优化")),
      ) : view === "run" && review ? h("div", { className: "po-foot", style: { justifyContent: "flex-end" } },
        h("span", { className: "po-meta", style: { marginRight: "auto" } }, T("替换后 9 秒内可撤销")),
        h(Button, { variant: "ghost", onClick: () => setReview(false) }, T("取消")),
        h(Button, { variant: "primary", onClick: confirmReplace }, T("替换草稿")),
      ) : view === "compare" && cmpEntry ? h("div", { className: "po-foot" },
        h("span", { className: "po-meta" }, cmpEntry.model || ""),
        h("div", { className: "po-spacer" }),
        h(Button, { onClick: () => copy(cmpEntry.output, "compare"), icon: copied === "compare" ? "check" : "copy" }, T("复制结果")),
        h(Button, { variant: "primary", onClick: () => restore(cmpEntry) }, T("替换草稿")),
      ) : null;

      const body = review ? reviewView : view === "edit" ? editView : view === "history" ? historyView : view === "compare" ? compareView : runView;

      const panel = open && anchor
        ? createPortal(
          h("div", {
            ref: panelRef,
            className: "po-panel",
            role: "dialog",
            "aria-label": T("提示词优化"),
            "aria-modal": "false",
            "data-view": review ? "review" : view,
            style: {
              left: anchor.left,
              bottom: anchor.bottom,
              width: anchor.width,
              maxHeight: anchor.maxHeight,
            },
            onKeyDown: (event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && view === "run" && !review && !event.defaultPrevented) {
                event.preventDefault();
                run();
              }
            },
          },
            head,
            toolbar,
            body,
            footer,
          ),
          document.body,
        )
        : null;

      const menuNode = open && menu
        ? createPortal(h("div", {
          className: "po-menu",
          style: { left: menu.left, width: menu.width, ...(menu.top !== undefined ? { top: menu.top } : { bottom: menu.bottom }) },
          role: "menu",
        }, (() => {
          if (menu.name === "model") {
            const items = [menuRow({
              key: "auto",
              checked: !parsePin(pin),
              onClick: () => choosePin(""),
              title: T("跟随当前模型"),
              notes: [panelCatalog.current ? `${panelCatalog.current.provider}/${panelCatalog.current.model}` : ""],
            })];
            for (const group of panelCatalog.groups ?? []) {
              items.push(h("div", { key: `g-${group.provider}`, className: "po-menugroup" }, group.name));
              for (const model of group.models) {
                const value = `${group.provider}/${model.id}`;
                const checked = pin === value;
                items.push(menuRow({
                  key: value,
                  checked,
                  onClick: () => choosePin(value),
                  title: model.name,
                  notes: [model.id],
                }));
              }
            }
            if (items.length === 1) items.push(h("p", { key: "empty", className: "po-note", style: { padding: "8px" } }, T("正在准备…")));
            return items;
          }
          if (menu.name === "version") {
            return chain.slice().reverse().map((entry) => {
              const version = chain.findIndex((row) => row.id === entry.id) + 1;
              const checked = entry.id === cmpEntry?.id;
              return menuRow({
                key: entry.id,
                checked,
                onClick: () => { setCmpId(entry.id); setMenu(null); },
                title: `v${version} · ${timeLabel(entry.at, english)}`,
                notes: [entry.template],
              });
            });
          }
          const items = [];
          let lastCategory = "";
          for (const row of family) {
            if (row.category !== lastCategory) {
              lastCategory = row.category;
              items.push(h("div", { key: `c-${row.category}`, className: "po-menugroup" }, T(row.category)));
            }
            const checked = row.id === templateRow?.id;
            items.push(menuRow({
              key: row.id,
              checked,
              onClick: () => pickTemplate(row.id),
              title: pick(row, "label", english),
              notes: [pick(row, "description", english), `${T("适合")}：${pick(row, "useWhen", english)}`],
            }));
          }
          items.push(h("div", { key: "c-custom", className: "po-menugroup" }, T("自定义")));
          for (const row of customRows) {
            const checked = row.id === templateRow?.id;
            items.push(menuRow({
              key: row.id,
              checked,
              onClick: () => pickTemplate(row.id),
              title: row.label,
              notes: [row.instruction],
            }));
          }
          items.push(menuRow({
            key: "c-manage",
            icon: "plus",
            onClick: () => openEditor(null),
            title: T("新建自定义模板"),
            notes: [T("写好要求，以后一键复用")],
          }));
          return items;
        })()), document.body)
        : null;

      return h("div", { style: { display: "contents" } },
        h("button", {
          ref: seatRef,
          type: "button",
          className: "po-seat",
          "data-open": open ? "true" : "false",
          "aria-haspopup": "dialog",
          onMouseDown: (event) => event.preventDefault(),
          onClick: () => (open ? close() : openPanel()),
        },
          busy ? h("span", { className: "po-dot" }) : h(Icon, { name: "spark", size: 13 }),
          h("span", null, T(flash === "done" ? "已替换" : busy ? "优化中" : "提示词优化")),
        ),
        panel,
        menuNode,
        undoText && draft === result
          ? createPortal(h("div", {
            className: "po-toast",
            role: "status",
            style: anchor ? { bottom: Math.max(16, anchor.bottom + 10) } : undefined,
          },
            h("span", null, T("已替换草稿 · 9 秒内可撤销")),
            h("button", { type: "button", onClick: undo }, T("撤销")),
          ), document.body)
          : null,
      );
    }

    const exports = {
      PromptOptimizer,
      apply(ctx) {
        ctx.slots.inject("conversation.input.right", () => ctx.slots.register({
          name: "conversation.input.right",
          id: "prompt-optimize",
          order: 5,
        }, PromptOptimizer));
      },
      inject: ["slots"],
      __diffLines: diffLines,
      __collapseDiff: collapseDiff,
      __analyzeChange: analyzeChange,
      __usageLabel: usageLabel,
      __timeLabel: timeLabel,
    };
    return exports;
  },
});

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
    const { useCallback, useEffect, useRef, useState } = React;

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

    /* ------------------------------------------------------------------ *
     * Copy
     * ------------------------------------------------------------------ */

    /* shortcut: dictionaries live in this bundle, no build step to split them */
    const NS = "promptOptimize";

    /* @messages-start */
    const MESSAGES = {
      zh: {
          "提示词优化": "提示词优化",
          "提示词": "提示词",
          "迭代优化": "迭代优化",
          "优化结果": "优化结果",
          "生成中": "生成中",
          "原稿": "原稿",
          "展开": "展开",
          "收起": "收起",
          "复制": "复制",
          "已复制": "已复制",
          "复制结果": "复制结果",
          "替换草稿": "替换草稿",
          "已替换草稿 · 9 秒内可撤销": "已替换草稿 · 9 秒内可撤销",
          "发送": "发送",
          "停止": "停止",
          "重试": "重试",
          "撤销": "撤销",
          "关闭": "关闭",
          "返回": "返回",
          "优化历史": "优化历史",
          "版本对比": "版本对比",
          "清空": "清空",
          "删除": "删除",
          "写回": "写回",
          "对比版本": "对比版本",
          "跟随当前模型": "跟随当前模型",
          "模板": "模板",
          "模型": "模型",
          "草稿已更新": "草稿已更新",
          "模板已切换": "模板已切换",
          "用新模板重跑": "用新模板重跑",
          "开始迭代": "开始迭代",
          "想在这一版上改什么？": "想在这一版上改什么？",
          "例如：把语气改得更直接，删掉示例。": "例如：把语气改得更直接，删掉示例。",
          "在输入框写点内容，打开后会自动优化": "在输入框写点内容，打开后会自动优化",
          "正在准备…": "正在准备…",
          "输入框还是空的": "输入框还是空的",
          "写完草稿再打开，这里会给出更清楚的版本。": "写完草稿再打开，这里会给出更清楚的版本。",
          "确认替换草稿": "确认替换草稿",
          "替换后 9 秒内可撤销": "替换后 9 秒内可撤销",
          "取消": "取消",
          "可参数化片段": "可参数化片段",
          "写回模板": "写回模板",
          "写回后仍可继续编辑": "写回后仍可继续编辑",
          "位置对不上，无法套用": "位置对不上，无法套用",
          "抽取中…": "抽取中…",
          "抽取变量": "抽取变量",
          "保留优化记录？": "保留优化记录？",
          "记录只留在这台电脑，不会上传。": "记录只留在这台电脑，不会上传。",
          "不保留": "不保留",
          "保留": "保留",
          "要不要留着优化记录？": "要不要留着优化记录？",
          "历史记录已关闭，可随时重新开启。": "历史记录已关闭，可随时重新开启。",
          "开启历史": "开启历史",
          "还没有记录": "还没有记录",
          "每完成一次优化，这里会留一份。": "每完成一次优化，这里会留一份。",
          "结构变化（本机分析）": "结构变化（本机分析）",
          "原稿为空": "原稿为空",
          "草稿为空": "草稿为空",
          "没有可对比的版本": "没有可对比的版本",
          "替换": "替换",
          "保存": "保存",
          "个变量": "个变量",
          "版本": "版本",
          "只改你指出的地方": "只改你指出的地方",
          "刚刚": "刚刚",
          "昨天": "昨天",
          "分钟前": "分钟前",
          "小时前": "小时前",
          "字": "字",
          "重试一次": "重试一次",
          "模型没有返回内容": "模型没有返回内容",
          "已替换": "已替换",
          "优化中": "优化中",
          "清空历史": "清空历史",
          "确认清空": "确认清空",
          "行未显示": "行未显示",
          "适合": "适合",
          "写一句修改意见再开始。": "写一句修改意见再开始。",
          "删除这条": "删除这条",
          "历史只存在本机": "历史只存在本机",
          "再来一次": "再来一次",
          "原样保留": "原样保留",
          "新增": "新增",
          "删除行": "删除行",
          "结构": "结构",
          "目标": "目标",
          "约束": "约束",
          "格式": "格式",
          "示例": "示例",
          "步骤": "步骤",
          "边界": "边界",
          "验收": "验收",
          "体检": "体检",
          "重新体检": "重新体检",
          "体检中…": "体检中…",
          "提示词体检": "提示词体检",
          "体检失败": "体检失败",
          "综合分": "综合分",
          "清晰度": "清晰度",
          "上下文": "上下文",
          "输出格式": "输出格式",
          "鲁棒性": "鲁棒性",
          "高": "高",
          "中": "中",
          "低": "低",
          "未发现问题": "未发现问题",
          "这版已经没什么可挑的。": "这版已经没什么可挑的。",
          "条建议，可直接替换": "条建议，可直接替换",
          "应用": "应用",
          "已应用": "已应用",
          "位置已变，无法直接套用": "位置已变，无法直接套用",
          "体检只读，不改动草稿": "体检只读，不改动草稿",
          "再来一版": "再来一版",
          "上一版": "上一版",
          "最新": "最新",
          "两版对比": "两版对比",
          "本机分析": "本机分析",
          "自定义": "自定义",
          "新建自定义模板": "新建自定义模板",
          "写好要求，以后一键复用": "写好要求，以后一键复用",
          "自定义模板": "自定义模板",
          "模板名称": "模板名称",
          "例如：客服口吻": "例如：客服口吻",
          "改写要求": "改写要求",
          "例如：把语气改成客服口吻，结尾加一句道歉，不要超过 150 字。": "例如：把语气改成客服口吻，结尾加一句道歉，不要超过 150 字。",
          "适用对象": "适用对象",
          "导入 JSON": "导入 JSON",
          "导出全部": "导出全部",
          "写一句改写要求再保存。": "写一句改写要求再保存。",
          "这个文件里没有可导入的模板。": "这个文件里没有可导入的模板。",
          "导入失败": "导入失败",
          "自定义模板只保存在这台浏览器里，不会上传。": "自定义模板只保存在这台浏览器里，不会上传。",
          "换一版": "换一版",
          "另一版": "另一版",
          "基础": "基础",
          "任务简报": "任务简报",
          "目标、材料、交付、约束四段式，最通用的一档。": "目标、材料、交付、约束四段式，最通用的一档。",
          "大多数「帮我做点什么」的草稿。": "大多数「帮我做点什么」的草稿。",
          "补上模型只能靠猜的那部分信息。": "补上模型只能靠猜的那部分信息。",
          "交付契约": "交付契约",
          "把验收标准、输入输出和边界情况写在前面。": "把验收标准、输入输出和边界情况写在前面。",
          "结果要交给别人用，错一点就要返工。": "结果要交给别人用，错一点就要返工。",
          "先说清「怎样算完成」，再让模型动手。": "先说清「怎样算完成」，再让模型动手。",
          "示范": "示范",
          "示例引导": "示例引导",
          "用两三个输入输出样例锁定风格与格式。": "用两三个输入输出样例锁定风格与格式。",
          "你要的风格很难形容，但一看例子就懂。": "你要的风格很难形容，但一看例子就懂。",
          "少写形容词，多给可对照的样例。": "少写形容词，多给可对照的样例。",
          "推理": "推理",
          "推理步骤": "推理步骤",
          "要求模型分步执行并中途自检。": "要求模型分步执行并中途自检。",
          "任务有多个环节，错一步后面全歪。": "任务有多个环节，错一步后面全歪。",
          "把一次大跳跃拆成可检查的小台阶。": "把一次大跳跃拆成可检查的小台阶。",
          "工程": "工程",
          "代码审阅": "代码审阅",
          "把「帮我看看这段代码」写成一次有范围、有优先级的审阅请求。": "把「帮我看看这段代码」写成一次有范围、有优先级的审阅请求。",
          "要发一次代码审阅、PR 描述或安全复查。": "要发一次代码审阅、PR 描述或安全复查。",
          "审阅范围、关注点顺序和交付格式都写死，避免泛泛而谈。": "审阅范围、关注点顺序和交付格式都写死，避免泛泛而谈。",
          "实现任务": "实现任务",
          "把编码需求补成含验收、接口与边界处理的工程说明。": "把编码需求补成含验收、接口与边界处理的工程说明。",
          "要交给智能体或同事实现一个功能、修一个缺陷。": "要交给智能体或同事实现一个功能、修一个缺陷。",
          "验收标准先行，减少「写完才发现不是这个意思」。": "验收标准先行，减少「写完才发现不是这个意思」。",
          "SQL 查询": "SQL 查询",
          "把一句取数需求写成口径、字段与性能约束都明确的查询任务。": "把一句取数需求写成口径、字段与性能约束都明确的查询任务。",
          "要找数、做报表或核对口径。": "要找数、做报表或核对口径。",
          "时间范围、去重和空值处理先说清，少返工。": "时间范围、去重和空值处理先说清，少返工。",
          "结构化抽取": "结构化抽取",
          "把「从这段里取几个字段」写成带 schema 与缺失规则的抽取任务。": "把「从这段里取几个字段」写成带 schema 与缺失规则的抽取任务。",
          "要从邮件、网页或对话里批量取字段。": "要从邮件、网页或对话里批量取字段。",
          "字段类型、枚举与缺失处理明确，输出可直接进程序。": "字段类型、枚举与缺失处理明确，输出可直接进程序。",
          "测试设计": "测试设计",
          "把测试需求写成覆盖正常、边界、异常与权限的用例表。": "把测试需求写成覆盖正常、边界、异常与权限的用例表。",
          "功能要验收，或者要补一批回归用例。": "功能要验收，或者要补一批回归用例。",
          "用例结构与优先级固定，覆盖不再靠临场想。": "用例结构与优先级固定，覆盖不再靠临场想。",
          "写作": "写作",
          "翻译本地化": "翻译本地化",
          "把翻译需求写成带受众、术语表与格式约束的本地化任务。": "把翻译需求写成带受众、术语表与格式约束的本地化任务。",
          "要翻文档、界面文案或商务邮件。": "要翻文档、界面文案或商务邮件。",
          "保留变量与 Markdown 结构，不擅自增删内容。": "保留变量与 Markdown 结构，不擅自增删内容。",
          "写作润色": "写作润色",
          "把润色需求写成允许改动层级、禁止扩写的修订任务。": "把润色需求写成允许改动层级、禁止扩写的修订任务。",
          "文章、公告或说明要改得更清楚，但事实不能动。": "文章、公告或说明要改得更清楚，但事实不能动。",
          "先划清能改什么、不能改什么，避免被改写成另一篇。": "先划清能改什么、不能改什么，避免被改写成另一篇。",
          "资料问答": "资料问答",
          "把「根据这些资料回答」写成带引用与未覆盖声明的问答任务。": "把「根据这些资料回答」写成带引用与未覆盖声明的问答任务。",
          "答案必须能追溯到给定资料。": "答案必须能追溯到给定资料。",
          "资料没写到就说没写到，冲突时列出处。": "资料没写到就说没写到，冲突时列出处。",
          "迭代": "迭代",
          "增量改写": "增量改写",
          "只改你指出的地方，其余原样保留。": "只改你指出的地方，其余原样保留。",
          "上一版已经八九不离十，只差一两处。": "上一版已经八九不离十，只差一两处。",
          "不让一次小修改把整段节奏改没。": "不让一次小修改把整段节奏改没。",
          "角色设定": "角色设定",
          "把一句角色描述写成智能体能长期执行的系统提示词。": "把一句角色描述写成智能体能长期执行的系统提示词。",
          "你只有一个「让它当什么角色」的念头，细节还没想清。": "你只有一个「让它当什么角色」的念头，细节还没想清。",
          "身份、职责、流程与边界一次补齐。": "身份、职责、流程与边界一次补齐。",
          "Agent 人设": "Agent 人设",
          "写成带说话方式与判断习惯的人格文件。": "写成带说话方式与判断习惯的人格文件。",
          "你要的是一个有脾气、有取舍的长期搭档。": "你要的是一个有脾气、有取舍的长期搭档。",
          "语气、原则、会做与不会做写得具体。": "语气、原则、会做与不会做写得具体。",
      },
      en: {
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
          "结构": "Structure",
          "目标": "goal",
          "约束": "Constraints",
          "格式": "format",
          "示例": "Examples",
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
          "导入 JSON": "Import JSON",
          "导出全部": "Export all",
          "写一句改写要求再保存。": "Write an instruction before saving.",
          "这个文件里没有可导入的模板。": "This file has no templates to import.",
          "导入失败": "Import failed",
          "自定义模板只保存在这台浏览器里，不会上传。": "Custom templates stay in this browser; nothing is uploaded.",
          "换一版": "Generate another version",
          "另一版": "Another",
          "基础": "Basics",
          "任务简报": "Task brief",
          "目标、材料、交付、约束四段式，最通用的一档。": "Goal, material, deliverable, constraints — the general-purpose rewrite.",
          "大多数「帮我做点什么」的草稿。": "Most \"could you help me with…\" drafts.",
          "补上模型只能靠猜的那部分信息。": "Fills in the parts the model would otherwise guess.",
          "交付契约": "Delivery contract",
          "把验收标准、输入输出和边界情况写在前面。": "Put acceptance criteria, inputs, outputs and edge cases up front.",
          "结果要交给别人用，错一点就要返工。": "Someone else will consume the result and rework is expensive.",
          "先说清「怎样算完成」，再让模型动手。": "Defines done before the model starts.",
          "示范": "Examples",
          "示例引导": "Worked examples",
          "用两三个输入输出样例锁定风格与格式。": "Pin down style and format with two or three input/output samples.",
          "你要的风格很难形容，但一看例子就懂。": "The style is hard to describe but obvious from an example.",
          "少写形容词，多给可对照的样例。": "Fewer adjectives, more side-by-side samples.",
          "推理": "Reasoning",
          "推理步骤": "Reasoning steps",
          "要求模型分步执行并中途自检。": "Ask the model to work in steps and check itself along the way.",
          "任务有多个环节，错一步后面全歪。": "The task has stages, and one wrong step poisons the rest.",
          "把一次大跳跃拆成可检查的小台阶。": "Splits one big leap into checkable steps.",
          "工程": "Engineering",
          "代码审阅": "Code review",
          "把「帮我看看这段代码」写成一次有范围、有优先级的审阅请求。": "Turn \"can you look at this code\" into a scoped review request with priorities.",
          "要发一次代码审阅、PR 描述或安全复查。": "You are asking for a review, a PR read, or a security pass.",
          "审阅范围、关注点顺序和交付格式都写死，避免泛泛而谈。": "Pins the scope, the order of concerns and the report format.",
          "实现任务": "Implementation task",
          "把编码需求补成含验收、接口与边界处理的工程说明。": "Flesh a coding request out into an engineering brief with acceptance and interfaces.",
          "要交给智能体或同事实现一个功能、修一个缺陷。": "An agent or teammate will implement a feature or fix a defect.",
          "验收标准先行，减少「写完才发现不是这个意思」。": "Acceptance first, so the build does not miss the point.",
          "SQL 查询": "SQL query",
          "把一句取数需求写成口径、字段与性能约束都明确的查询任务。": "Make a data request explicit about grain, columns and performance limits.",
          "要找数、做报表或核对口径。": "You need data, a report, or a definition checked.",
          "时间范围、去重和空值处理先说清，少返工。": "Time range, dedupe and null handling settled before the query runs.",
          "结构化抽取": "Structured extraction",
          "把「从这段里取几个字段」写成带 schema 与缺失规则的抽取任务。": "Turn \"pull a few fields out of this\" into an extraction task with a schema.",
          "要从邮件、网页或对话里批量取字段。": "You are pulling fields out of mail, pages or transcripts at volume.",
          "字段类型、枚举与缺失处理明确，输出可直接进程序。": "Types, enums and missing-value rules make the output machine-usable.",
          "测试设计": "Test design",
          "把测试需求写成覆盖正常、边界、异常与权限的用例表。": "Write a test request that covers happy path, edges, failures and permissions.",
          "功能要验收，或者要补一批回归用例。": "A feature is being accepted or a regression suite is missing.",
          "用例结构与优先级固定，覆盖不再靠临场想。": "A fixed case structure and priority keep coverage from being improvised.",
          "写作": "Writing",
          "翻译本地化": "Translation",
          "把翻译需求写成带受众、术语表与格式约束的本地化任务。": "Make a translation request specify audience, glossary and formatting.",
          "要翻文档、界面文案或商务邮件。": "You are translating docs, UI copy or business mail.",
          "保留变量与 Markdown 结构，不擅自增删内容。": "Keeps variables and Markdown intact instead of quietly rewriting.",
          "写作润色": "Copy polish",
          "把润色需求写成允许改动层级、禁止扩写的修订任务。": "Turn \"make this better\" into a revision task with explicit edit limits.",
          "文章、公告或说明要改得更清楚，但事实不能动。": "A piece needs to read better without its facts moving.",
          "先划清能改什么、不能改什么，避免被改写成另一篇。": "Draws the line between polish and rewrite up front.",
          "资料问答": "Grounded Q&A",
          "把「根据这些资料回答」写成带引用与未覆盖声明的问答任务。": "Make \"answer from these docs\" cite sources and admit gaps.",
          "答案必须能追溯到给定资料。": "The answer has to be traceable to supplied material.",
          "资料没写到就说没写到，冲突时列出处。": "Says when the material is silent, and lists sources on conflict.",
          "迭代": "Iteration",
          "增量改写": "Incremental edit",
          "只改你指出的地方，其余原样保留。": "Change what you point at and leave the rest untouched.",
          "上一版已经八九不离十，只差一两处。": "The last version is close and only one or two spots are off.",
          "不让一次小修改把整段节奏改没。": "Keeps a small fix from rewriting the whole thing.",
          "角色设定": "Role contract",
          "把一句角色描述写成智能体能长期执行的系统提示词。": "Turn a one-line role idea into a system prompt an agent can follow for weeks.",
          "你只有一个「让它当什么角色」的念头，细节还没想清。": "You know the role you want but none of the details yet.",
          "身份、职责、流程与边界一次补齐。": "Identity, duties, workflow and limits in one pass.",
          "Agent 人设": "Agent persona",
          "写成带说话方式与判断习惯的人格文件。": "Write a persona file with a voice and a set of judgment habits.",
          "你要的是一个有脾气、有取舍的长期搭档。": "You want a long-lived partner with a voice and opinions.",
          "语气、原则、会做与不会做写得具体。": "Concrete tone, principles, and what it will refuse.",
      },
      ja: {
          "提示词优化": "プロンプト最適化",
          "提示词": "プロンプト",
          "迭代优化": "反復改善",
          "优化结果": "最適化結果",
          "生成中": "生成中",
          "原稿": "原文",
          "展开": "展開",
          "收起": "折りたたむ",
          "复制": "コピー",
          "已复制": "コピー済み",
          "复制结果": "結果をコピー",
          "替换草稿": "下書きを置き換え",
          "已替换草稿 · 9 秒内可撤销": "下書きを置き換えました · 9 秒以内なら元に戻せます",
          "发送": "送信",
          "停止": "停止",
          "重试": "再試行",
          "撤销": "元に戻す",
          "关闭": "閉じる",
          "返回": "戻る",
          "优化历史": "最適化履歴",
          "版本对比": "バージョン比較",
          "清空": "クリア",
          "删除": "削除",
          "写回": "反映",
          "对比版本": "比較",
          "跟随当前模型": "現在のモデルに従う",
          "模板": "テンプレート",
          "模型": "モデル",
          "草稿已更新": "下書きを更新しました",
          "模板已切换": "テンプレートを切り替えました",
          "用新模板重跑": "新しいテンプレートで再実行",
          "开始迭代": "反復を開始",
          "想在这一版上改什么？": "この版でどこを変えますか？",
          "例如：把语气改得更直接，删掉示例。": "例：口調をもっと直接的にして、例を削除する。",
          "在输入框写点内容，打开后会自动优化": "入力欄に下書きを書いてから開くと、自動で最適化されます。",
          "正在准备…": "準備中…",
          "输入框还是空的": "入力欄が空です",
          "写完草稿再打开，这里会给出更清楚的版本。": "下書きを書いてから開くと、より明確な版がここに表示されます。",
          "确认替换草稿": "下書きを置き換えますか？",
          "替换后 9 秒内可撤销": "置き換え後 9 秒以内なら元に戻せます。",
          "取消": "キャンセル",
          "可参数化片段": "パラメータ化できる箇所",
          "写回模板": "テンプレートを適用",
          "写回后仍可继续编辑": "適用後もそのまま編集できます。",
          "位置对不上，无法套用": "位置が一致しないため、テンプレートを適用できませんでした。",
          "抽取中…": "抽出中…",
          "抽取变量": "変数を抽出",
          "保留优化记录？": "最適化記録を残しますか？",
          "记录只留在这台电脑，不会上传。": "記録はこのコンピューター内にのみ残り、アップロードされません。",
          "不保留": "残さない",
          "保留": "残す",
          "要不要留着优化记录？": "ローカル履歴を有効にしますか？",
          "历史记录已关闭，可随时重新开启。": "履歴はオフです。いつでも再びオンにできます。",
          "开启历史": "履歴をオンにする",
          "还没有记录": "記録はまだありません",
          "每完成一次优化，这里会留一份。": "最適化が完了するたびに、ここに 1 件残ります。",
          "结构变化（本机分析）": "構造の変化（ローカル分析）",
          "原稿为空": "原文が空です",
          "草稿为空": "下書きが空です",
          "没有可对比的版本": "比較できるバージョンがありません",
          "替换": "置き換え",
          "保存": "保存",
          "个变量": "個の変数",
          "版本": "v",
          "只改你指出的地方": "指摘した箇所だけを変更",
          "刚刚": "たった今",
          "昨天": "昨日",
          "分钟前": "分前",
          "小时前": "時間前",
          "字": "文字",
          "重试一次": "もう一度試す",
          "模型没有返回内容": "モデルが内容を返しませんでした",
          "已替换": "置き換え済み",
          "优化中": "最適化中",
          "清空历史": "履歴をクリア",
          "确认清空": "クリアする",
          "行未显示": "行を非表示",
          "适合": "向いている用途",
          "写一句修改意见再开始。": "変更内容を一言書いてから開始してください。",
          "删除这条": "この記録を削除",
          "历史只存在本机": "履歴はこの端末にのみ保存されます",
          "再来一次": "もう一度実行",
          "原样保留": "そのまま保持",
          "新增": "追加",
          "删除行": "削除",
          "结构": "構造",
          "目标": "目標",
          "约束": "制約",
          "格式": "形式",
          "示例": "例",
          "步骤": "手順",
          "边界": "境界条件",
          "验收": "受け入れ",
          "体检": "チェック",
          "重新体检": "再チェック",
          "体检中…": "チェック中…",
          "提示词体检": "プロンプトチェック",
          "体检失败": "チェックに失敗しました",
          "综合分": "総合スコア",
          "清晰度": "明瞭さ",
          "上下文": "コンテキスト",
          "输出格式": "出力形式",
          "鲁棒性": "堅牢性",
          "高": "高",
          "中": "中",
          "低": "低",
          "未发现问题": "問題は見つかりませんでした",
          "这版已经没什么可挑的。": "この版に指摘できる点はもうありません。",
          "条建议，可直接替换": "件の提案、そのまま置き換え可能",
          "应用": "適用",
          "已应用": "適用済み",
          "位置已变，无法直接套用": "位置が変わったため、直接適用できません",
          "体检只读，不改动草稿": "チェックは読み取り専用です",
          "再来一版": "もう一版生成",
          "上一版": "前の版",
          "最新": "最新",
          "两版对比": "2 版を比較",
          "本机分析": "ローカル分析",
          "自定义": "カスタム",
          "新建自定义模板": "カスタムテンプレートを作成",
          "写好要求，以后一键复用": "指示を一度書けば、あとはワンクリックで再利用",
          "自定义模板": "カスタムテンプレート",
          "模板名称": "テンプレート名",
          "例如：客服口吻": "例：サポート担当の口調",
          "改写要求": "書き換え指示",
          "例如：把语气改成客服口吻，结尾加一句道歉，不要超过 150 字。": "例：口調をサポート担当のようにして、最後に一言お詫びを入れ、150 文字以内に収める。",
          "适用对象": "適用対象",
          "导入 JSON": "JSON をインポート",
          "导出全部": "すべてエクスポート",
          "写一句改写要求再保存。": "書き換え指示を一言書いてから保存してください。",
          "这个文件里没有可导入的模板。": "このファイルにはインポートできるテンプレートがありません。",
          "导入失败": "インポートに失敗しました",
          "自定义模板只保存在这台浏览器里，不会上传。": "カスタムテンプレートはこのブラウザー内にのみ保存され、アップロードされません。",
          "换一版": "別の版を生成",
          "另一版": "別の版",
          "基础": "基本",
          "任务简报": "タスクブリーフ",
          "目标、材料、交付、约束四段式，最通用的一档。": "目標・材料・成果物・制約の 4 段構成。最も汎用的な型です。",
          "大多数「帮我做点什么」的草稿。": "「何か手伝ってほしい」という下書きのほとんど。",
          "补上模型只能靠猜的那部分信息。": "モデルが推測するしかない情報を補います。",
          "交付契约": "成果物の契約",
          "把验收标准、输入输出和边界情况写在前面。": "受け入れ基準・入出力・境界ケースを先に書きます。",
          "结果要交给别人用，错一点就要返工。": "結果を他の人が使うため、少しの誤りでも手戻りになります。",
          "先说清「怎样算完成」，再让模型动手。": "「どうなれば完了か」を先に決めてから、モデルに作業させます。",
          "示范": "例示",
          "示例引导": "例示ガイド",
          "用两三个输入输出样例锁定风格与格式。": "2〜3 個の入出力例でスタイルと形式を固定します。",
          "你要的风格很难形容，但一看例子就懂。": "望むスタイルは言葉にしにくいが、例を見れば一目で伝わる場合。",
          "少写形容词，多给可对照的样例。": "形容詞を減らし、見比べられる例を増やします。",
          "推理": "推論",
          "推理步骤": "推論ステップ",
          "要求模型分步执行并中途自检。": "モデルに段階的に実行させ、途中で自己チェックさせます。",
          "任务有多个环节，错一步后面全歪。": "工程が複数あり、1 つ間違えると後続がすべて崩れる場合。",
          "把一次大跳跃拆成可检查的小台阶。": "一度の大きな跳躍を、確認できる小さな段階に分けます。",
          "工程": "エンジニアリング",
          "代码审阅": "コードレビュー",
          "把「帮我看看这段代码」写成一次有范围、有优先级的审阅请求。": "「このコードを見てほしい」を、範囲と優先順位を備えたレビュー依頼に変えます。",
          "要发一次代码审阅、PR 描述或安全复查。": "コードレビューや PR の説明、セキュリティ再確認を依頼する場合。",
          "审阅范围、关注点顺序和交付格式都写死，避免泛泛而谈。": "レビュー範囲・観点の順序・報告形式を固定し、漠然とした指摘を避けます。",
          "实现任务": "実装タスク",
          "把编码需求补成含验收、接口与边界处理的工程说明。": "コーディング要件を、受け入れ・インターフェース・境界処理を含むエンジニア向けの説明に仕上げます。",
          "要交给智能体或同事实现一个功能、修一个缺陷。": "Agent や同僚に機能の実装や不具合の修正を任せる場合。",
          "验收标准先行，减少「写完才发现不是这个意思」。": "受け入れ基準を先に置き、「仕上がってから違うと気づく」を減らします。",
          "SQL 查询": "SQL クエリ",
          "把一句取数需求写成口径、字段与性能约束都明确的查询任务。": "一言のデータ抽出依頼を、集計定義・項目・性能制約まで明確なクエリタスクにします。",
          "要找数、做报表或核对口径。": "数値を探す、レポートを作る、集計定義を確認する場合。",
          "时间范围、去重和空值处理先说清，少返工。": "期間・重複排除・NULL の扱いを先に決め、手戻りを減らします。",
          "结构化抽取": "構造化抽出",
          "把「从这段里取几个字段」写成带 schema 与缺失规则的抽取任务。": "「この文章から項目をいくつか抜き出して」を、スキーマと欠損ルール付きの抽出タスクにします。",
          "要从邮件、网页或对话里批量取字段。": "メール・Web ページ・会話から項目をまとめて抽出する場合。",
          "字段类型、枚举与缺失处理明确，输出可直接进程序。": "型・列挙・欠損処理が明確で、出力をそのままプログラムに渡せます。",
          "测试设计": "テスト設計",
          "把测试需求写成覆盖正常、边界、异常与权限的用例表。": "テスト要件を、正常系・境界・異常・権限を網羅するケース表にします。",
          "功能要验收，或者要补一批回归用例。": "機能の受け入れや、回帰テストケースの追加が必要な場合。",
          "用例结构与优先级固定，覆盖不再靠临场想。": "ケース構成と優先度を固定し、網羅をその場の思いつきに頼らせません。",
          "写作": "ライティング",
          "翻译本地化": "翻訳・ローカライズ",
          "把翻译需求写成带受众、术语表与格式约束的本地化任务。": "翻訳依頼を、読者・用語集・形式制約付きのローカライズタスクにします。",
          "要翻文档、界面文案或商务邮件。": "ドキュメントや UI 文言、ビジネスメールを翻訳する場合。",
          "保留变量与 Markdown 结构，不擅自增删内容。": "変数と Markdown 構造を保ち、内容を勝手に増減しません。",
          "写作润色": "文章の推敲",
          "把润色需求写成允许改动层级、禁止扩写的修订任务。": "推敲依頼を、変更できる範囲を明示し、加筆を禁じた修正タスクにします。",
          "文章、公告或说明要改得更清楚，但事实不能动。": "文章・告知・説明を分かりやすくしたいが、事実は変えられない場合。",
          "先划清能改什么、不能改什么，避免被改写成另一篇。": "変えてよい点とだめな点を先に線引きし、別物に書き換えられるのを防ぎます。",
          "资料问答": "資料に基づく Q&A",
          "把「根据这些资料回答」写成带引用与未覆盖声明的问答任务。": "「この資料に基づいて答えて」を、引用と未記載の申告を含む Q&A タスクにします。",
          "答案必须能追溯到给定资料。": "回答は与えられた資料までたどれる必要がある場合。",
          "资料没写到就说没写到，冲突时列出处。": "資料に書かれていなければその旨を述べ、矛盾する場合は出典を挙げます。",
          "迭代": "反復",
          "增量改写": "増分編集",
          "只改你指出的地方，其余原样保留。": "指摘した箇所だけを変え、それ以外はそのまま残します。",
          "上一版已经八九不离十，只差一两处。": "前の版がほぼ完成していて、あと 1〜2 か所だけ直したい場合。",
          "不让一次小修改把整段节奏改没。": "小さな修正で全体の流れまで書き換わらないようにします。",
          "角色设定": "ロール設定",
          "把一句角色描述写成智能体能长期执行的系统提示词。": "一言のロール案を、Agent が長期にわたって実行できるシステムプロンプトにします。",
          "你只有一个「让它当什么角色」的念头，细节还没想清。": "「どんな役割にするか」という着想だけで、詳細はまだ固まっていない場合。",
          "身份、职责、流程与边界一次补齐。": "身分・責務・フロー・境界を一度に整えます。",
          "Agent 人设": "Agent ペルソナ",
          "写成带说话方式与判断习惯的人格文件。": "話し方と判断の癖を備えたペルソナファイルとして書きます。",
          "你要的是一个有脾气、有取舍的长期搭档。": "好みと取捨選択を持つ、長く付き合える相棒が欲しい場合。",
          "语气、原则、会做与不会做写得具体。": "口調・原則・やること／やらないことを具体的に書きます。",
      },
      es: {
          "提示词优化": "Optimizador de prompts",
          "提示词": "Prompt",
          "迭代优化": "Iterar",
          "优化结果": "Resultado",
          "生成中": "Generando",
          "原稿": "Original",
          "展开": "Expandir",
          "收起": "Contraer",
          "复制": "Copiar",
          "已复制": "Copiado",
          "复制结果": "Copiar resultado",
          "替换草稿": "Reemplazar borrador",
          "已替换草稿 · 9 秒内可撤销": "Borrador reemplazado · deshacer en 9 s",
          "发送": "Enviar",
          "停止": "Detener",
          "重试": "Reintentar",
          "撤销": "Deshacer",
          "关闭": "Cerrar",
          "返回": "Atrás",
          "优化历史": "Historial",
          "版本对比": "Comparar versiones",
          "清空": "Borrar todo",
          "删除": "Eliminar",
          "写回": "Usar versión",
          "对比版本": "Comparar",
          "跟随当前模型": "Seguir el modelo actual",
          "模板": "Plantilla",
          "模型": "Modelo",
          "草稿已更新": "Borrador actualizado",
          "模板已切换": "Plantilla cambiada",
          "用新模板重跑": "Repetir con la plantilla",
          "开始迭代": "Empezar a iterar",
          "想在这一版上改什么？": "¿Qué quieres cambiar en esta versión?",
          "例如：把语气改得更直接，删掉示例。": "Por ejemplo: un tono más directo, sin los ejemplos.",
          "在输入框写点内容，打开后会自动优化": "Escribe algo en el cuadro de texto y se optimizará al abrirlo.",
          "正在准备…": "Preparando…",
          "输入框还是空的": "El cuadro de texto está vacío",
          "写完草稿再打开，这里会给出更清楚的版本。": "Escribe un borrador y vuelve a abrir: aquí verás una versión más clara.",
          "确认替换草稿": "¿Reemplazar el borrador?",
          "替换后 9 秒内可撤销": "Puedes deshacerlo durante 9 segundos tras reemplazar.",
          "取消": "Cancelar",
          "可参数化片段": "Fragmentos parametrizables",
          "写回模板": "Aplicar plantilla",
          "写回后仍可继续编辑": "Ya está en el borrador; sigue editando desde ahí.",
          "位置对不上，无法套用": "Las posiciones ya no coinciden, así que no se aplicó la plantilla.",
          "抽取中…": "Extrayendo…",
          "抽取变量": "Extraer variables",
          "保留优化记录？": "¿Conservar el historial de optimizaciones?",
          "记录只留在这台电脑，不会上传。": "Los registros se quedan en este equipo y no se suben a ningún sitio.",
          "不保留": "No conservar",
          "保留": "Conservar",
          "要不要留着优化记录？": "¿Activar el historial local?",
          "历史记录已关闭，可随时重新开启。": "El historial está desactivado. Puedes volver a activarlo cuando quieras.",
          "开启历史": "Activar historial",
          "还没有记录": "Aún no hay registros",
          "每完成一次优化，这里会留一份。": "Cada optimización terminada deja un registro aquí.",
          "结构变化（本机分析）": "Cambio estructural (análisis local)",
          "原稿为空": "El original está vacío",
          "草稿为空": "El borrador está vacío",
          "没有可对比的版本": "No hay versiones que comparar",
          "替换": "Reemplazar",
          "保存": "Guardar",
          "个变量": "variables",
          "版本": "v",
          "只改你指出的地方": "Solo cambia lo que indiques",
          "刚刚": "ahora mismo",
          "昨天": "ayer",
          "分钟前": "min",
          "小时前": "h",
          "字": "caracteres",
          "重试一次": "Intentar de nuevo",
          "模型没有返回内容": "El modelo no devolvió nada",
          "已替换": "Reemplazado",
          "优化中": "Optimizando",
          "清空历史": "Borrar historial",
          "确认清空": "Confirmar borrado",
          "行未显示": "líneas ocultas",
          "适合": "Ideal para",
          "写一句修改意见再开始。": "Escribe una indicación de cambio antes de empezar.",
          "删除这条": "Eliminar este registro",
          "历史只存在本机": "El historial solo está en este equipo",
          "再来一次": "Repetir",
          "原样保留": "sin cambios",
          "新增": "añadidas",
          "删除行": "eliminadas",
          "结构": "Estructura",
          "目标": "objetivo",
          "约束": "Restricciones",
          "格式": "formato",
          "示例": "Ejemplos",
          "步骤": "pasos",
          "边界": "límites",
          "验收": "aceptación",
          "体检": "Revisión",
          "重新体检": "Revisar de nuevo",
          "体检中…": "Revisando…",
          "提示词体检": "Revisión del prompt",
          "体检失败": "La revisión ha fallado",
          "综合分": "Puntuación global",
          "清晰度": "Claridad",
          "上下文": "Contexto",
          "输出格式": "Formato de salida",
          "鲁棒性": "Robustez",
          "高": "Alta",
          "中": "Media",
          "低": "Baja",
          "未发现问题": "No se han encontrado problemas",
          "这版已经没什么可挑的。": "No hay nada que objetar a esta versión.",
          "条建议，可直接替换": "sugerencias, aplicables al texto",
          "应用": "Aplicar",
          "已应用": "Aplicada",
          "位置已变，无法直接套用": "La cita se ha movido, así que no se puede aplicar directamente",
          "体检只读，不改动草稿": "La revisión es de solo lectura y no toca el borrador.",
          "再来一版": "Otra versión",
          "上一版": "Anterior",
          "最新": "Más reciente",
          "两版对比": "Dos versiones",
          "本机分析": "análisis local",
          "自定义": "Personalizado",
          "新建自定义模板": "Nueva plantilla personalizada",
          "写好要求，以后一键复用": "Escribe la instrucción una vez y reutilízala en un clic",
          "自定义模板": "Plantilla personalizada",
          "模板名称": "Nombre de la plantilla",
          "例如：客服口吻": "p. ej.: tono de atención al cliente",
          "改写要求": "Instrucción de reescritura",
          "例如：把语气改成客服口吻，结尾加一句道歉，不要超过 150 字。": "p. ej.: usa un tono de atención al cliente, termina con una disculpa y no pases de 150 palabras.",
          "适用对象": "Se aplica a",
          "导入 JSON": "Importar JSON",
          "导出全部": "Exportar todo",
          "写一句改写要求再保存。": "Escribe una instrucción de reescritura antes de guardar.",
          "这个文件里没有可导入的模板。": "Este archivo no contiene plantillas que se puedan importar.",
          "导入失败": "Error al importar",
          "自定义模板只保存在这台浏览器里，不会上传。": "Las plantillas personalizadas se quedan en este navegador; no se sube nada.",
          "换一版": "Generar otra versión",
          "另一版": "Otra",
          "基础": "Básico",
          "任务简报": "Ficha de la tarea",
          "目标、材料、交付、约束四段式，最通用的一档。": "Objetivo, material, entrega y restricciones en cuatro partes; la opción más general.",
          "大多数「帮我做点什么」的草稿。": "La mayoría de los borradores del tipo «ayúdame con algo».",
          "补上模型只能靠猜的那部分信息。": "Rellena la parte que el modelo tendría que adivinar.",
          "交付契约": "Contrato de entrega",
          "把验收标准、输入输出和边界情况写在前面。": "Pone por delante los criterios de aceptación, las entradas y salidas y los casos límite.",
          "结果要交给别人用，错一点就要返工。": "El resultado lo usará otra persona y cualquier error obliga a rehacerlo.",
          "先说清「怎样算完成」，再让模型动手。": "Define qué significa «terminado» antes de que el modelo se ponga a ello.",
          "示范": "Ejemplos",
          "示例引导": "Ejemplos guiados",
          "用两三个输入输出样例锁定风格与格式。": "Fija el estilo y el formato con dos o tres ejemplos de entrada y salida.",
          "你要的风格很难形容，但一看例子就懂。": "El estilo que quieres es difícil de describir, pero se entiende en cuanto ves un ejemplo.",
          "少写形容词，多给可对照的样例。": "Menos adjetivos y más ejemplos que se puedan comparar.",
          "推理": "Razonamiento",
          "推理步骤": "Pasos de razonamiento",
          "要求模型分步执行并中途自检。": "Pide al modelo que avance paso a paso y se revise por el camino.",
          "任务有多个环节，错一步后面全歪。": "La tarea tiene varias fases y un paso mal desvía todo lo demás.",
          "把一次大跳跃拆成可检查的小台阶。": "Divide un salto grande en escalones que se puedan comprobar.",
          "工程": "Ingeniería",
          "代码审阅": "Revisión de código",
          "把「帮我看看这段代码」写成一次有范围、有优先级的审阅请求。": "Convierte «échale un vistazo a este código» en una solicitud de revisión con alcance y prioridades.",
          "要发一次代码审阅、PR 描述或安全复查。": "Vas a pedir una revisión de código, una descripción de PR o una comprobación de seguridad.",
          "审阅范围、关注点顺序和交付格式都写死，避免泛泛而谈。": "Fija el alcance, el orden de los puntos y el formato del informe para evitar generalidades.",
          "实现任务": "Tarea de implementación",
          "把编码需求补成含验收、接口与边界处理的工程说明。": "Convierte una petición de código en una especificación de ingeniería con criterios de aceptación e interfaces.",
          "要交给智能体或同事实现一个功能、修一个缺陷。": "Un agente o un compañero va a implementar una función o corregir un fallo.",
          "验收标准先行，减少「写完才发现不是这个意思」。": "Los criterios de aceptación van primero, para no descubrir al final que no era eso.",
          "SQL 查询": "Consulta SQL",
          "把一句取数需求写成口径、字段与性能约束都明确的查询任务。": "Convierte una petición de datos en una consulta con granularidad, columnas y límites de rendimiento explícitos.",
          "要找数、做报表或核对口径。": "Necesitas datos, un informe o comprobar una definición.",
          "时间范围、去重和空值处理先说清，少返工。": "Rango temporal, deduplicación y nulos resueltos antes de lanzar la consulta.",
          "结构化抽取": "Extracción estructurada",
          "把「从这段里取几个字段」写成带 schema 与缺失规则的抽取任务。": "Convierte «saca unos campos de aquí» en una tarea de extracción con un esquema y reglas para los valores ausentes.",
          "要从邮件、网页或对话里批量取字段。": "Vas a sacar campos de correos, páginas o conversaciones en volumen.",
          "字段类型、枚举与缺失处理明确，输出可直接进程序。": "Con tipos, enumeraciones y reglas de ausencia claros, la salida se puede usar directamente en un programa.",
          "测试设计": "Diseño de pruebas",
          "把测试需求写成覆盖正常、边界、异常与权限的用例表。": "Convierte una petición de pruebas en una tabla de casos que cubra el camino normal, los límites, los fallos y los permisos.",
          "功能要验收，或者要补一批回归用例。": "Hay que aceptar una función o falta un conjunto de pruebas de regresión.",
          "用例结构与优先级固定，覆盖不再靠临场想。": "Una estructura y unas prioridades fijas evitan improvisar la cobertura.",
          "写作": "Redacción",
          "翻译本地化": "Traducción",
          "把翻译需求写成带受众、术语表与格式约束的本地化任务。": "Convierte una petición de traducción en una tarea de localización con público, glosario y formato.",
          "要翻文档、界面文案或商务邮件。": "Vas a traducir documentación, textos de interfaz o correos profesionales.",
          "保留变量与 Markdown 结构，不擅自增删内容。": "Mantiene las variables y la estructura Markdown en lugar de reescribir por su cuenta.",
          "写作润色": "Pulido de texto",
          "把润色需求写成允许改动层级、禁止扩写的修订任务。": "Convierte «hazlo mejor» en una tarea de revisión con límites de edición explícitos.",
          "文章、公告或说明要改得更清楚，但事实不能动。": "Un texto tiene que leerse mejor sin que cambien los hechos.",
          "先划清能改什么、不能改什么，避免被改写成另一篇。": "Deja claro desde el principio qué se puede tocar y qué no.",
          "资料问答": "Preguntas sobre documentos",
          "把「根据这些资料回答」写成带引用与未覆盖声明的问答任务。": "Convierte «responde según estos documentos» en una tarea de preguntas y respuestas que cite las fuentes y admita lo que no cubren.",
          "答案必须能追溯到给定资料。": "La respuesta tiene que poder rastrearse hasta el material dado.",
          "资料没写到就说没写到，冲突时列出处。": "Si el material no lo dice, dilo; si hay conflicto, indica las fuentes.",
          "迭代": "Iteración",
          "增量改写": "Edición incremental",
          "只改你指出的地方，其余原样保留。": "Cambia lo que indiques y deja el resto intacto.",
          "上一版已经八九不离十，只差一两处。": "La última versión está casi lista y solo fallan uno o dos puntos.",
          "不让一次小修改把整段节奏改没。": "Evita que un cambio pequeño se lleve por delante el ritmo del conjunto.",
          "角色设定": "Contrato de rol",
          "把一句角色描述写成智能体能长期执行的系统提示词。": "Convierte una idea de rol en un prompt de sistema que un agente pueda seguir durante semanas.",
          "你只有一个「让它当什么角色」的念头，细节还没想清。": "Tienes claro el rol que quieres, pero aún no los detalles.",
          "身份、职责、流程与边界一次补齐。": "Identidad, funciones, flujo de trabajo y límites en una sola pasada.",
          "Agent 人设": "Persona del Agent",
          "写成带说话方式与判断习惯的人格文件。": "Escribe un archivo de personalidad con una voz y unos hábitos de criterio.",
          "你要的是一个有脾气、有取舍的长期搭档。": "Quieres un compañero de largo plazo con carácter y criterio.",
          "语气、原则、会做与不会做写得具体。": "Tono, principios y límites concretos sobre lo que hará y lo que no.",
      },
      fr: {
          "提示词优化": "Optimiseur de prompts",
          "提示词": "Prompt",
          "迭代优化": "Optimisation itérative",
          "优化结果": "Résultat",
          "生成中": "Génération en cours",
          "原稿": "Source",
          "展开": "Développer",
          "收起": "Réduire",
          "复制": "Copier",
          "已复制": "Copié",
          "复制结果": "Copier le résultat",
          "替换草稿": "Remplacer le brouillon",
          "已替换草稿 · 9 秒内可撤销": "Brouillon remplacé · annulation possible pendant 9 s",
          "发送": "Envoyer",
          "停止": "Arrêter",
          "重试": "Réessayer",
          "撤销": "Annuler",
          "关闭": "Fermer",
          "返回": "Retour",
          "优化历史": "Historique",
          "版本对比": "Comparer les versions",
          "清空": "Effacer",
          "删除": "Supprimer",
          "写回": "Utiliser cette version",
          "对比版本": "Comparer",
          "跟随当前模型": "Suivre le modèle actuel",
          "模板": "Modèle",
          "模型": "Modèle de langage",
          "草稿已更新": "Brouillon mis à jour",
          "模板已切换": "Modèle changé",
          "用新模板重跑": "Relancer avec le nouveau modèle",
          "开始迭代": "Itérer",
          "想在这一版上改什么？": "Que faut-il changer dans cette version ?",
          "例如：把语气改得更直接，删掉示例。": "Par exemple : un ton plus direct, sans les exemples.",
          "在输入框写点内容，打开后会自动优化": "Écrivez un peu de texte dans le champ de saisie : l'optimisation se fait automatiquement à l'ouverture.",
          "正在准备…": "Préparation…",
          "输入框还是空的": "Le champ de saisie est vide",
          "写完草稿再打开，这里会给出更清楚的版本。": "Écrivez un brouillon puis rouvrez ce panneau : vous obtiendrez une version plus claire.",
          "确认替换草稿": "Remplacer le brouillon ?",
          "替换后 9 秒内可撤销": "Vous pouvez annuler pendant 9 secondes après le remplacement.",
          "取消": "Annuler",
          "可参数化片段": "Fragments paramétrables",
          "写回模板": "Appliquer le modèle",
          "写回后仍可继续编辑": "Une fois appliqué, vous pouvez continuer à modifier.",
          "位置对不上，无法套用": "Les positions ne correspondent plus : le modèle n'a pas été appliqué.",
          "抽取中…": "Extraction…",
          "抽取变量": "Extraire les variables",
          "保留优化记录？": "Conserver l'historique ?",
          "记录只留在这台电脑，不会上传。": "Les enregistrements restent sur cet ordinateur et ne sont jamais envoyés.",
          "不保留": "Ne pas conserver",
          "保留": "Conserver",
          "要不要留着优化记录？": "Activer l'historique local ?",
          "历史记录已关闭，可随时重新开启。": "L'historique est désactivé. Vous pouvez le réactiver à tout moment.",
          "开启历史": "Activer l'historique",
          "还没有记录": "Aucun enregistrement",
          "每完成一次优化，这里会留一份。": "Chaque optimisation terminée ajoute une entrée ici.",
          "结构变化（本机分析）": "Évolution de la structure (analyse locale)",
          "原稿为空": "La source est vide",
          "草稿为空": "Le brouillon est vide",
          "没有可对比的版本": "Aucune version à comparer",
          "替换": "Remplacer",
          "保存": "Enregistrer",
          "个变量": "variables",
          "版本": "v",
          "只改你指出的地方": "Ne changez que ce que vous signalez",
          "刚刚": "à l'instant",
          "昨天": "Hier",
          "分钟前": "min",
          "小时前": "h",
          "字": "caractères",
          "重试一次": "Réessayer",
          "模型没有返回内容": "Le modèle n'a rien renvoyé",
          "已替换": "Remplacé",
          "优化中": "Optimisation en cours",
          "清空历史": "Effacer l'historique",
          "确认清空": "Confirmer l'effacement",
          "行未显示": "lignes masquées",
          "适合": "Idéal pour",
          "写一句修改意见再开始。": "Écrivez une consigne de modification avant de commencer.",
          "删除这条": "Supprimer cette entrée",
          "历史只存在本机": "L'historique reste sur cet appareil",
          "再来一次": "Relancer",
          "原样保留": "inchangé",
          "新增": "ajouté",
          "删除行": "supprimé",
          "结构": "Structure",
          "目标": "Objectif",
          "约束": "Contraintes",
          "格式": "Format",
          "示例": "Exemples",
          "步骤": "Étapes",
          "边界": "Limites",
          "验收": "Acceptation",
          "体检": "Diagnostic",
          "重新体检": "Relancer le diagnostic",
          "体检中…": "Diagnostic en cours…",
          "提示词体检": "Diagnostic du prompt",
          "体检失败": "Échec du diagnostic",
          "综合分": "Score global",
          "清晰度": "Clarté",
          "上下文": "Contexte",
          "输出格式": "Format de sortie",
          "鲁棒性": "Robustesse",
          "高": "Élevé",
          "中": "Moyen",
          "低": "Faible",
          "未发现问题": "Aucun problème détecté",
          "这版已经没什么可挑的。": "Il n'y a plus rien à redire dans cette version.",
          "条建议，可直接替换": "suggestions à appliquer directement",
          "应用": "Appliquer",
          "已应用": "Appliqué",
          "位置已变，无法直接套用": "Le passage a bougé : cette correction ne peut pas être appliquée directement.",
          "体检只读，不改动草稿": "Le diagnostic est en lecture seule et ne modifie pas le brouillon.",
          "再来一版": "Une autre version",
          "上一版": "Précédente",
          "最新": "Dernière",
          "两版对比": "Comparer deux versions",
          "本机分析": "analyse locale",
          "自定义": "Personnalisé",
          "新建自定义模板": "Nouveau modèle personnalisé",
          "写好要求，以后一键复用": "Écrivez la consigne une fois, réutilisez-la ensuite en un clic.",
          "自定义模板": "Modèle personnalisé",
          "模板名称": "Nom du modèle",
          "例如：客服口吻": "Ex. : ton du service client",
          "改写要求": "Consigne de réécriture",
          "例如：把语气改成客服口吻，结尾加一句道歉，不要超过 150 字。": "Ex. : adoptez le ton du service client, terminez par une excuse, sans dépasser 150 caractères.",
          "适用对象": "S'applique à",
          "导入 JSON": "Importer un JSON",
          "导出全部": "Tout exporter",
          "写一句改写要求再保存。": "Écrivez une consigne de réécriture avant d'enregistrer.",
          "这个文件里没有可导入的模板。": "Ce fichier ne contient aucun modèle à importer.",
          "导入失败": "Échec de l'import",
          "自定义模板只保存在这台浏览器里，不会上传。": "Les modèles personnalisés restent dans ce navigateur : rien n'est envoyé.",
          "换一版": "Générer une autre version",
          "另一版": "Autre version",
          "基础": "Bases",
          "任务简报": "Cadrage de tâche",
          "目标、材料、交付、约束四段式，最通用的一档。": "Quatre sections — objectif, matière, livrable, contraintes — pour la réécriture la plus polyvalente.",
          "大多数「帮我做点什么」的草稿。": "La plupart des brouillons du type « aidez-moi à faire quelque chose ».",
          "补上模型只能靠猜的那部分信息。": "Comble les informations que le modèle ne pourrait que deviner.",
          "交付契约": "Contrat de livraison",
          "把验收标准、输入输出和边界情况写在前面。": "Place les critères d'acceptation, les entrées-sorties et les cas limites en tête.",
          "结果要交给别人用，错一点就要返工。": "Le résultat sera utilisé par quelqu'un d'autre : la moindre erreur impose de refaire.",
          "先说清「怎样算完成」，再让模型动手。": "Définit ce qui est considéré comme terminé avant que le modèle ne s'y mette.",
          "示范": "Exemples",
          "示例引导": "Exemples guidés",
          "用两三个输入输出样例锁定风格与格式。": "Fixe le style et le format avec deux ou trois exemples d'entrée-sortie.",
          "你要的风格很难形容，但一看例子就懂。": "Le style voulu est difficile à décrire, mais évident dès qu'on voit un exemple.",
          "少写形容词，多给可对照的样例。": "Moins d'adjectifs, plus d'exemples comparables.",
          "推理": "Raisonnement",
          "推理步骤": "Étapes de raisonnement",
          "要求模型分步执行并中途自检。": "Demande au modèle d'avancer par étapes et de se vérifier en cours de route.",
          "任务有多个环节，错一步后面全歪。": "La tâche comporte plusieurs étapes : une erreur et tout le reste part de travers.",
          "把一次大跳跃拆成可检查的小台阶。": "Découpe un grand saut en petites étapes vérifiables.",
          "工程": "Ingénierie",
          "代码审阅": "Relecture de code",
          "把「帮我看看这段代码」写成一次有范围、有优先级的审阅请求。": "Transforme « regarde ce code » en demande de relecture cadrée et priorisée.",
          "要发一次代码审阅、PR 描述或安全复查。": "Vous demandez une relecture, une description de PR ou un contrôle de sécurité.",
          "审阅范围、关注点顺序和交付格式都写死，避免泛泛而谈。": "Fixe le périmètre, l'ordre des points à examiner et le format du rapport, pour éviter les généralités.",
          "实现任务": "Tâche d'implémentation",
          "把编码需求补成含验收、接口与边界处理的工程说明。": "Complète une demande de code en spécification d'ingénierie avec critères d'acceptation, interfaces et gestion des cas limites.",
          "要交给智能体或同事实现一个功能、修一个缺陷。": "Un agent ou un collègue doit implémenter une fonctionnalité ou corriger un défaut.",
          "验收标准先行，减少「写完才发现不是这个意思」。": "Les critères d'acceptation d'abord : on évite de découvrir après coup que ce n'était pas le sens voulu.",
          "SQL 查询": "Requête SQL",
          "把一句取数需求写成口径、字段与性能约束都明确的查询任务。": "Transforme une demande de données en requête explicite sur la définition, les champs et les contraintes de performance.",
          "要找数、做报表或核对口径。": "Vous cherchez des données, un rapport ou une vérification de définition.",
          "时间范围、去重和空值处理先说清，少返工。": "Plage temporelle, dédoublonnage et valeurs nulles réglés d'avance : moins de retouches.",
          "结构化抽取": "Extraction structurée",
          "把「从这段里取几个字段」写成带 schema 与缺失规则的抽取任务。": "Transforme « extrais quelques champs de ce texte » en tâche d'extraction avec schéma et règles pour les valeurs manquantes.",
          "要从邮件、网页或对话里批量取字段。": "Vous extrayez des champs en masse depuis des e-mails, des pages ou des conversations.",
          "字段类型、枚举与缺失处理明确，输出可直接进程序。": "Types, énumérations et valeurs manquantes explicites : la sortie est directement exploitable par un programme.",
          "测试设计": "Conception de tests",
          "把测试需求写成覆盖正常、边界、异常与权限的用例表。": "Transforme un besoin de test en tableau de cas couvrant le chemin nominal, les limites, les erreurs et les droits.",
          "功能要验收，或者要补一批回归用例。": "Une fonctionnalité est à recetter, ou il manque une série de tests de non-régression.",
          "用例结构与优先级固定，覆盖不再靠临场想。": "Structure et priorité des cas fixées : la couverture ne s'improvise plus.",
          "写作": "Rédaction",
          "翻译本地化": "Traduction et localisation",
          "把翻译需求写成带受众、术语表与格式约束的本地化任务。": "Transforme une demande de traduction en tâche de localisation précisant le public, le glossaire et les contraintes de format.",
          "要翻文档、界面文案或商务邮件。": "Vous traduisez de la documentation, des libellés d'interface ou des e-mails professionnels.",
          "保留变量与 Markdown 结构，不擅自增删内容。": "Préserve les variables et la structure Markdown sans rien ajouter ni retirer.",
          "写作润色": "Peaufinage de texte",
          "把润色需求写成允许改动层级、禁止扩写的修订任务。": "Transforme « rends ça mieux » en tâche de révision qui délimite les retouches autorisées et interdit les ajouts.",
          "文章、公告或说明要改得更清楚，但事实不能动。": "Un article, une annonce ou une notice doit se lire mieux, sans que les faits changent.",
          "先划清能改什么、不能改什么，避免被改写成另一篇。": "Délimite d'emblée ce qui peut être modifié et ce qui ne doit pas l'être, pour éviter une réécriture complète.",
          "资料问答": "Questions-réponses sur documents",
          "把「根据这些资料回答」写成带引用与未覆盖声明的问答任务。": "Transforme « réponds d'après ces documents » en tâche de questions-réponses avec citations et mention des points non couverts.",
          "答案必须能追溯到给定资料。": "La réponse doit être traçable jusqu'aux documents fournis.",
          "资料没写到就说没写到，冲突时列出处。": "Signale ce que les documents ne disent pas et, en cas de contradiction, cite les sources.",
          "迭代": "Itération",
          "增量改写": "Réécriture incrémentale",
          "只改你指出的地方，其余原样保留。": "Ne modifie que ce que vous signalez, le reste est laissé tel quel.",
          "上一版已经八九不离十，只差一两处。": "La version précédente est presque bonne, il ne reste qu'une ou deux retouches.",
          "不让一次小修改把整段节奏改没。": "Évite qu'une petite correction ne réécrive tout le passage.",
          "角色设定": "Contrat de rôle",
          "把一句角色描述写成智能体能长期执行的系统提示词。": "Transforme une phrase de rôle en prompt système qu'un agent peut suivre durablement.",
          "你只有一个「让它当什么角色」的念头，细节还没想清。": "Vous avez l'idée du rôle, mais pas encore les détails.",
          "身份、职责、流程与边界一次补齐。": "Identité, missions, processus et limites en une seule passe.",
          "Agent 人设": "Persona d'agent",
          "写成带说话方式与判断习惯的人格文件。": "Rédige un fichier de persona décrivant sa façon de parler et ses réflexes de jugement.",
          "你要的是一个有脾气、有取舍的长期搭档。": "Vous voulez un partenaire durable, avec du caractère et des partis pris.",
          "语气、原则、会做与不会做写得具体。": "Ton, principes, ce qu'il fait et ce qu'il refuse : tout est explicite.",
      },
    };
    /* @messages-end */

    const identityT = (key) => key;

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

    let activeLocale = "zh";

    /** Locale-aware timestamps; the caller supplies t so it follows dictionary updates. */
    function timeLabel(timestamp, t) {
      const then = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - then.getTime();
      if (diff < 60_000) return t("刚刚");
      if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} ${t("分钟前")}`;
      const hhmm = new Intl.DateTimeFormat(activeLocale, { hour: "2-digit", minute: "2-digit", hour12: false }).format(then);
      if (then.toDateString() === now.toDateString()) return hhmm;
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (then.toDateString() === yesterday.toDateString()) return `${t("昨天")} ${hhmm}`;
      return new Intl.DateTimeFormat(activeLocale, { month: "short", day: "numeric" }).format(then);
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
      const T = typeof props.t === "function" ? props.t : identityT;

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
          template: template.label,
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
          h("span", null, templateRow ? T(templateRow.label) : T("模板")),
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
                h("span", null, timeLabel(entry.at, T)),
                h("span", null, "·"),
                h("span", null, T(entry.template || entry.templateId)),
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
            h("span", null, `v${Math.max(1, chain.findIndex((row) => row.id === cmpEntry.id) + 1)} · ${timeLabel(cmpEntry.at, T)}`),
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
        h("span", { className: "po-meta", title: templateRow ? T(templateRow.useWhen) : "" }, templateRow ? T(templateRow.useWhen) : ""),
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
            // A body portal keeps the panel out of the header's drag region.
            "data-window-drag-exclude": "",
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
          "data-window-drag-exclude": "",
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
                title: `v${version} · ${timeLabel(entry.at, T)}`,
                notes: [T(entry.template)],
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
              title: T(row.label),
              notes: [T(row.description), `${T("适合")}：${T(row.useWhen)}`],
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
        const readLocale = () => {
          const active = ctx.locale?.getSnapshot?.().active;
          if (typeof active === "string" && active) activeLocale = active;
        };
        readLocale();
        ctx.effect(() => ctx.locale.subscribe(readLocale), "prompt-optimize: follow the locale preference");
        ctx.effect(() => ctx.locale.register(NS, MESSAGES), "prompt-optimize: dictionaries");
        ctx.slots.inject("conversation.input.right", () => ctx.slots.register({
          name: "conversation.input.right",
          id: "prompt-optimize",
          order: 5,
          locale: NS,
        }, PromptOptimizer));
      },
      inject: ["slots", "locale"],
      __diffLines: diffLines,
      __collapseDiff: collapseDiff,
      __analyzeChange: analyzeChange,
      __usageLabel: usageLabel,
      __messages: MESSAGES,
      __ns: NS,
      __timeLabel: timeLabel,
    };
    return exports;
  },
});

// ===== DEBUG BLOCK: find who injects the FB SDK =====
(function () {
  const FB_HOST = "connect.facebook.net";
  const origAppendChild = Element.prototype.appendChild;
  const origInsertBefore = Element.prototype.insertBefore;
  const origCreateElement = Document.prototype.createElement;

  function report(where, node) {
    try {
      // capture a stack to see the initiator
      // eslint-disable-next-line no-new
      const err = new Error(`[FB SDK BLOCKED] via ${where}: ${node?.src || node}`);
      console.groupCollapsed("[FB SDK] Blocked insertion");
      console.log("Where:", where);
      console.log("Node:", node);
      console.log("Stack:", err.stack);
      console.groupEnd();
    } catch {}
  }

  function guard(fn, where) {
    return function (node, ...rest) {
      try {
        if (
          node &&
          node.tagName === "SCRIPT" &&
          typeof node.src === "string" &&
          node.src.includes(FB_HOST)
        ) {
          report(where, node);
          return node; // block
        }
      } catch {}
      return fn.call(this, node, ...rest);
    };
  }

  Element.prototype.appendChild = guard(origAppendChild, "appendChild");
  Element.prototype.insertBefore = guard(origInsertBefore, "insertBefore");

  Document.prototype.createElement = function (...args) {
    const el = origCreateElement.apply(this, args);
    try {
      if ((args[0] + "").toLowerCase() === "script") {
        const desc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "src");
        if (desc && desc.set) {
          Object.defineProperty(el, "src", {
            set(v) {
              if (typeof v === "string" && v.includes(FB_HOST)) {
                report("createElement.src=", v);
                return; // swallow
              }
              return desc.set.call(this, v);
            },
            get() {
              return desc.get.call(this);
            },
            configurable: true,
            enumerable: true,
          });
        }
      }
    } catch {}
    return el;
  };
})();




import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

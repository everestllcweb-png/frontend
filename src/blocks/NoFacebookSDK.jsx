// src/blocks/NoFacebookSDK.jsx
import { useEffect } from "react";

/**
 * Blocks Facebook JS SDK + Pixel at runtime (dev & prod) and removes any
 * XFBML containers that slipped in. Safe to keep always mounted.
 */
export default function NoFacebookSDK() {
  useEffect(() => {
    const FB_HOST = "connect.facebook.net";
    const PIXEL_HOST = "connect.facebook.net"; // fbevents.js is here
    const PIXEL_IMG = "facebook.com/tr";        // pixel image beacons

    // 1) Remove already-added SDK bits
    const nuke = () => {
      // remove scripts
      document.querySelectorAll(`script[src*="${FB_HOST}"]`).forEach(s => s.remove());
      document.querySelectorAll(`script[src*="fbevents.js"]`).forEach(s => s.remove());
      // remove XFBML containers + root
      const root = document.getElementById("fb-root");
      if (root) root.remove();
      document.querySelectorAll(".fb-page,.fb-post,.fb-video,.fb-customerchat").forEach(n => n.remove());
      // disable globals
      try { if (window.FB) delete window.FB; } catch {}
      window.FB = undefined;
      window.fbAsyncInit = () => {};
      // Neutralize pixel global if present
      try { if (window.fbq) delete window.fbq; } catch {}
      window.fbq = function(){ /* no-op */ };
      window._fbq = window.fbq;
    };
    nuke();

    // 2) Monkey-patch DOM APIs to block future insertions
    const patch = (proto, method) => {
      const orig = proto[method];
      const guarded = function(node, ...rest) {
        try {
          const isScript = node && node.tagName === "SCRIPT";
          const src = isScript ? (node.src || "") : "";
          if (
            (isScript && src.includes(FB_HOST)) ||
            (isScript && src.includes("fbevents.js"))
          ) {
            return node; // block
          }
        } catch {}
        return orig.call(this, node, ...rest);
      };
      proto[method] = guarded;
      return () => { proto[method] = orig; };
    };

    const unpatches = [
      patch(Element.prototype, "appendChild"),
      patch(Element.prototype, "insertBefore"),
    ];

    // 3) Intercept script src setAttribute and property assignment
    const ScriptProto = window.HTMLScriptElement?.prototype;
    let restoreSetAttr, restoreSrcProp;
    if (ScriptProto) {
      const origSetAttribute = ScriptProto.setAttribute;
      restoreSetAttr = () => { ScriptProto.setAttribute = origSetAttribute; };
      ScriptProto.setAttribute = function(name, value) {
        try {
          if (
            name?.toLowerCase() === "src" &&
            typeof value === "string" &&
            (value.includes(FB_HOST) || value.includes("fbevents.js"))
          ) {
            return; // block
          }
        } catch {}
        return origSetAttribute.call(this, name, value);
      };

      const desc = Object.getOwnPropertyDescriptor(ScriptProto, "src");
      if (desc && desc.set && desc.get) {
        Object.defineProperty(ScriptProto, "src", {
          configurable: true,
          enumerable: desc.enumerable,
          get() { return desc.get.call(this); },
          set(v) {
            try {
              if (typeof v === "string" && (v.includes(FB_HOST) || v.includes("fbevents.js"))) {
                return; // block
              }
            } catch {}
            return desc.set.call(this, v);
          }
        });
        restoreSrcProp = () => Object.defineProperty(ScriptProto, "src", desc);
      }
    }

    // 4) Block Pixel image beacons
    const ImageProto = window.Image?.prototype;
    let restoreImgSrc;
    if (ImageProto) {
      const descImg = Object.getOwnPropertyDescriptor(ImageProto, "src");
      if (descImg?.set && descImg?.get) {
        Object.defineProperty(ImageProto, "src", {
          configurable: true,
          enumerable: descImg.enumerable,
          get() { return descImg.get.call(this); },
          set(v) {
            try {
              if (typeof v === "string" && v.includes(PIXEL_IMG)) {
                return; // block pixel beacon
              }
            } catch {}
            return descImg.set.call(this, v);
          }
        });
        restoreImgSrc = () => Object.defineProperty(ImageProto, "src", descImg);
      }
    }

    // 5) As a fallback, remove late scripts via MutationObserver
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node?.nodeType === 1 && node.tagName === "SCRIPT") {
            const src = node.src || "";
            if (src.includes(FB_HOST) || src.includes("fbevents.js")) {
              node.remove();
            }
          }
        });
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });

    // Cleanup
    return () => {
      mo.disconnect();
      unpatches.forEach(fn => fn && fn());
      restoreSetAttr && restoreSetAttr();
      restoreSrcProp && restoreSrcProp();
      restoreImgSrc && restoreImgSrc();
    };
  }, []);

  return null;
}

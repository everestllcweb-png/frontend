import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // ✅ remove TypeScript syntax
  const [isMobile, setIsMobile] = React.useState(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // initialize on mount
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    // listen for window width changes
    mql.addEventListener("change", onChange);

    return () => {
      mql.removeEventListener("change", onChange);
    };
  }, []);

  // return a strict boolean
  return !!isMobile;
}

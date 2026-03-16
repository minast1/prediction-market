import { useEffect, useState } from "react";

const useMedia = () => {
  // 1. Define Tailwind default breakpoints
  const queries = {
    isMobile: "(max-width: 767px)", // Up to small tablet
    isMd: "(min-width: 768px)", // Tablet and up
    isLg: "(min-width: 1024px)", // Desktop and up
  };

  // 2. Initialize state
  const [matches, setMatches] = useState({
    isMobile: false,
    isMd: false,
    isLg: false,
  });

  useEffect(() => {
    // SSR Check: Ensure window exists
    if (typeof window === "undefined") return;

    // Create Media Query Lists (MQL)
    const mqls = {
      isMobile: window.matchMedia(queries.isMobile),
      isMd: window.matchMedia(queries.isMd),
      isLg: window.matchMedia(queries.isLg),
    };

    // Handler to sync state with MQL matches
    const getMatches = () => ({
      isMobile: mqls.isMobile.matches,
      isMd: mqls.isMd.matches,
      isLg: mqls.isLg.matches,
    });

    // Set initial state
    setMatches(getMatches());

    // Listener for changes
    const handleChange = () => setMatches(getMatches());

    // Attach listeners (Modern browsers use addEventListener)
    Object.values(mqls).forEach(mql => {
      mql.addEventListener("change", handleChange);
    });

    // Cleanup
    return () => {
      Object.values(mqls).forEach(mql => {
        mql.removeEventListener("change", handleChange);
      });
    };
  }, []);

  return matches;
};

export default useMedia;

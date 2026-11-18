"use client";

import * as React from "react";

/** Year the page was written. Shown until the browser supplies the real one. */
const FALLBACK_YEAR = 2026;

/**
 * The current year. The page is prerendered, and reading the clock while
 * rendering is not allowed there, so the real year is set after it loads.
 */
export function Year() {
  const [year, setYear] = React.useState(FALLBACK_YEAR);
  React.useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);
  return <span>{year}</span>;
}

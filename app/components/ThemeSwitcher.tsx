"use client";

import { useEffect, useRef, type ChangeEvent } from "react";

export default function ThemeSwitcher() {
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("golden-rewards-theme");
    if (savedTheme === "pink" || savedTheme === "gold-purple") {
      document.documentElement.dataset.theme = savedTheme;
      if (selectRef.current) {
        selectRef.current.value = savedTheme;
      }
    }
  }, []);

  function handleThemeChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (value !== "pink" && value !== "gold-purple") {
      return;
    }

    document.documentElement.dataset.theme = value;
    window.localStorage.setItem("golden-rewards-theme", value);
  }

  return (
    <label className="theme-switcher">
      <span>Theme</span>
      <select ref={selectRef} aria-label="Color theme" defaultValue="pink" onChange={handleThemeChange}>
        <option value="pink">Hot pink</option>
        <option value="gold-purple">Gold &amp; purple</option>
      </select>
    </label>
  );
}

// Runs before hydration so first paint already has the right theme (avoids
// a light->dark flash). New visitors with nothing in localStorage default
// to light, per product decision — theme is opt-in to dark, not
// system-preference-driven.
const THEME_INIT_SCRIPT = `(function () {
  try {
    var stored = localStorage.getItem("rotanza:theme");
    var theme = stored === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();`;

export function ThemeInitScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}

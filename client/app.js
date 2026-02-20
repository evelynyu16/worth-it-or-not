// client/app.js
// Hash router + glass nav (dark-only, no theme toggle)

import { renderHome } from "./pages/home.js";
import { renderSubmit } from "./pages/submit.js";
import { renderProfile } from "./pages/profile.js";

function forceDark() {
  // Always dark
  document.documentElement.setAttribute("data-theme", "dark");

  // Also remove any saved theme from older versions
  try {
    localStorage.removeItem("won_theme");
  } catch (_) {}
}

function setActiveLink(route) {
  const pills = document.querySelectorAll(".navPill[data-route]");
  pills.forEach((a) => {
    a.classList.toggle("active", a.getAttribute("data-route") === route);
  });
}

function renderNav() {
  const nav = document.createElement("nav");
  nav.className = "topNav";

  // ✅ no theme button at all
  nav.innerHTML = `
    <div class="navInner">
      <a class="brand" href="#/" aria-label="Go to Home">
        <span class="brandTitle">Worth It or Not</span>
      </a>

      <div class="navCenter">
        <a class="navPill" href="#/" data-route="home">Home</a>
        <a class="navPill" href="#/submit" data-route="submit">Submit</a>
        <a class="navPill" href="#/profile" data-route="profile">Profile</a>
      </div>
    </div>
  `;

  const oldNav = document.querySelector("nav");
  if (oldNav) oldNav.replaceWith(nav);
  else document.body.prepend(nav);
}

async function renderRoute() {
  const app = document.getElementById("app") || document.querySelector("main");
  if (!app) return;

  const hash = window.location.hash || "#/";
  const route = hash.replace("#/", "").trim();

  if (route === "" || route === "/") {
    setActiveLink("home");
    await renderHome(app);
    return;
  }

  if (route === "submit") {
    setActiveLink("submit");
    renderSubmit(app);
    return;
  }

  if (route === "profile") {
    setActiveLink("profile");
    renderProfile(app);
    return;
  }

  setActiveLink("");
  app.innerHTML = `<h2>Not found</h2><p>Try going back to <a href="#/">Home</a>.</p>`;
}

function start() {
  forceDark();
  renderNav();
  renderRoute();
  window.addEventListener("hashchange", () => renderRoute());
}

start();
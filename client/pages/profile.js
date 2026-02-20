import { createProfile, fetchPosts } from "../api.js";

const LS_PROFILE_ID = "won_profile_id";
const LS_PROFILE_NAME = "won_profile_name";

export async function renderProfile(container) {
  const profileId = localStorage.getItem(LS_PROFILE_ID);
  const profileName = localStorage.getItem(LS_PROFILE_NAME);

  container.innerHTML = `
    <section class="page">
      <header class="pageHeader">
        <h1 class="sectionTitle">Profile</h1>
        <p class="subtle">
          This is just a nickname (no password). It helps the app know which posts are yours.
        </p>
      </header>

      <div class="card formCard">
        <div class="formGrid">
          <div>
            <label>Current profile</label>
            <p class="subtle">
              ${
                profileId
                  ? `<strong>${escapeHtml(profileName || "(no name)")}</strong> <span class="subtle">(${escapeHtml(profileId)})</span>`
                  : `None yet`
              }
            </p>
          </div>

          <form id="profileForm" class="formGrid">
            <div>
              <label>Nickname</label>
              <input id="nickname" name="nickname" placeholder="e.g. zihan" value="${escapeHtml(
                profileName || ""
              )}" required />
              <p class="subtle" style="margin-top:8px;">Tip: Keep it short. You can create multiple profiles if you want.</p>
            </div>

            <div class="btnRow">
              <button class="primary" type="submit">Save</button>
              <button id="clearProfileBtn" type="button">Clear</button>
            </div>

            <p id="msg" class="msg"></p>
          </form>

          <div>
            <h3 style="margin-top:6px;">Your post summary</h3>
            <div id="summary" class="summaryRow"></div>
          </div>
        </div>
      </div>
    </section>
  `;

  const form = document.getElementById("profileForm");
  const nicknameEl = document.getElementById("nickname");
  const msgEl = document.getElementById("msg");
  const clearBtn = document.getElementById("clearProfileBtn");
  const summaryEl = document.getElementById("summary");

  clearBtn.addEventListener("click", () => {
    localStorage.removeItem(LS_PROFILE_ID);
    localStorage.removeItem(LS_PROFILE_NAME);
    nicknameEl.value = "";
    msgEl.textContent = "Cleared ✅";
    renderSummary(summaryEl, null, []);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msgEl.textContent = "Saving...";

    const nickname = nicknameEl.value.trim();
    if (!nickname) {
      msgEl.textContent = "Please enter a nickname.";
      return;
    }

    try {
      const profile = await createProfile(nickname);
      localStorage.setItem(LS_PROFILE_ID, profile._id);
      localStorage.setItem(LS_PROFILE_NAME, profile.nickname);

      msgEl.textContent = `Saved ✅ Hi, ${profile.nickname}!`;
      await loadAndRenderSummary(summaryEl, profile._id);
    } catch (err) {
      msgEl.textContent = err?.message
        ? `Save failed ❌ ${err.message}`
        : "Save failed ❌";
    }
  });

  // Initial summary render
  await loadAndRenderSummary(summaryEl, profileId);
}

async function loadAndRenderSummary(summaryEl, profileId) {
  if (!profileId) {
    renderSummary(summaryEl, null, []);
    return;
  }

  try {
    const myPosts = await fetchPosts({ profileId });
    renderSummary(summaryEl, profileId, Array.isArray(myPosts) ? myPosts : []);
  } catch {
    renderSummary(summaryEl, profileId, []);
  }
}

function renderSummary(summaryEl, profileId, posts) {
  if (!profileId) {
    summaryEl.innerHTML = `
      <div class="summaryBox">
        <div class="num">0</div>
        <div class="label">Total posts</div>
      </div>
      <div class="summaryBox">
        <div class="num">0</div>
        <div class="label">Worth it</div>
      </div>
      <div class="summaryBox">
        <div class="num">0</div>
        <div class="label">Meh</div>
      </div>
      <div class="summaryBox">
        <div class="num">0</div>
        <div class="label">Not worth</div>
      </div>
    `;
    return;
  }

  const total = posts.length;
  const worth = posts.filter((p) => p.sentiment === "worth").length;
  const meh = posts.filter((p) => p.sentiment === "meh").length;
  const notWorth = posts.filter((p) => p.sentiment === "not_worth").length;

  summaryEl.innerHTML = `
    <div class="summaryBox">
      <div class="num">${total}</div>
      <div class="label">Total posts</div>
    </div>
    <div class="summaryBox">
      <div class="num">${worth}</div>
      <div class="label">Worth it</div>
    </div>
    <div class="summaryBox">
      <div class="num">${meh}</div>
      <div class="label">Meh</div>
    </div>
    <div class="summaryBox">
      <div class="num">${notWorth}</div>
      <div class="label">Not worth</div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (ch) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[ch] || ch;
  });
}

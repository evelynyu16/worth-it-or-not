import { createPost } from "../api.js";
import { escapeHtml } from "../utils.js";

const LS_PROFILE_ID = "won_profile_id";
const LS_PROFILE_NAME = "won_profile_name";

function normalizeCategory(v) {
  const s = String(v || "").trim().toLowerCase();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function renderSubmit(container) {
  const profileId = localStorage.getItem(LS_PROFILE_ID);
  const profileName = localStorage.getItem(LS_PROFILE_NAME);

  if (!profileId) {
    container.innerHTML = `
      <section class="page">
        <header class="pageHeader">
          <h1 class="sectionTitle">Submit</h1>
          <p class="subtle">You need a profile first.</p>
        </header>

        <div class="card formCard">
          <p>Go to <a href="#/profile">Profile</a> and save a nickname.</p>
        </div>
      </section>
    `;
    return;
  }

  container.innerHTML = `
    <section class="page">
      <header class="pageHeader">
        <h1 class="sectionTitle">Submit</h1>
        <p class="subtle">Posting as <strong>${escapeHtml(profileName)}</strong></p>
      </header>

      <div class="card formCard">
        <form id="postForm" class="formGrid">
          <div>
            <label>Item name</label>
            <input name="itemName" placeholder="e.g. Air fryer" required />
          </div>

          <div>
          <label>Category</label>
          <input
          name="category"
          list="categoryList"
          placeholder="e.g. Tech"
          required
          />
          
          <datalist id="categoryList">
          
          <option value="Tech"></option>
          
          <option value="School"></option>
          
          <option value="Kitchen"></option>
          
          <option value="Food"></option>
          
          <option value="Fashion"></option>
          
          <option value="Fitness"></option>
          
          <option value="Beauty"></option>
          
          <option value="Home"></option>
          
          <option value="Travel"></option>
          
          <option value="Transportation"></option>
          
          <option value="Subscriptions"></option>
          
          <option value="Entertainment"></option>
          
          </datalist>
          
          </div>

          <div>
            <label>Photo (optional)</label>
            <input id="photo" type="file" accept="image/*" />
            <p id="uploadMsg" class="msg"></p>
            <img
              id="photoPreview"
              alt="preview"
              style="display:none; width:100%; max-height:260px; object-fit:cover; border-radius:16px; border:1px solid var(--border);"
            />
          </div>

          <div>
            <label>Expectation</label>
            <textarea name="expectation" rows="3" placeholder="What you thought would happen..." required></textarea>
          </div>

          <div>
            <label>Reality</label>
            <textarea name="reality" rows="3" placeholder="What actually happened..." required></textarea>
          </div>

          <div>
            <label>Sentiment</label>
            <select name="sentiment" required>
              <option value="worth">Worth it</option>
              <option value="meh">Meh</option>
              <option value="not_worth">Not worth it</option>
            </select>
          </div>

          <div class="btnRow">
            <button id="submitBtn" class="primary" type="submit">Submit</button>
            <button id="resetBtn" type="button">Clear</button>
          </div>

          <p id="msg" class="msg"></p>
        </form>
      </div>
    </section>
  `;

  const form = document.getElementById("postForm");
  const msg = document.getElementById("msg");
  const resetBtn = document.getElementById("resetBtn");
  const submitBtn = document.getElementById("submitBtn");

  // Upload UI
  const photoInput = document.getElementById("photo");
  const uploadMsg = document.getElementById("uploadMsg");
  const preview = document.getElementById("photoPreview");

  let uploadedImageUrl = null;
  let uploading = false;

  function setUploading(state) {
    uploading = state;
    submitBtn.disabled = state;
    photoInput.disabled = state;
  }

  function clearUploadUI() {
    uploadedImageUrl = null;
    uploadMsg.textContent = "";
    preview.src = "";
    preview.style.display = "none";
    // allow choosing the same file again
    photoInput.value = "";
  }

  photoInput.addEventListener("change", async () => {
    const file = photoInput.files?.[0];
    if (!file) return;

    // Optional: simple client-side check
    if (!file.type.startsWith("image/")) {
      uploadMsg.textContent = "❌ Please choose an image file.";
      clearUploadUI();
      return;
    }

    uploadMsg.textContent = "Uploading...";
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const reason = data?.error || `Upload failed (HTTP ${res.status})`;
        throw new Error(reason);
      }

      uploadedImageUrl = data.imageUrl || null;

      if (!uploadedImageUrl) {
        throw new Error("Upload succeeded but no imageUrl returned.");
      }

      uploadMsg.textContent = "✅ Uploaded";
      preview.src = uploadedImageUrl;
      preview.style.display = "block";
    } catch (err) {
      uploadedImageUrl = null;
      preview.style.display = "none";
      uploadMsg.textContent = `❌ ${err?.message || "Upload failed"}`;
    } finally {
      setUploading(false);
    }
  });

  resetBtn.addEventListener("click", () => {
    form.reset();
    msg.textContent = "";
    clearUploadUI();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (uploading) {
      msg.textContent = "Please wait for the image upload to finish...";
      return;
    }

    msg.textContent = "Submitting...";

    const data = new FormData(form);

    const post = {
      itemName: String(data.get("itemName") || "").trim(),
      category: normalizeCategory(data.get("category")),
      expectation: String(data.get("expectation") || "").trim(),
      reality: String(data.get("reality") || "").trim(),
      sentiment: data.get("sentiment"),
      profileId,
      imageUrl: uploadedImageUrl, 
    };

      if (!post.category) {
    msg.textContent = "Category cannot be empty.";
    return;
  }

    try {
      await createPost(post);
      msg.textContent = "Posted ✅ Redirecting to Home...";

      form.reset();
      clearUploadUI();

      setTimeout(() => {
        window.location.hash = "#/";
      }, 600);
    } catch (err) {
      msg.textContent = err?.message
        ? `Submit failed ❌ ${err.message}`
        : "Submit failed ❌";
    }
  });
}

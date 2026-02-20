// client/api.js
// Small API helpers for the frontend (student-style, simple and readable)

export async function fetchPosts({ category, profileId, page, pageSize } = {}) {
  const params = new URLSearchParams();

  if (category) params.set("category", category);
  if (profileId) params.set("profileId", profileId);
  if (page) params.set("page", String(page));
  if (pageSize) params.set("pageSize", String(pageSize));

  const url = params.toString()
    ? `/api/posts?${params.toString()}`
    : "/api/posts";

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch posts");
  }

  return res.json(); // { items, page, pageSize, total, totalPages }
}

export async function createProfile(nickname) {
  const res = await fetch("/api/profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to create profile");
  }

  return res.json();
}

export async function createPost(post) {
  const res = await fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to create post");
  }

  return res.json();
}

export async function deletePost(postId) {
  const res = await fetch(`/api/posts/${encodeURIComponent(postId)}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to delete post");
  }

  return res.json();
}

export async function updatePost(postId, patch) {
  const res = await fetch(`/api/posts/${encodeURIComponent(postId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to update post");
  }

  return res.json();
}

export async function uploadImage(file) {
  const fd = new FormData();
  fd.append("image", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Upload failed");
  }

  return res.json(); // { imageUrl: "/uploads/xxx.jpg" }
}
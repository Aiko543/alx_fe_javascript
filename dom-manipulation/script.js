// ========== Storage-backed quotes ==========
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { id: 1, text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { id: 2, text: "Don't let yesterday take up too much of today.", category: "Inspiration" },
  { id: 3, text: "It's not whether you get knocked down, it's whether you get up.", category: "Resilience" }
];

const quoteDisplay   = document.getElementById('quoteDisplay');
const newQuoteBtn    = document.getElementById('newQuote');
const categoryFilter = document.getElementById('categoryFilter'); // make sure this exists in your HTML

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ========== Random quote (respects filter) ==========
function showRandomQuote() {
  const selected = categoryFilter ? categoryFilter.value : "all";
  const pool = selected === "all" ? quotes : quotes.filter(q => q.category === selected);

  if (!pool.length) {
    quoteDisplay.innerHTML = "<p>No quotes available in this category.</p>";
    return;
  }

  const q = pool[Math.floor(Math.random() * pool.length)];
  quoteDisplay.innerHTML = `<p>"${q.text}"</p><p><em>- ${q.category}</em></p>`;
  sessionStorage.setItem("lastQuote", JSON.stringify(q)); // optional session storage
}

// ========== Add Quote (mark as pending for upload) ==========
function addQuote() {
  const textInput = document.getElementById('newQuoteText');
  const categoryInput = document.getElementById('newQuoteCategory');
  const newText = textInput.value.trim();
  const newCategory = categoryInput.value.trim();

  if (!newText || !newCategory) {
    alert("Please fill in both fields.");
    return;
  }

  const newItem = {
    id: `local-${Date.now()}`,  // local temp id
    text: newText,
    category: newCategory,
    _pending: true,             // needs uploading to server
    _updatedAt: Date.now()
  };

  quotes.push(newItem);
  saveQuotes();
  populateCategories();
  textInput.value = "";
  categoryInput.value = "";
  alert("Quote added locally! It will be uploaded on next sync.");
}

// ========== Categories ==========
function populateCategories() {
  if (!categoryFilter) return;
  categoryFilter.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All Categories";
  categoryFilter.appendChild(allOption);

  const cats = [...new Set(quotes.map(q => q.category))];
  cats.forEach(c => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = c;
    categoryFilter.appendChild(opt);
  });

  const savedFilter = localStorage.getItem("selectedCategory");
  if (savedFilter) categoryFilter.value = savedFilter;
}

function filterQuotes() {
  if (categoryFilter) {
    localStorage.setItem("selectedCategory", categoryFilter.value);
  }
  showRandomQuote();
}

// ========== Import / Export ==========
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    const importedQuotes = JSON.parse(e.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    alert('Quotes imported successfully!');
  };
  fileReader.readAsText(event.target.files[0]);
}

// ========== Server Sync (JSONPlaceholder) ==========
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";
const syncStatusEl = document.getElementById("syncStatus");
const syncNowBtn    = document.getElementById("syncNow");
const autoSyncChk   = document.getElementById("autoSync");
let autoSyncTimer   = null;
let lastSyncAt      = null;
let pendingConflicts = []; // { id, local, server }

function setStatus(msg) {
  if (syncStatusEl) syncStatusEl.textContent = msg;
}

async function fetchServerQuotes() {
  // JSONPlaceholder doesn’t have "quotes", so we map posts to quotes.
  // We’ll use first 10 posts for demo.
  const res = await fetch(`${SERVER_URL}?_limit=10`);
  const posts = await res.json();

  // Map to our shape: id, text, category
  return posts.map(p => ({
    id: p.id,
    text: p.title,               // map title -> quote text
    category: `User-${p.userId}`,// map userId -> category
    _updatedAt: Date.now()       // fake timestamp for demo
  }));
}

async function pushLocalPending() {
  // Push local quotes with _pending === true
  const pending = quotes.filter(q => q._pending);
  for (const q of pending) {
    try {
      const res = await fetch(SERVER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: q.text, body: q.category, userId: 1 })
      });
      // JSONPlaceholder returns an id but won’t persist; we still mark as synced
      const created = await res.json();
      q._pending = false;
      q._syncedAt = Date.now();
      // Optional: store the returned id if you want
      // q._serverId = created.id;
    } catch (e) {
      console.warn("Upload failed for quote:", q, e);
    }
  }
  saveQuotes();
}

function mergeServerData(serverQuotes) {
  let added = 0, updated = 0;
  pendingConflicts = [];

  const byId = new Map(quotes.map(q => [String(q.id), q]));

  serverQuotes.forEach(sq => {
    const key = String(sq.id);
    if (!byId.has(key)) {
      quotes.push(sq);
      added++;
      return;
    }

    const lq = byId.get(key);
    const differs = lq.text !== sq.text || lq.category !== sq.category;

    if (differs) {
      // Conflict detected -> default: server wins,
      // but also record for optional manual review.
      pendingConflicts.push({ id: key, local: { ...lq }, server: { ...sq } });

      lq.text = sq.text;
      lq.category = sq.category;
      lq._updatedAt = sq._updatedAt;
      updated++;
    }
  });

  saveQuotes();
  return { added, updated, conflicts: pendingConflicts.length };
}

function showConflictNotice(count) {
  if (!syncStatusEl) return;
  if (!count) {
    setStatus(`Synced at ${new Date().toLocaleTimeString()}.`);
    return;
  }

  // Add a "Review Conflicts" button
  syncStatusEl.innerHTML = `Conflicts detected (${count}). Server version applied by default. 
    <button id="reviewConflictsBtn" style="margin-left:.5rem;">Review</button>`;

  document.getElementById("reviewConflictsBtn")?.addEventListener("click", openConflictModal);
}

async function syncWithServer() {
  setStatus("Syncing…");
  try {
    await pushLocalPending();
    const serverQuotes = await fetchServerQuotes();
    const { added, updated, conflicts } = mergeServerData(serverQuotes);
    lastSyncAt = Date.now();
    setStatus(`Synced: +${added} new, ~${updated} updated, ${conflicts} conflicts (server won).`);
    showConflictNotice(conflicts);
    // Re-render UI
    populateCategories();
    showRandomQuote();
  } catch (e) {
    console.error(e);
    setStatus("Sync failed. Check your internet connection and try again.");
  }
}

// ========== Auto-sync ==========
function startAutoSync() {
  if (autoSyncTimer) return;
  autoSyncTimer = setInterval(syncWithServer, 30000); // 30s
}
function stopAutoSync() {
  clearInterval(autoSyncTimer);
  autoSyncTimer = null;
}

// ========== Conflict Modal ==========
const conflictModal = document.getElementById("conflictModal");
const conflictList  = document.getElementById("conflictList");
const applyBtn      = document.getElementById("applyResolutions");
const closeBtn      = document.getElementById("closeConflictModal");

function openConflictModal() {
  if (!conflictModal) return;
  renderConflictList();
  conflictModal.style.display = "flex";
}

function closeConflictModal() {
  if (!conflictModal) return;
  conflictModal.style.display = "none";
}

function renderConflictList() {
  if (!conflictList) return;
  conflictList.innerHTML = "";
  if (!pendingConflicts.length) {
    conflictList.innerHTML = "<p>No conflicts to resolve.</p>";
    return;
  }

  pendingConflicts.forEach((c, idx) => {
    const wrap = document.createElement("div");
    wrap.style.border = "1px solid #ddd";
    wrap.style.padding = ".5rem";
    wrap.style.borderRadius = "6px";
    wrap.style.marginBottom = ".5rem";

    wrap.innerHTML = `
      <strong>ID: ${c.id}</strong>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:.5rem; margin-top:.5rem;">
        <div>
          <label style="display:block;">
            <input type="radio" name="conf-${idx}" value="server" checked>
            <strong>Server</strong>
          </label>
          <div><em>Text:</em> ${c.server.text}</div>
          <div><em>Category:</em> ${c.server.category}</div>
        </div>
        <div>
          <label style="display:block;">
            <input type="radio" name="conf-${idx}" value="local">
            <strong>Local</strong>
          </label>
          <div><em>Text:</em> ${c.local.text}</div>
          <div><em>Category:</em> ${c.local.category}</div>
        </div>
      </div>
    `;
    conflictList.appendChild(wrap);
  });
}

function applyResolutions() {
  pendingConflicts.forEach((c, idx) => {
    const choice = document.querySelector(`input[name="conf-${idx}"]:checked`)?.value || "server";
    const target = quotes.find(q => String(q.id) === String(c.id));
    if (!target) return;
    const chosen = choice === "server" ? c.server : c.local;
    target.text = chosen.text;
    target.category = chosen.category;
    target._updatedAt = Date.now();
  });

  saveQuotes();
  populateCategories();
  showRandomQuote();
  closeConflictModal();
  setStatus("Resolutions applied.");
  pendingConflicts = [];
}

// ========== Wire up events ==========
newQuoteBtn?.addEventListener('click', showRandomQuote);
categoryFilter?.addEventListener('change', filterQuotes);

syncNowBtn?.addEventListener('click', syncWithServer);
autoSyncChk?.addEventListener('change', (e) => {
  if (e.target.checked) startAutoSync();
  else stopAutoSync();
});
applyBtn?.addEventListener('click', applyResolutions);
closeBtn?.addEventListener('click', closeConflictModal);

// ========== Init ==========
populateCategories();
showRandomQuote();
startAutoSync();  // auto-sync on by default

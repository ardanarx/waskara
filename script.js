(() => {
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
      const open = menuToggle.classList.toggle("is-open");
      mobileMenu.classList.toggle("is-open", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
    });
    mobileMenu.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      menuToggle.classList.remove("is-open");
      mobileMenu.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    }));
  }

  // Navbar dan footer muncul saat menggulir ke atas, lalu bersembunyi saat menggulir ke bawah.
  const header = document.querySelector(".site-header");
  const footer = document.querySelector(".site-footer");
  let lastScrollY = window.scrollY;
  let ticking = false;
  function updateBars() {
    const current = window.scrollY;
    const delta = current - lastScrollY;
    if (Math.abs(delta) > 4) {
      if (current <= 8 || delta < 0) {
        header?.classList.remove("is-hidden");
        footer?.classList.remove("is-hidden");
      } else if (delta > 0) {
        header?.classList.add("is-hidden");
        footer?.classList.add("is-hidden");
        if (menuToggle && mobileMenu) {
          menuToggle.classList.remove("is-open");
          mobileMenu.classList.remove("is-open");
          menuToggle.setAttribute("aria-expanded", "false");
        }
      }
      lastScrollY = current;
    }
    ticking = false;
  }
  window.addEventListener("scroll", () => {
    if (!ticking) { window.requestAnimationFrame(updateBars); ticking = true; }
  }, { passive: true });

  const searchButton = document.getElementById("searchButton");
  const searchOverlay = document.getElementById("searchOverlay");
  const searchInput = document.getElementById("searchInput");
  const closeSearch = document.getElementById("closeCari") || document.getElementById("closeSearch");
  const searchResults = document.getElementById("searchResults");

  function getClient() {
    if (!window.supabase || !window.WASKARA_CONFIG) return null;
    const { SUPABASE_URL, SUPABASE_KEY } = window.WASKARA_CONFIG;
    if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes("YOUR-PROJECT") || SUPABASE_KEY.includes("YOUR_")) return null;
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  const supabaseClient = getClient();
  let publishedArticles = [];

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
  }
  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
  }
  function readingTime(content = "") {
    const text = String(content).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const words = text ? text.split(" ").length : 0;
    return `${Math.max(1, Math.ceil(words / 200))} menit baca`;
  }
  function articleHref(article) {
    const key = article.slug || article.id;
    return `article.html?id=${encodeURIComponent(key)}`;
  }

  async function loadPublishedArticles() {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient
      .from("articles")
      .select("id,title,slug,excerpt,content,status,created_at,updated_at")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (error) { console.error("Gagal memuat artikel:", error); return []; }
    publishedArticles = data || [];
    return publishedArticles;
  }

  async function renderArticleList() {
    const list = document.getElementById("articleList");
    if (!list) return;
    if (!supabaseClient) {
      list.innerHTML = '<p class="article-loading">Koneksi Supabase belum dikonfigurasi.</p>';
      return;
    }
    const articles = await loadPublishedArticles();
    if (!articles.length) {
      list.innerHTML = '<p class="article-loading">Belum ada artikel yang diterbitkan.</p>';
      return;
    }
    list.innerHTML = articles.map(article => `
      <a class="article-row" href="${articleHref(article)}">
        <div class="article-main">
          <div class="article-meta"><span>${escapeHtml(formatDate(article.created_at))}</span><span>·</span><span>${escapeHtml(readingTime(article.content))}</span></div>
          <h2>${escapeHtml(article.title)}</h2>
          <p>${escapeHtml(article.excerpt || "")}</p>
        </div>
        <span class="article-arrow" aria-hidden="true">→</span>
      </a>`).join("");
  }

  async function loadArticleDetail() {
    const body = document.getElementById("articleBody");
    const title = document.getElementById("articleTitle");
    if (!body || !title) return;
    const params = new URLSearchParams(window.location.search);
    const key = params.get("id");
    if (!key) { body.innerHTML = "<p>Artikel tidak ditemukan.</p>"; return; }
    if (!supabaseClient) { body.innerHTML = "<p>Koneksi Supabase belum dikonfigurasi.</p>"; return; }

    let query = supabaseClient.from("articles").select("id,title,slug,excerpt,content,status,created_at,updated_at").eq("status", "published");
    let result = await query.eq("slug", key).maybeSingle();
    if (!result.data && !result.error) result = await supabaseClient.from("articles").select("id,title,slug,excerpt,content,status,created_at,updated_at").eq("status", "published").eq("id", key).maybeSingle();
    if (result.error || !result.data) {
      title.textContent = "Artikel tidak ditemukan";
      const desc = document.getElementById("articleDescription"); if (desc) desc.textContent = "Artikel yang kamu cari tidak tersedia.";
      body.innerHTML = "<p>Artikel tidak ditemukan atau belum diterbitkan.</p>";
      document.title = "Artikel tidak ditemukan — Waskara";
      return;
    }
    const article = result.data;
    title.textContent = article.title || "Tanpa judul";
    const date = document.getElementById("articleDate"); if (date) date.textContent = formatDate(article.created_at);
    const read = document.getElementById("articleReadTime"); if (read) read.textContent = readingTime(article.content);
    const desc = document.getElementById("articleDescription"); if (desc) desc.textContent = article.excerpt || "";
    body.innerHTML = article.content || "<p>Artikel ini belum memiliki isi.</p>";
    document.title = `${article.title || "Artikel"} — Waskara`;
  }

  function closeSearchOverlay() {
    if (!searchOverlay) return;
    searchOverlay.classList.remove("is-open");
    searchOverlay.setAttribute("aria-hidden", "true");
    if (searchInput) searchInput.value = "";
    if (searchResults) searchResults.innerHTML = "";
  }
  function openSearchOverlay() {
    if (!searchOverlay) return;
    searchOverlay.classList.add("is-open");
    searchOverlay.setAttribute("aria-hidden", "false");
    setTimeout(() => searchInput?.focus(), 50);
    if (supabaseClient && !publishedArticles.length) loadPublishedArticles();
  }
  async function renderSearch(query = "") {
    if (!searchResults) return;
    const q = query.trim().toLowerCase();
    if (!q) { searchResults.innerHTML = ""; return; }
    if (supabaseClient && !publishedArticles.length) await loadPublishedArticles();
    const matches = publishedArticles.filter(article => `${article.title || ""} ${article.excerpt || ""}`.toLowerCase().includes(q));
    searchResults.innerHTML = matches.length
      ? matches.map(article => `<a class="search-result" href="${articleHref(article)}"><small>${escapeHtml(formatDate(article.created_at))}</small><strong>${escapeHtml(article.title)}</strong></a>`).join("")
      : '<p style="color:var(--muted);font-size:11px;">Artikel tidak ditemukan.</p>';
  }
  searchButton?.addEventListener("click", openSearchOverlay);
  closeSearch?.addEventListener("click", closeSearchOverlay);
  searchOverlay?.addEventListener("click", event => { if (event.target === searchOverlay) closeSearchOverlay(); });
  searchInput?.addEventListener("input", event => renderSearch(event.target.value));

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeSearchOverlay();
      menuToggle?.classList.remove("is-open");
      mobileMenu?.classList.remove("is-open");
      menuToggle?.setAttribute("aria-expanded", "false");
    }
  });

  renderArticleList();
  loadArticleDetail();
})();

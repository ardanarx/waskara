(() => {
  const CONFIG = window.WASKARA_CONFIG || {};
  const hasSupabaseConfig =
    CONFIG.SUPABASE_URL &&
    CONFIG.SUPABASE_KEY &&
    !CONFIG.SUPABASE_URL.includes("PASTE_") &&
    !CONFIG.SUPABASE_KEY.includes("PASTE_");

  let supabaseClient = null;
  if (hasSupabaseConfig && window.supabase?.createClient) {
    supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
  }

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
    if (!ticking) {
      window.requestAnimationFrame(updateBars);
      ticking = true;
    }
  }, { passive: true });

  const searchButton = document.getElementById("searchButton");
  const searchOverlay = document.getElementById("searchOverlay");
  const searchInput = document.getElementById("searchInput");
  const closeSearch = document.getElementById("closeSearch") || document.getElementById("closeCari");
  const searchResults = document.getElementById("searchResults");
  let publishedArticles = [];

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>'"]/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[char]));
  }

  function slugFallback(title = "") {
    return title.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function articleHref(article) {
    return `article.html?id=${encodeURIComponent(article.slug || article.id)}`;
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
  }

  function plainTextFromHTML(html = "") {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return (temp.textContent || temp.innerText || "").replace(/\s+/g, " ").trim();
  }

  function readTimeFromHTML(html = "") {
    const words = plainTextFromHTML(html).split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.ceil(words / 200))} menit baca`;
  }

  async function loadPublishedArticles() {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient
      .from("articles")
      .select("id,title,slug,excerpt,content,status,created_at,updated_at")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(article => ({ ...article, slug: article.slug || slugFallback(article.title) }));
  }

  function renderArticleList(articles) {
    const list = document.getElementById("articleList");
    if (!list) return;
    if (!articles.length) {
      list.innerHTML = '<p class="article-empty">Belum ada artikel yang diterbitkan.</p>';
      return;
    }
    list.innerHTML = articles.map(article => `
      <a class="article-row" href="${articleHref(article)}">
        <div class="article-main">
          <div class="article-meta"><span>${escapeHTML(formatDate(article.created_at))}</span><span>·</span><span>${escapeHTML(readTimeFromHTML(article.content || article.excerpt || ""))}</span></div>
          <h2>${escapeHTML(article.title || "Tanpa judul")}</h2>
          <p>${escapeHTML(article.excerpt || plainTextFromHTML(article.content || "").slice(0, 180))}</p>
        </div>
        <span class="article-arrow" aria-hidden="true">→</span>
      </a>`).join("");
  }

  function renderSearch(query = "") {
    if (!searchResults) return;
    const q = query.trim().toLowerCase();
    if (!q) { searchResults.innerHTML = ""; return; }
    const matches = publishedArticles.filter(article =>
      [article.title, article.excerpt, plainTextFromHTML(article.content || "")].join(" ").toLowerCase().includes(q)
    );
    searchResults.innerHTML = matches.length
      ? matches.map(article => `<a class="search-result" href="${articleHref(article)}"><small>${escapeHTML(formatDate(article.created_at))}</small><strong>${escapeHTML(article.title || "Tanpa judul")}</strong></a>`).join("")
      : '<p style="color:var(--muted);font-size:11px;">Artikel tidak ditemukan.</p>';
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
  }
  searchButton?.addEventListener("click", openSearchOverlay);
  closeSearch?.addEventListener("click", closeSearchOverlay);
  searchOverlay?.addEventListener("click", event => { if (event.target === searchOverlay) closeSearchOverlay(); });
  searchInput?.addEventListener("input", event => renderSearch(event.target.value));

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeSearchOverlay();
      if (menuToggle && mobileMenu) {
        menuToggle.classList.remove("is-open");
        mobileMenu.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    }
  });

  async function initArticlesPage() {
    const list = document.getElementById("articleList");
    if (!list) return;
    if (!supabaseClient) {
      list.innerHTML = '<p class="article-empty">Koneksi Supabase belum dikonfigurasi.</p>';
      return;
    }
    try {
      publishedArticles = await loadPublishedArticles();
      renderArticleList(publishedArticles);
    } catch (error) {
      console.error("Waskara Supabase:", error);
      list.innerHTML = '<p class="article-empty">Artikel belum dapat dimuat. Periksa konfigurasi Supabase dan kebijakan RLS.</p>';
    }
  }

  async function initArticlePage() {
    const articleTitle = document.getElementById("articleTitle");
    const articleBody = document.getElementById("articleBody");
    if (!articleTitle || !articleBody) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) {
      articleTitle.textContent = "Artikel tidak ditemukan";
      articleBody.innerHTML = "<p>Artikel yang kamu cari tidak tersedia.</p>";
      return;
    }
    if (!supabaseClient) {
      articleTitle.textContent = "Koneksi belum tersedia";
      articleBody.innerHTML = "<p>Koneksi Supabase belum dikonfigurasi.</p>";
      return;
    }
    try {
      let query = supabaseClient.from("articles").select("id,title,slug,excerpt,content,status,created_at").eq("status", "published");
      let result = await query.eq("slug", id).maybeSingle();
      if (!result.data && !result.error) result = await supabaseClient.from("articles").select("id,title,slug,excerpt,content,status,created_at").eq("status", "published").eq("id", id).maybeSingle();
      if (result.error) throw result.error;
      const article = result.data;
      if (!article) {
        articleTitle.textContent = "Artikel tidak ditemukan";
        articleBody.innerHTML = "<p>Artikel yang kamu cari tidak tersedia.</p>";
        document.title = "Artikel tidak ditemukan — Waskara";
        return;
      }
      const date = document.getElementById("articleDate");
      const readTime = document.getElementById("articleReadTime");
      const description = document.getElementById("articleDescription");
      articleTitle.textContent = article.title || "Tanpa judul";
      if (date) date.textContent = formatDate(article.created_at);
      if (readTime) readTime.textContent = readTimeFromHTML(article.content || article.excerpt || "");
      if (description) description.textContent = article.excerpt || "";
      articleBody.innerHTML = article.content || "<p>Artikel ini belum memiliki isi.</p>";
      document.title = `${article.title || "Artikel"} — Waskara`;
    } catch (error) {
      console.error("Waskara Supabase:", error);
      articleTitle.textContent = "Artikel tidak dapat dimuat";
      articleBody.innerHTML = "<p>Terjadi masalah saat mengambil artikel dari Supabase.</p>";
    }
  }

  initArticlesPage();
  initArticlePage();
})();

(() => {
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
      const open = menuToggle.classList.toggle("is-open");
      mobileMenu.classList.toggle("is-open", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    mobileMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        menuToggle.classList.remove("is-open");
        mobileMenu.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const searchButton = document.getElementById("searchButton");
  const searchOverlay = document.getElementById("searchOverlay");
  const searchInput = document.getElementById("searchInput");
  const closeSearch = document.getElementById("closeSearch");
  const searchResults = document.getElementById("searchResults");

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
    loadSearchArticles();
  }

  searchButton?.addEventListener("click", openSearchOverlay);
  closeSearch?.addEventListener("click", closeSearchOverlay);
  searchOverlay?.addEventListener("click", event => {
    if (event.target === searchOverlay) closeSearchOverlay();
  });

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

  const config = window.WASKARA_CONFIG || {};
  let supabaseClient = null;
  let articlesCache = [];

  const isConfigured = () => {
    return Boolean(
      window.supabase &&
      config.SUPABASE_URL &&
      config.SUPABASE_KEY &&
      !config.SUPABASE_URL.includes("YOUR-PROJECT") &&
      !config.SUPABASE_KEY.includes("YOUR_PUBLISHABLE")
    );
  };

  if (isConfigured()) {
    supabaseClient = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_KEY);
  }

  function escapeHTML(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  }

  function stripHTML(html = "") {
    const doc = new DOMParser().parseFromString(String(html), "text/html");
    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  }

  function getWordCount(html = "") {
    const text = stripHTML(html);
    return text ? text.split(/\s+/).length : 0;
  }

  function getReadTime(html = "") {
    const words = getWordCount(html);
    return `${Math.max(1, Math.ceil(words / 200))} min read`;
  }

  function getExcerpt(article) {
    const explicit = String(article?.excerpt || "").trim();
    if (explicit) return explicit;
    const text = stripHTML(article?.content || "");
    return text.length > 150 ? `${text.slice(0, 147).trim()}…` : text;
  }

  function articleHref(article) {
    const value = article?.slug || article?.id;
    return `article.html?id=${encodeURIComponent(value)}`;
  }

  async function fetchPublishedArticles() {
    if (!supabaseClient) {
      throw new Error("Supabase public configuration is not set.");
    }

    const { data, error } = await supabaseClient
      .from("articles")
      .select("id, title, slug, excerpt, content, status, created_at, updated_at")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) throw error;
    articlesCache = Array.isArray(data) ? data : [];
    return articlesCache;
  }

  function showListMessage(message) {
    const list = document.querySelector(".article-list");
    if (!list) return;
    list.innerHTML = `<div class="article-empty">${escapeHTML(message)}</div>`;
  }

  function renderArticles(articles) {
    const list = document.querySelector(".article-list");
    if (!list) return;

    if (!articles.length) {
      showListMessage("No published articles yet.");
      return;
    }

    list.innerHTML = articles.map(article => `
      <a class="article-row" href="${articleHref(article)}">
        <div class="article-main">
          <div class="article-meta">
            <span>${escapeHTML(formatDate(article.created_at))}</span>
            <span>·</span>
            <span>${escapeHTML(getReadTime(article.content))}</span>
          </div>
          <h2>${escapeHTML(article.title || "Untitled")}</h2>
          <p>${escapeHTML(getExcerpt(article))}</p>
        </div>
        <span class="article-arrow" aria-hidden="true">→</span>
      </a>
    `).join("");
  }

  async function initArticleList() {
    const list = document.querySelector(".article-list");
    if (!list) return;

    if (!isConfigured()) {
      showListMessage("Supabase is not configured yet.");
      return;
    }

    try {
      list.innerHTML = '<div class="article-empty">Loading articles…</div>';
      const articles = await fetchPublishedArticles();
      renderArticles(articles);
    } catch (error) {
      console.error("Waskara: failed to load articles", error);
      showListMessage("Unable to load articles right now.");
    }
  }

  function renderSearch(query = "") {
    if (!searchResults) return;
    const q = query.trim().toLowerCase();

    if (!q) {
      searchResults.innerHTML = "";
      return;
    }

    const matches = articlesCache.filter(article => {
      const haystack = `${article.title || ""} ${article.excerpt || ""} ${stripHTML(article.content || "")}`.toLowerCase();
      return haystack.includes(q);
    });

    searchResults.innerHTML = matches.length
      ? matches.map(article => `
          <a class="search-result" href="${articleHref(article)}">
            <small>${escapeHTML(formatDate(article.created_at))}</small>
            <strong>${escapeHTML(article.title || "Untitled")}</strong>
          </a>
        `).join("")
      : '<p style="color:var(--muted);font-size:10px;">No articles found.</p>';
  }

  async function loadSearchArticles() {
    if (!supabaseClient || articlesCache.length) {
      renderSearch(searchInput?.value || "");
      return;
    }

    try {
      await fetchPublishedArticles();
      renderSearch(searchInput?.value || "");
    } catch (error) {
      console.error("Waskara: failed to load search articles", error);
      if (searchResults) {
        searchResults.innerHTML = '<p style="color:var(--muted);font-size:10px;">Unable to search articles right now.</p>';
      }
    }
  }

  searchInput?.addEventListener("input", event => renderSearch(event.target.value));

  function sanitizeArticleHTML(html = "") {
    const source = String(html || "").trim();
    if (!source) return "";

    const looksLikeHTML = /<\/?[a-z][\s\S]*>/i.test(source);
    if (!looksLikeHTML) {
      return source
        .split(/\n\s*\n/)
        .map(part => `<p>${escapeHTML(part).replace(/\n/g, "<br>")}</p>`)
        .join("");
    }

    const doc = new DOMParser().parseFromString(source, "text/html");
    const blocked = new Set(["script", "style", "iframe", "object", "embed", "form", "input", "button", "textarea", "select", "option", "meta", "link"]);

    doc.body.querySelectorAll("*").forEach(el => {
      if (blocked.has(el.tagName.toLowerCase())) {
        el.remove();
        return;
      }

      [...el.attributes].forEach(attr => {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim();
        if (name.startsWith("on") || name === "style" || name === "srcdoc") {
          el.removeAttribute(attr.name);
        }
        if ((name === "href" || name === "src") && /^(javascript|data|vbscript):/i.test(value)) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return doc.body.innerHTML;
  }

  async function findArticle(identifier) {
    if (!supabaseClient || !identifier) return null;

    let query = supabaseClient
      .from("articles")
      .select("id, title, slug, excerpt, content, status, created_at, updated_at")
      .eq("status", "published");

    let result = await query.eq("slug", identifier).maybeSingle();
    if (!result.error && result.data) return result.data;

    result = await supabaseClient
      .from("articles")
      .select("id, title, slug, excerpt, content, status, created_at, updated_at")
      .eq("status", "published")
      .eq("id", identifier)
      .maybeSingle();

    if (result.error) throw result.error;
    return result.data || null;
  }

  async function initSingleArticle() {
    const titleEl = document.getElementById("articleTitle");
    if (!titleEl) return;

    const params = new URLSearchParams(window.location.search);
    const identifier = params.get("id");
    const body = document.querySelector(".article-body");
    const dateEl = document.getElementById("articleDate");
    const readTimeEl = document.getElementById("articleReadTime");
    const descriptionEl = document.getElementById("articleDescription");
    const headerMeta = document.querySelector(".single-article-meta");

    if (!isConfigured()) {
      titleEl.textContent = "Supabase is not configured";
      if (descriptionEl) descriptionEl.textContent = "Add the public Supabase URL and publishable key to config.js.";
      if (body) body.innerHTML = "";
      return;
    }

    if (!identifier) {
      titleEl.textContent = "Article not found";
      if (descriptionEl) descriptionEl.textContent = "The article link is missing an article ID.";
      if (body) body.innerHTML = "";
      return;
    }

    try {
      const article = await findArticle(identifier);
      if (!article) {
        titleEl.textContent = "Article not found";
        if (descriptionEl) descriptionEl.textContent = "This article may have been removed or is not published.";
        if (body) body.innerHTML = "";
        return;
      }

      titleEl.textContent = article.title || "Untitled";
      if (dateEl) dateEl.textContent = formatDate(article.created_at);
      if (readTimeEl) readTimeEl.textContent = getReadTime(article.content);
      if (descriptionEl) descriptionEl.textContent = getExcerpt(article);
      if (body) body.innerHTML = sanitizeArticleHTML(article.content);
      if (headerMeta) headerMeta.setAttribute("aria-label", `Published ${formatDate(article.created_at)}, ${getReadTime(article)}`);
      document.title = `${article.title || "Article"} — Waskara`;

      const descriptionMeta = document.querySelector('meta[name="description"]');
      if (descriptionMeta) descriptionMeta.setAttribute("content", getExcerpt(article) || "Article — Waskara");
    } catch (error) {
      console.error("Waskara: failed to load article", error);
      titleEl.textContent = "Unable to load article";
      if (descriptionEl) descriptionEl.textContent = "Please try again in a moment.";
      if (body) body.innerHTML = "";
    }
  }

  initArticleList();
  initSingleArticle();
})();

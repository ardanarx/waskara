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

  const articleData = [
    { title: "The House That Never Had a Door", date: "12 Sep 2026", href: "article.html?id=the-house-that-never-had-a-door" },
    { title: "Langit yang Tidak Pernah Sama", date: "8 Sep 2026", href: "article.html?id=langit-yang-tidak-pernah-sama" },
    { title: "Tentang yang Pergi dan Tetap", date: "3 Sep 2026", href: "article.html?id=tentang-yang-pergi-dan-tetap" }
  ];

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

  function renderSearch(query = "") {
    if (!searchResults) return;
    const q = query.trim().toLowerCase();
    if (!q) {
      searchResults.innerHTML = "";
      return;
    }
    const matches = articleData.filter(article => article.title.toLowerCase().includes(q));
    searchResults.innerHTML = matches.length
      ? matches.map(article => `<a class="search-result" href="${article.href}"><small>${article.date}</small><strong>${article.title}</strong></a>`).join("")
      : '<p style="color:var(--muted);font-size:10px;">No articles found.</p>';
  }

  searchButton?.addEventListener("click", openSearchOverlay);
  closeSearch?.addEventListener("click", closeSearchOverlay);
  searchOverlay?.addEventListener("click", event => {
    if (event.target === searchOverlay) closeSearchOverlay();
  });
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

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const articles = {
    "the-house-that-never-had-a-door": { title: "The House That Never Had a Door", date: "12 Sep 2026", readTime: "5 min read", description: "About places we remember, even after we have left them behind." },
    "langit-yang-tidak-pernah-sama": { title: "Langit yang Tidak Pernah Sama", date: "8 Sep 2026", readTime: "4 min read", description: "Tentang perubahan kecil yang sering baru kita sadari setelah waktu berlalu." },
    "tentang-yang-pergi-dan-tetap": { title: "Tentang yang Pergi dan Tetap", date: "3 Sep 2026", readTime: "6 min read", description: "Beberapa hal pergi dari hidup kita, tetapi tidak benar-benar hilang." }
  };

  if (id && articles[id]) {
    const article = articles[id];
    const title = document.getElementById("articleTitle");
    const date = document.getElementById("articleDate");
    const readTime = document.getElementById("articleReadTime");
    const description = document.getElementById("articleDescription");
    if (title) title.textContent = article.title;
    if (date) date.textContent = article.date;
    if (readTime) readTime.textContent = article.readTime;
    if (description) description.textContent = article.description;
    document.title = `${article.title} — Arsara`;
  }
})();

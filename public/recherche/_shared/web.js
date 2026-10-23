// telotia.com: an article page's FR · EN switch (web.py). Both languages are in the page and one shows
// (html[data-lang]); the choice is kept with the site's ("telotia-lang"), the title follows, and a language's copy of
// the article starts its behaviours the first time it is shown (article.js, window.TelotiaArticle).
(function () {
  "use strict";
  var root = document.documentElement;
  function set(lang, remember) {
    root.dataset.lang = lang;
    root.lang = lang === "en" ? "en-CA" : "fr-CA";
    var t = document.querySelector('meta[name="title-' + lang + '"]');
    if (t) document.title = t.getAttribute("content");
    Array.prototype.forEach.call(document.querySelectorAll(".web-band [data-set]"), function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-set") === lang));
    });
    if (remember) {
      try { window.localStorage.setItem("telotia-lang", lang); } catch (e) { /* private mode: the switch still works */ }
    }
    var copy = document.querySelector('[data-lang-root][lang="' + lang + '"]');
    if (copy && window.TelotiaArticle) {
      window.TelotiaArticle.start(copy);
      window.dispatchEvent(new Event("resize"));
    }
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-set]") : null;
    if (!b) return;
    e.preventDefault();
    set(b.getAttribute("data-set"), true);
  });
  set(root.dataset.lang === "en" ? "en" : "fr", false);
})();

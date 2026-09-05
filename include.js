/* ---------------------------------------------------------------------------
   Shared page furniture.

   Every page carries placeholders instead of a copy of the nav and footer:

       <div data-include="/partials/nav.html"></div>

   This script swaps each placeholder for the contents of that file, so the
   nav and footer are edited in one place. It also marks the nav link for the
   page you are on, which means pages don't have to declare that themselves.

   Note: browsers block fetch() on file:// URLs, so opening a page by
   double-clicking it will show no nav or footer. Use the local server:

       python3 -m http.server 8000

   --------------------------------------------------------------------------- */

(function () {
  "use strict";

  var slots = Array.prototype.slice.call(
    document.querySelectorAll("[data-include]")
  );
  if (!slots.length) return;

  if (location.protocol === "file:") {
    console.warn(
      "The shared nav and footer can only be loaded over http://. " +
      "Run `python3 -m http.server 8000` in this folder and open " +
      "http://localhost:8000 instead of opening the file directly."
    );
    return;
  }

  // Each page lives at a directory URL ("/research/"), so compare paths
  // rather than filenames. Normalising both sides means "/research",
  // "/research/" and "/research/index.html" all count as the same page.
  var here = normalise(location.pathname);

  slots.forEach(function (slot) {
    var url = slot.getAttribute("data-include");

    fetch(url)
      .then(function (response) {
        if (!response.ok) {
          throw new Error(response.status + " " + response.statusText);
        }
        return response.text();
      })
      .then(function (html) {
        var parsed = document.createElement("template");
        parsed.innerHTML = html.trim();
        markCurrentPage(parsed.content);
        // replaceWith drops the placeholder itself, so the injected markup
        // ends up as a direct child of <body> — no extra wrapper to style.
        slot.replaceWith(parsed.content);
        // The footer carries a link to the CV, so let the download counting
        // below know there is fresh markup to look at.
        document.dispatchEvent(new CustomEvent("include:loaded"));
      })
      .catch(function (error) {
        console.error("Could not load " + url + ": " + error.message);
      });
  });

  function normalise(path) {
    path = path.replace(/index\.html$/, "");
    return path.charAt(path.length - 1) === "/" ? path : path + "/";
  }

  function markCurrentPage(fragment) {
    var links = fragment.querySelectorAll(".nav-links a[href]");
    Array.prototype.forEach.call(links, function (link) {
      // The links still live inside a <template>, whose inert document has no
      // base URL, so link.pathname is empty there. Resolve the raw href
      // against this page instead.
      var path = new URL(link.getAttribute("href"), location.href).pathname;
      if (normalise(path) === here) {
        link.setAttribute("aria-current", "page");
      }
    });
  }
})();

/* ---------------------------------------------------------------------------
   PDF download counts.

   GoatCounter counts page views by itself, but a click straight through to a
   paper, a set of slides or the CV never loads a page, so those downloads
   would be invisible. Tagging each PDF link with data-goatcounter-click hands
   it to GoatCounter's own click tracking, which sends the event with
   navigator.sendBeacon — so it still arrives once the browser has navigated
   away to the file.

   The tagging happens here rather than in the markup so that a newly linked
   PDF is counted the moment it is added, and so that the footer's CV link is
   caught as well: the footer only arrives once the fetch above resolves.
   --------------------------------------------------------------------------- */

(function () {
  "use strict";

  function tagPdfLinks() {
    var links = document.querySelectorAll(
      'a[href$=".pdf" i]:not([data-goatcounter-click])'
    );

    Array.prototype.forEach.call(links, function (link) {
      var url = new URL(link.getAttribute("href"), location.href);
      var file = url.pathname.split("/").pop().replace(/\.pdf$/i, "");

      // The link text is usually just "PDF" or "Slides", so name the event
      // after the file. The title keeps enough of the URL to tell apart two
      // files that happen to share a name — ours from a publisher's copy.
      link.setAttribute("data-goatcounter-click", "pdf-" + file);
      link.setAttribute(
        "data-goatcounter-title",
        url.host === location.host ? url.pathname : url.host + url.pathname
      );
    });

    if (window.goatcounter && window.goatcounter.bind_events) {
      window.goatcounter.bind_events();
    }
  }

  // count.js loads async, so the two scripts can arrive in either order: if it
  // is not here yet its own load handler binds whatever is tagged by then, and
  // the listeners below cover the other order. Binding twice is harmless.
  tagPdfLinks();
  document.addEventListener("include:loaded", tagPdfLinks);
  window.addEventListener("load", tagPdfLinks);
})();

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

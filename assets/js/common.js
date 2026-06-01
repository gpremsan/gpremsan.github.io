(function() {
	// Defensive block for compromised polyfill service domains.
	const blockedHostPattern = /(^|\.)polyfill\.io$|(^|\.)polyfill-fastly\.io$|(^|\.)cdn\.polyfill\.io$/i;

	function isBlockedUrl(url) {
		if (!url) {
			return false;
		}

		try {
			const parsed = new URL(String(url), window.location.href);
			return blockedHostPattern.test(parsed.hostname);
		} catch (error) {
			return /polyfill\.io/i.test(String(url));
		}
	}

	function blockScriptNode(node) {
		if (!node || node.nodeType !== 1) {
			return false;
		}

		if (node.tagName === "SCRIPT" && isBlockedUrl(node.getAttribute("src") || node.src)) {
			node.remove();
			return true;
		}

		const scripts = node.querySelectorAll ? node.querySelectorAll("script[src]") : [];
		let removed = false;
		scripts.forEach(function(script) {
			if (isBlockedUrl(script.getAttribute("src") || script.src)) {
				script.remove();
				removed = true;
			}
		});
		return removed;
	}

	// Remove any blocked scripts already present in DOM.
	blockScriptNode(document.documentElement);

	// Remove blocked scripts that appear later (dynamic injection).
	const observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			mutation.addedNodes.forEach(function(node) {
				blockScriptNode(node);
			});
		});
	});

	if (document.documentElement) {
		observer.observe(document.documentElement, { childList: true, subtree: true });
	}

	// Block popup redirections to the same compromised domains.
	const originalOpen = window.open;
	window.open = function(url) {
		if (isBlockedUrl(url)) {
			return null;
		}
		return originalOpen.apply(window, arguments);
	};
})();

$(document).ready(function() {
	if ($("a.abstract").click(function() {
		$(this).parent().parent().find(".abstract.hidden").toggleClass("open"),
			$(this).parent().parent().find(".bibtex.hidden.open").toggleClass("open");
	}),
	$("a.bibtex").click(function() {
		$(this).parent().parent().find(".bibtex.hidden").toggleClass("open"),
			$(this).parent().parent().find(".abstract.hidden.open").toggleClass("open");
	}),
	$("a").removeClass("waves-effect waves-light"),
	$("#toc-sidebar").length) {
		var e = "#toc-sidebar",
			t = $(e);
		Toc.init(t), $("body").scrollspy({ target: e });
	}
	const n = document.createElement("link");
	n.href = "../css/jupyter.css", n.rel = "stylesheet", n.type = "text/css";
	let a = localStorage.getItem("theme");
	if (null == a || "null" == a) {
		const e = window.matchMedia;
		e && e("(prefers-color-scheme: dark)").matches && (a = "dark");
	}
	$(".jupyter-notebook-iframe-container iframe").each(function() {
		$(this).contents().find("head").append(n),
			"dark" == a && $(this).bind("load", function() {
				$(this)
					.contents()
					.find("body")
					.attr({ "data-jp-theme-light": "false", "data-jp-theme-name": "JupyterLab Dark" });
			});
	});
});
// ---------------------------------------------------------------
// Obfuscated contact details. Kept out of raw HTML/markup so
// simple page scrapers scanning for phone/email patterns in the
// static source find nothing until this script runs client-side.
// This is obfuscation, not encryption — anyone reading this file
// can still reconstruct the values.
// ---------------------------------------------------------------
(function () {
  var waParts = ["91", "94100", "62392"];
  var waNumber = waParts.join("");
  var emailParts = ["devbhargav681", "gmail.com"];
  var email = emailParts.join("@");

  function setHref(id, href) {
    var el = document.getElementById(id);
    if (el) el.setAttribute("href", href);
  }

  setHref("cq-whatsapp", "https://wa.me/" + waNumber + "?text=" +
    encodeURIComponent("Hi Dev, I'd like to get in touch."));
  setHref("cq-email", "mailto:" + email);
  setHref("cq-call", "tel:+" + waNumber);
  setHref("wa-float", "https://wa.me/" + waNumber + "?text=" +
    encodeURIComponent("Hi Dev, I came across your portfolio and wanted to connect."));
  setHref("footer-email", "mailto:" + email);
  setHref("footer-whatsapp", "https://wa.me/" + waNumber);

  var footerEmailLink = document.getElementById("footer-email");
  if (footerEmailLink) footerEmailLink.textContent = email;

  // Shared with the inquiry-form handler below so the number
  // only lives in one place in this file.
  window.__waNumber = waNumber;
})();

// Scroll reveal
(function () {
  var els = document.querySelectorAll("[data-reveal]");
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  els.forEach(function (el) {
    io.observe(el);
  });
})();

// Mobile nav toggle
(function () {
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", function () {
    links.classList.toggle("open");
    var expanded = links.classList.contains("open");
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
  });
  links.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      links.classList.remove("open");
    });
  });
})();

// Mark active nav link based on current page
(function () {
  var path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) {
      a.classList.add("active");
    }
  });
})();

// Inquiry form -> WhatsApp
(function () {
  var form = document.getElementById("inquiryForm");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var status = document.getElementById("formStatus");

    var name = form.name.value.trim();
    var email = form.email.value.trim();
    var reason = form.reason.value;
    var message = form.message.value.trim();

    if (!name || !email || !message) {
      status.textContent = "Please fill in your name, email, and message before sending.";
      status.className = "err";
      return;
    }

    var lines = [
      "New inquiry from the portfolio site",
      "",
      "Name: " + name,
      "Email: " + email,
      "Reason: " + (reason || "Not specified"),
      "",
      "Message:",
      message,
    ];
    var text = encodeURIComponent(lines.join("\n"));
    var url = "https://wa.me/" + window.__waNumber + "?text=" + text;

    status.textContent = "Opening WhatsApp with your message filled in. Send it from there to reach me directly.";
    status.className = "ok";

    window.open(url, "_blank", "noopener");
    form.reset();
  });
})();
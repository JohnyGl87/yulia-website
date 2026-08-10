/* Yulia Glozman — interactions: sticky header, mobile menu, scroll reveal, contact form.

   The contact form uses NO third-party service. The two send controls are real
   links whose href is rebuilt every time a field changes, so clicking one is an
   ordinary user navigation — never blocked by a popup blocker, and nothing is
   ever sent from this site. A third control copies the composed message to the
   clipboard, which works even where wa.me / mailto do not (a desktop with no
   mail client configured, or no WhatsApp session in the browser). */
(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var he = (root.lang === "he");

  var PHONE = "972546737474";              /* WhatsApp number, international format, no + */
  var EMAIL = "yuliats15@gmail.com";

  /* sticky header shadow on scroll */
  var header = d.querySelector(".site-header");
  function onScroll() { if (header) header.classList.toggle("scrolled", window.scrollY > 8); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* close the mobile menu after tapping a link */
  var navcheck = d.getElementById("navcheck");
  Array.prototype.forEach.call(d.querySelectorAll(".mobile-menu a"), function (a) {
    a.addEventListener("click", function () { if (navcheck) navcheck.checked = false; });
  });

  /* reveal elements as they scroll into view */
  var reveals = d.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in-view"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add("in-view"); });
  }

  /* ------------------------------------------------------------------ form */
  var form = d.getElementById("contact-form");
  if (!form) return;

  var sendLinks = form.querySelectorAll('[data-send="whatsapp"], [data-send="email"]');
  var copyBtn   = form.querySelector('[data-send="copy"]');

  function val(name) {
    var el = form.elements[name];
    return el && el.value ? String(el.value).trim() : "";
  }

  function compose() {
    var L = he
      ? { hi: "שלום יוליה,", name: "שם", org: "ארגון", topic: "נושא", email: "מייל", sent: "נשלח מהאתר" }
      : { hi: "Hi Yulia,", name: "Name", org: "Organization", topic: "Topic", email: "Email", sent: "Sent from your website" };

    var lines = [L.hi, ""];
    if (val("name"))         lines.push(L.name + ": " + val("name"));
    if (val("organization")) lines.push(L.org + ": " + val("organization"));
    if (val("topic"))        lines.push(L.topic + ": " + val("topic"));
    if (val("email"))        lines.push(L.email + ": " + val("email"));
    if (val("message"))      lines.push("", val("message"));
    lines.push("", "— " + L.sent);
    return lines.join("\n");
  }

  function subject() {
    var t = val("topic");
    return (he ? "פנייה מהאתר" : "Website inquiry") + (t ? " — " + t : "");
  }

  /* Rebuild both hrefs from the current field values */
  function refresh() {
    var body = compose();
    Array.prototype.forEach.call(sendLinks, function (a) {
      a.href = (a.getAttribute("data-send") === "whatsapp")
        ? "https://wa.me/" + PHONE + "?text=" + encodeURIComponent(body)
        : "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject()) + "&body=" + encodeURIComponent(body);
    });
  }

  refresh();
  form.addEventListener("input", refresh);
  form.addEventListener("change", refresh);
  form.addEventListener("submit", function (e) { e.preventDefault(); });

  /* Block the navigation only while required fields are still empty */
  Array.prototype.forEach.call(sendLinks, function (a) {
    a.addEventListener("click", function (e) {
      refresh();
      if (typeof form.checkValidity === "function" && !form.checkValidity()) {
        e.preventDefault();
        form.reportValidity();
      }
    });
  });

  /* Clipboard fallback — always works, even with no mail client or WhatsApp session */
  if (copyBtn) {
    copyBtn.addEventListener("click", function (e) {
      e.preventDefault();
      var text = compose();
      var done = function () {
        var was = copyBtn.textContent;
        copyBtn.textContent = he ? "ההודעה הועתקה ✓" : "Message copied ✓";
        setTimeout(function () { copyBtn.textContent = was; }, 2600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { legacyCopy(text, done); });
      } else {
        legacyCopy(text, done);
      }
    });
  }

  function legacyCopy(text, done) {
    var ta = d.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;inset-block-start:-1000px;opacity:0";
    d.body.appendChild(ta);
    ta.select();
    try { d.execCommand("copy"); done(); } catch (err) { /* nothing more we can do */ }
    d.body.removeChild(ta);
  }
})();

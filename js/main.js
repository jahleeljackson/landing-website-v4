/**
 * Cassian AI landing page behaviors.
 * Configuration lives in js/config.js (window.CASSIAN_CONFIG).
 */

function getConfig() {
  return window.CASSIAN_CONFIG || {};
}

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function initHeaderScroll() {
  const header = document.getElementById("site-header");
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function initScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach((el) => observer.observe(el));
}

function initCalendly() {
  const config = getConfig();
  const mount = document.getElementById("calendly-embed");
  if (!mount || !config.calendlyUrl) return;

  mount.setAttribute("data-url", config.calendlyUrl);

  if (!document.querySelector('link[href*="calendly.com/assets/external/widget.css"]')) {
    const link = document.createElement("link");
    link.href = "https://assets.calendly.com/assets/external/widget.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }

  if (document.querySelector('script[src*="calendly.com/assets/external/widget.js"]')) {
    return;
  }

  const script = document.createElement("script");
  script.src = "https://assets.calendly.com/assets/external/widget.js";
  script.async = true;
  document.body.appendChild(script);
}

function wireCalendlyLinks() {
  document.querySelectorAll("[data-calendly-link]").forEach((el) => {
    el.setAttribute("href", "#book");
  });
}

function initConfigurableImage(imgId, placeholderId, src) {
  const img = document.getElementById(imgId);
  const placeholder = document.getElementById(placeholderId);
  if (!img || !placeholder) return;

  if (!src) {
    placeholder.hidden = false;
    img.hidden = true;
    return;
  }

  img.onload = () => {
    placeholder.hidden = true;
    img.hidden = false;
  };

  img.onerror = () => {
    placeholder.hidden = false;
    img.hidden = true;
  };

  img.src = src;
}

function initAboutImage() {
  initConfigurableImage(
    "about-photo-img",
    "about-photo-placeholder",
    getConfig().aboutImage
  );
}

function initFormSuccess() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("success") !== "1") return;

  const banner = document.getElementById("form-success");
  if (banner) {
    banner.hidden = false;
    banner.focus();
  }

  const contact = document.getElementById("contact");
  if (contact) {
    contact.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function showFormSuccess() {
  const banner = document.getElementById("form-success");
  if (banner) {
    banner.hidden = false;
    banner.focus();
  }
  const contact = document.getElementById("contact");
  if (contact) {
    contact.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function postFormWebhook(form) {
  const webhookUrl = getConfig().formWebhookUrl;
  if (!webhookUrl) return;

  const data = Object.fromEntries(new FormData(form).entries());
  delete data["bot-field"];
  delete data["form-name"];

  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "cassian-landing-contact",
      submittedAt: new Date().toISOString(),
      ...data,
    }),
  }).catch(() => {
    /* webhook failures should not block the user */
  });
}

/** file:// cannot POST to Netlify Forms — show success UI in place instead. */
function initContactForm() {
  const form = document.querySelector("form.contact-form");
  if (!form) return;

  const formName = getConfig().formName || "contact";
  form.setAttribute("name", formName);
  const hiddenName = form.querySelector('input[name="form-name"]');
  if (hiddenName) hiddenName.value = formName;

  form.addEventListener("submit", (event) => {
    postFormWebhook(form);

    if (location.protocol === "file:") {
      event.preventDefault();
      showFormSuccess();
    }
  });
}

const ROI_PERIODS = {
  weekly: { count: 52, label: "weeks" },
  monthly: { count: 12, label: "months" },
  daily: { count: 260, label: "business days" },
};

function initRoiCalculator() {
  const form = document.getElementById("roi-form");
  if (!form) return;

  const hoursEl = document.getElementById("roi-hours");
  const peopleEl = document.getElementById("roi-people");
  const rateEl = document.getElementById("roi-rate");
  const freqEl = document.getElementById("roi-frequency");
  const delayedEl = document.getElementById("roi-delayed");
  const revenueEl = document.getElementById("roi-revenue");

  const reductions = (getConfig().roi && getConfig().roi.reductions) || {
    pessimistic: 0.15,
    expected: 0.25,
    optimistic: 0.5,
  };

  function updateBars(savings) {
    const max = Math.max(savings.optimistic, 1);
    Object.keys(savings).forEach((key) => {
      const bar = document.getElementById(`roi-bar-${key}`);
      if (bar) {
        bar.style.width = `${Math.round((savings[key] / max) * 100)}%`;
      }
    });
  }

  function update() {
    const hours = Math.max(0, Number(hoursEl.value) || 0);
    const people = Math.max(1, Number(peopleEl.value) || 1);
    const rate = Math.max(0, Number(rateEl.value) || 0);
    const freq = ROI_PERIODS[freqEl.value] || ROI_PERIODS.weekly;
    const delayed = Math.max(0, Number(delayedEl.value) || 0);
    const revenue = Math.max(0, Number(revenueEl.value) || 0);

    const annualLabor = hours * people * rate * freq.count;
    const annualOpportunity = delayed * revenue * 12;
    const annualCost = annualLabor + annualOpportunity;

    const formulaMath = document.getElementById("roi-formula-math");
    const laborEl = document.getElementById("roi-labor-cost");
    const opportunityEl = document.getElementById("roi-opportunity-cost");
    const currentCostEl = document.getElementById("roi-current-cost");

    if (formulaMath) {
      formulaMath.textContent = `${hours} hrs × ${people} people × $${rate}/hr × ${freq.count} ${freq.label}`;
    }
    if (laborEl) laborEl.textContent = formatUsd(annualLabor);
    if (opportunityEl) opportunityEl.textContent = formatUsd(annualOpportunity);
    if (currentCostEl) currentCostEl.textContent = formatUsd(annualCost);

    const savings = {
      pessimistic: annualCost * reductions.pessimistic,
      expected: annualCost * reductions.expected,
      optimistic: annualCost * reductions.optimistic,
    };

    Object.keys(savings).forEach((key) => {
      const pct = Math.round(reductions[key] * 100);
      const pctEl = document.getElementById(`roi-pct-${key}`);
      const saveEl = document.getElementById(`roi-save-${key}`);
      if (pctEl) pctEl.textContent = `${pct}% recoverable`;
      if (saveEl) saveEl.textContent = formatUsd(savings[key]);
    });

    updateBars(savings);

    const paybackEl = document.getElementById("roi-payback-months");
    /** Used only for payback months math — display label is edited in index.html */
    const diagnostic =
      (getConfig().pricing && Number(getConfig().pricing.diagnosticForRoi)) || 1500;
    if (paybackEl) {
      if (savings.expected > 0) {
        const months = (diagnostic / savings.expected) * 12;
        paybackEl.textContent = months < 0.1 ? "<0.1" : months.toFixed(1);
      } else {
        paybackEl.textContent = "—";
      }
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  ["input", "change"].forEach((eventName) => {
    form.addEventListener(eventName, update);
  });

  update();
}

function initYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
}

document.addEventListener("DOMContentLoaded", () => {
  initYear();
  wireCalendlyLinks();
  initNav();
  initHeaderScroll();
  initScrollReveal();
  initCalendly();
  initAboutImage();
  initFormSuccess();
  initContactForm();
  initRoiCalculator();
});

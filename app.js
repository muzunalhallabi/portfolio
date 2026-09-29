(() => {
  const data = window.portfolioContent;
  if (!data) return;

  const $ = (selector, root = document) => root.querySelector(selector);
  const app = $("[data-app]");
  const dialog = $(".project-dialog");
  const detail = $("[data-project-detail]", dialog);
  const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const safeUrl = (url = "") => /^(https?:|mailto:|tel:|\/|assets\/)/i.test(url) ? url : "";
  const route = page => `?page=${encodeURIComponent(page)}`;
  const routeLink = (page, label, className = "") => `<a ${className ? `class="${className}" ` : ""}href="${route(page)}" data-route>${label}</a>`;

  const renderLogo = (item, accessibleName = "") => {
    const image = safeUrl(item.logo || "");
    const fallback = item.logoText || (item.organization || item.title || "").split(/\s+/).map(word => word[0]).join("").slice(0, 3).toUpperCase();
    return image
      ? `<img class="entity-logo" src="${escapeHTML(image)}" alt="${escapeHTML(accessibleName || item.organization || "Organization")} logo">`
      : `<span class="entity-logo entity-logo-mark" role="img" aria-label="${escapeHTML(accessibleName || item.organization || "Organization")} logo" style="--logo-color:${escapeHTML(item.logoColor || "#77746f")}">${escapeHTML(fallback)}</span>`;
  };

  const syncShell = () => {
    const { profile } = data;
    document.title = `${profile.name} — Portfolio`;
    $("[data-footer-name]").textContent = profile.name;
    document.querySelectorAll("[data-year]").forEach(node => node.textContent = profile.year);
    $("[data-footer-links]").innerHTML = [
      profile.email ? `<a href="mailto:${escapeHTML(profile.email)}">${escapeHTML(profile.email)}</a>` : "",
      profile.phone ? `<a href="tel:${escapeHTML(profile.phone.replace(/\s/g, ""))}">${escapeHTML(profile.phone)}</a>` : "",
      profile.linkedin && safeUrl(profile.linkedin) ? `<a href="${escapeHTML(safeUrl(profile.linkedin))}" target="_blank" rel="noreferrer">LinkedIn ↗</a>` : ""
    ].filter(Boolean).join("");
  };

  const linkButton = (label, url, icon) => {
    const validUrl = safeUrl(url);
    if (!validUrl) return `<span class="action-button is-unavailable" aria-disabled="true"><span class="action-icon" aria-hidden="true">${icon}</span>${label}</span>`;
    const external = /^https?:/i.test(validUrl) ? ' target="_blank" rel="noreferrer"' : "";
    return `<a class="action-button" href="${escapeHTML(validUrl)}"${external}><span class="action-icon" aria-hidden="true">${icon}</span>${label}</a>`;
  };

  const renderActions = () => [
    linkButton("Email", data.profile.email ? `mailto:${data.profile.email}` : "", "✉"),
    linkButton("LinkedIn", data.profile.linkedin, "in")
  ].join("");

  const renderSupportingFile = item => {
    const fileUrl = safeUrl(item.certificate || "");
    if (!fileUrl) return "";
    const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(fileUrl);
    return `<div class="supporting-file">${isImage
      ? `<a href="${escapeHTML(fileUrl)}" target="_blank" rel="noreferrer"><img src="${escapeHTML(fileUrl)}" alt="Supporting document for ${escapeHTML(item.title)}"></a>`
      : `<a class="supporting-link" href="${escapeHTML(fileUrl)}" target="_blank" rel="noreferrer">VIEW ATTACHED FILE ↗</a>`}</div>`;
  };

  const renderSectionContent = section => {
    if (section.id === "skills") {
      return `<div class="skills-grid">${(section.skillGroups || []).map(group => `
        <article class="skill-card"><h3>${escapeHTML(group.title)}</h3>${group.skills?.length
          ? `<ul class="skill-tags">${group.skills.map(skill => `<li>${escapeHTML(skill)}</li>`).join("")}</ul>`
          : `<p class="skill-placeholder">No skills listed</p>`}</article>`).join("")}</div>`;
    }

    if (!section.items?.length) {
      return `<div class="empty-note"><span class="empty-mark" aria-hidden="true">·</span><p>${escapeHTML(section.emptyText || "More information will be added soon.")}</p></div>`;
    }

    if (section.id === "projects") {
      return `<div class="project-grid">${section.items.map((item, index) => `
        <button class="project-card" type="button" data-project="${index}">
          ${item.image ? `<img class="project-image" src="${escapeHTML(safeUrl(item.image))}" alt="${escapeHTML(item.imageAlt || item.title)}" loading="lazy">` : `<span class="project-image project-image-placeholder" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>`}
          <span class="project-card-copy"><span class="project-type">${escapeHTML(item.type || "Selected project")}</span><span class="project-name">${escapeHTML(item.title)}</span><span class="project-description">${escapeHTML(item.description || "")}</span><span class="project-brand">${renderLogo(item, item.title)}</span><span class="project-open">VIEW PROJECT <span aria-hidden="true">↗</span></span></span>
        </button>`).join("")}</div>`;
    }

    if (section.id === "certifications") {
      const certificateOrder = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });
      const sortedCertificates = [...section.items].sort((first, second) =>
        certificateOrder.compare(first.organization || "", second.organization || "") ||
        certificateOrder.compare(first.title || "", second.title || "")
      );
      return `<div class="certificate-grid">${sortedCertificates.map(item => {
        const image = safeUrl(item.image || "");
        return `<article class="certificate-card">
          <div class="certificate-heading">${renderLogo(item, item.organization)}<div class="certificate-copy"><h3>${escapeHTML(item.title)}</h3><p class="certificate-issuer">${escapeHTML(item.organization)}</p>${item.date ? `<p class="entry-date">${escapeHTML(item.date)}</p>` : ""}</div></div>
          ${image ? `<a class="certificate-preview" href="${escapeHTML(image)}" target="_blank" rel="noreferrer" aria-label="View certificate image: ${escapeHTML(item.title)}"><img src="${escapeHTML(image)}" alt="${escapeHTML(item.imageAlt || `Certificate for ${item.title}, issued by ${item.organization}${item.date ? `, dated ${item.date}` : ""}.`)}" loading="lazy"></a><span class="certificate-image-label">VIEW IMAGE ↗</span>` : ""}
        </article>`;
      }).join("")}</div>`;
    }

    return `<div class="entry-list">${section.items.map((item, index) => `
      <article class="entry-card"><span class="entry-index">${String(index + 1).padStart(2, "0")}</span>${renderLogo(item, item.organization || item.title)}<div class="entry-body"><h3>${escapeHTML(item.title || item.name || "")}</h3>${item.organization ? `<p class="entry-organization">${escapeHTML(item.organization)}</p>` : ""}${item.subtitle ? `<p class="entry-subtitle">${escapeHTML(item.subtitle)}</p>` : ""}${item.date ? `<p class="entry-date">${escapeHTML(item.date)}</p>` : ""}${item.gpa ? `<p class="entry-date">GPA: ${escapeHTML(item.gpa)}</p>` : ""}${item.honors ? `<p class="entry-honors"><span class="honors-star" aria-hidden="true">★</span>${escapeHTML(item.honors)}</p>` : ""}${item.description ? `<p class="entry-description">${escapeHTML(item.description)}</p>` : ""}${item.highlights?.length ? `<ul class="entry-highlights">${item.highlights.map(point => `<li>${escapeHTML(point)}</li>`).join("")}</ul>` : ""}${item.technologies?.length ? `<ul class="skill-tags entry-tags">${item.technologies.map(tool => `<li>${escapeHTML(tool)}</li>`).join("")}</ul>` : ""}${["experience", "awards"].includes(section.id) ? renderSupportingFile(item) : ""}${item.link && safeUrl(item.link) ? `<a class="text-link" href="${escapeHTML(safeUrl(item.link))}" target="_blank" rel="noreferrer">View details ↗</a>` : ""}</div></article>`).join("")}</div>`;
  };

  const renderContentsGrid = () => `<nav class="contents-grid" aria-label="Portfolio sections">${data.sections.map((section, index) => `
    <a class="contents-card" href="${route(section.id)}" data-route><span class="contents-index">${String(index + 1).padStart(2, "0")}</span><span class="contents-card-bottom"><span class="contents-title">${escapeHTML(section.title)}</span></span><span class="card-arrow" aria-hidden="true">↗</span></a>`).join("")}</nav>`;

  const renderHome = () => `
    <section class="home-hero" aria-labelledby="hero-name">
      <div class="hero-meta"><p class="eyebrow">${escapeHTML(data.profile.field)}</p><span>PORTFOLIO <span aria-hidden="true">·</span> ${escapeHTML(data.profile.year)}</span></div>
      <div class="hero-copy"><h1 id="hero-name">${escapeHTML(data.profile.name)}</h1><p class="hero-summary">${escapeHTML(data.profile.summary)}</p></div>
      <div class="hero-bottom"><div class="hero-actions" aria-label="Professional links">${renderActions()}</div></div>
      <span class="hero-page-number">01 <span aria-hidden="true">/</span> PORTFOLIO</span>
    </section>
    <section class="home-contents section-shell" id="contents" aria-labelledby="home-contents-title">
      <div class="section-heading contents-heading"><div><p class="eyebrow">A guide to my work</p><h2 id="home-contents-title">Contents</h2></div><span class="heading-note">${String(data.sections.length).padStart(2, "0")} SECTIONS</span></div>
      ${renderContentsGrid()}
    </section>`;

  const renderContents = () => `
    <section class="interior-page section-shell" aria-labelledby="contents-title">
      <div class="section-heading contents-heading"><div><p class="eyebrow">A guide to my work</p><h1 id="contents-title">Contents</h1></div><span class="heading-note">${String(data.sections.length).padStart(2, "0")} SECTIONS</span></div>
      ${renderContentsGrid()}
      <div class="page-end-link">${routeLink("home", `BACK TO INTRODUCTION <span aria-hidden="true">↑</span>`, "section-index-link")}</div>
    </section>`;

  const renderSection = section => {
    const index = data.sections.findIndex(item => item.id === section.id);
    const previous = data.sections[(index - 1 + data.sections.length) % data.sections.length];
    const next = data.sections[(index + 1) % data.sections.length];
    return `
      <section class="interior-page section-shell" aria-labelledby="heading-${escapeHTML(section.id)}">
        <div class="section-heading"><div><p class="eyebrow">${escapeHTML(section.eyebrow)}</p><h1 id="heading-${escapeHTML(section.id)}">${escapeHTML(section.title)}</h1></div>${routeLink("contents", `ALL SECTIONS <span aria-hidden="true">↗</span>`, "section-index-link")}</div>
        ${renderSectionContent(section)}
        <nav class="section-pager" aria-label="Browse sections"><a href="${route(previous.id)}" data-route><span>← PREVIOUS</span><strong>${escapeHTML(previous.title)}</strong></a><a href="${route(next.id)}" data-route><span>NEXT →</span><strong>${escapeHTML(next.title)}</strong></a></nav>
      </section>`;
  };

  function render() {
    syncShell();
    const page = new URLSearchParams(window.location.search).get("page") || "home";
    if (page === "home") app.innerHTML = renderHome();
    else if (page === "contents") app.innerHTML = renderContents();
    else {
      const section = data.sections.find(item => item.id === page);
      app.innerHTML = section ? renderSection(section) : `<section class="interior-page section-shell not-found"><p class="eyebrow">Page not found</p><h1>That section is not here.</h1>${routeLink("contents", "Return to contents →", "text-link")}</section>`;
    }
  }

  document.addEventListener("click", event => {
    const link = event.target.closest("a[data-route]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.history.pushState({}, "", link.href);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    $("#main-content").focus({ preventScroll: true });
  });
  window.addEventListener("popstate", render);

  app.addEventListener("click", event => {
    const button = event.target.closest("[data-project]");
    if (!button) return;
    const project = data.sections.find(section => section.id === "projects")?.items?.[Number(button.dataset.project)];
    if (!project) return;
    const links = [project.github && ["GitHub", project.github], project.demo && ["Live demo", project.demo], project.documentation && ["Documentation", project.documentation]].filter(Boolean);
    detail.innerHTML = `<p class="eyebrow">PROJECT DETAILS</p><h2 id="dialog-title">${escapeHTML(project.title)}</h2>${project.description ? `<p class="dialog-lead">${escapeHTML(project.description)}</p>` : ""}${project.details ? `<p class="dialog-copy">${escapeHTML(project.details)}</p>` : ""}<div class="dialog-meta">${project.role ? `<div><span>MY ROLE</span><p>${escapeHTML(project.role)}</p></div>` : ""}${project.technologies?.length ? `<div><span>TOOLS &amp; TECHNOLOGIES</span><p>${project.technologies.map(escapeHTML).join(" · ")}</p></div>` : ""}</div>${links.length ? `<div class="dialog-links">${links.map(([label, url]) => safeUrl(url) ? `<a class="text-link" href="${escapeHTML(safeUrl(url))}" target="_blank" rel="noreferrer">${escapeHTML(label)} ↗</a>` : "").join("")}</div>` : ""}`;
    dialog.showModal();
  });
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });

  render();
})();

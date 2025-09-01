document.addEventListener('DOMContentLoaded', () => {
  const BTN_PROJECTS = document.getElementById('btn-projects');
  const BTN_CONTACT  = document.getElementById('btn-contact');
  const GRID         = document.getElementById('projects');
  const FORM         = document.getElementById('contact-form');
  const STATUS_EL    = document.querySelector('.form-status');

  BTN_PROJECTS?.addEventListener('click', (e) => {
    e.preventDefault();
    if (isIndex()) {
      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      location.href = 'index.html#projects';
    }
  });

  BTN_CONTACT?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!isContact()) location.href = 'contact.html';
  });

  if (FORM && STATUS_EL) {
    FORM.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!FORM.checkValidity()) return FORM.reportValidity();
      STATUS_EL.textContent = 'Bedankt! Je bericht is verzonden.';
      FORM.reset();
    });
  }

  if (GRID) bootGallery(GRID);
});

const DATA_PATH = 'assets/data.json';
const STORE_KEY = 'living-shapes-order-v1';

function isIndex() {
  const p = location.pathname;
  return /(?:^|\/)index\.html$/.test(p) || p === '/' || p === '';
}
function isContact() {
  return /(?:^|\/)contact(?:\.html)?\/?$/.test(location.pathname);
}

async function bootGallery(grid) {
  try {
    const res = await fetch(DATA_PATH, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const projects = await res.json();
    renderProjects(grid, projects);
  } catch (err) {
    console.error('Failed to load assets/data.json:', err);
  } finally {
    initScrollFade(grid);
    initDragDrop(grid);
    smoothHashLanding(grid);
  }
}

function renderProjects(grid, projects) {
  const frag = document.createDocumentFragment();

  for (const p of projects) {
    const id = deriveId(p);

    const projectEl = document.createElement('section');
    projectEl.className = 'project';
    projectEl.dataset.id = id;

    const holder = document.createElement('section');
    holder.className = 'img--holder';
    holder.id = id;
    holder.tabIndex = 0;

    const imgFront = new Image();
    imgFront.className = 'img img--front';
    imgFront.src = p.image_main_src || p.image_main;
    imgFront.alt = `${p.title} – outside`;
    imgFront.loading = 'lazy';
    imgFront.decoding = 'async';

    const imgBack = new Image();
    imgBack.className = 'img img--back';
    imgBack.src = p.image_second_src || p.image_second;
    imgBack.alt = '';
    imgBack.setAttribute('aria-hidden', 'true');
    imgBack.loading = 'lazy';
    imgBack.decoding = 'async';

    holder.append(imgFront, imgBack);
    projectEl.append(holder);
    frag.append(projectEl);
  }

  grid.append(frag);
}

/* stable id from filename like "bfly-outside.jpg" -> "bfly" */
function deriveId(p) {
  const n = (p.image_main_src || p.image_main || '').split('/').pop() || '';
  return n.replace(/\.[^.]+$/, '').replace(/-outside$/, '').toLowerCase();
}

/* ================= Behaviors ================= */

function initScrollFade(grid) {
  const onScroll = () => grid.classList.toggle('scrolled', window.scrollY > 0);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function initDragDrop(grid) {
  const getId = (el) => el.dataset.id || el.querySelector('.img--holder')?.id || '';

  function loadOrder() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const ids = JSON.parse(raw);
      if (!Array.isArray(ids) || !ids.length) return;

      const map = {};
      [...grid.children].forEach(p => { map[getId(p)] = p; });
      ids.forEach(id => { const node = map[id]; if (node) grid.appendChild(node); });
    } catch {/* ignore */}
  }

  function saveOrder() {
    const ids = [...grid.children].map(getId);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(ids)); } catch {/* ignore */}
  }

  function setupDraggable(project) {
    project.draggable = true;

    project.addEventListener('dragstart', (e) => {
      project.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', getId(project));
    });

    project.addEventListener('dragend', () => {
      project.classList.remove('dragging');
      [...grid.children].forEach(p => p.classList.remove('drop-target'));
      saveOrder();
    });

    project.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    project.addEventListener('dragenter', () => project.classList.add('drop-target'));
    project.addEventListener('dragleave', () => project.classList.remove('drop-target'));

    project.addEventListener('drop', (e) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData('text/plain');
      const dragged = [...grid.children].find(p => getId(p) === draggedId);
      if (!dragged || dragged === project) return;

      const nodes = [...grid.children];
      const from = nodes.indexOf(dragged);
      const to   = nodes.indexOf(project);

      grid.insertBefore(dragged, from < to ? project.nextSibling : project);
      project.classList.remove('drop-target');
    });
  }

  loadOrder();
  [...grid.children].forEach(setupDraggable);

  window.addEventListener('storage', (e) => {
    if (e.key === STORE_KEY) loadOrder();
  });
}

function smoothHashLanding(grid) {
  if (location.hash === '#projects') {
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

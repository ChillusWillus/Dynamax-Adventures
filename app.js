// ── Storage ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'da-tracker';

function loadStorage() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

// ── State ─────────────────────────────────────────────────────────────────
const state = {
  data: loadStorage(),   // { [pokemonName]: { caught, dateCaught, game, switchName, player } }
  openPokemon: null,
};

// ── DOM Refs ──────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const loadingScreen   = $('loading-screen');
const app             = $('app');
const legendGrid      = $('legendary-grid');
const regularGrid     = $('regular-grid');
const legendCount     = $('legendary-count');
const regularCount    = $('regular-count');
const totalCaughtEl   = $('total-caught');
const legendCaughtEl  = $('legend-caught');
const regularCaughtEl = $('regular-caught');

const modalBackdrop   = $('modal-backdrop');
const modalImg        = $('modal-img');
const modalName       = $('modal-name');
const modalType       = $('modal-type');
const modalStatus     = $('modal-status');
const modalDate       = $('modal-date');
const modalGame       = $('modal-game');
const modalSwitch     = $('modal-switch');
const modalPlayer     = $('modal-player');
const btnMarkObtained = $('btn-mark-obtained');
const btnSave         = $('btn-save');

// ── Init ──────────────────────────────────────────────────────────────────
function init() {
  setTimeout(() => {
    loadingScreen.classList.add('fade-out');
    app.classList.add('visible');
  }, 2800);

  renderGrid(legendGrid, LEGENDARIES);
  renderGrid(regularGrid, REGULARS);

  legendCount.textContent  = `${LEGENDARIES.length} total`;
  regularCount.textContent = `${REGULARS.length} total`;

  updateCounts();
}

// ── Render ────────────────────────────────────────────────────────────────
function renderGrid(container, list) {
  container.innerHTML = '';
  for (const pokemon of list) {
    container.appendChild(buildCard(pokemon));
  }
}

function buildCard(pokemon) {
  const caught = isCaught(pokemon.name);

  const card = document.createElement('div');
  card.className    = `pokemon-card${caught ? ' caught' : ''}`;
  card.dataset.name = pokemon.name;

  card.innerHTML = `
    <div class="card-image-wrap">
      <img
        class="card-img"
        src="${spriteUrl(pokemon.id)}"
        alt="Shiny ${pokemon.name}"
        loading="lazy"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
      >
      <div class="card-img-placeholder" style="display:none;">✦</div>
    </div>
    <div class="card-divider"></div>
    <div class="card-name">${pokemon.name}</div>
    <div class="card-badges">${badgeHTML(pokemon.exclusive)}</div>
    <button class="check-btn" data-action="toggle" data-name="${escapeAttr(pokemon.name)}">
      <span class="check-icon">${caught ? '✓' : ''}</span>
      <span>${caught ? 'Obtained' : 'Obtain'}</span>
    </button>
  `;

  return card;
}

function badgeHTML(exclusive) {
  if (!exclusive) return '';
  const cls = exclusive === 'Sword' ? 'badge-sword' : 'badge-shield';
  return `<span class="badge ${cls}">${exclusive}</span>`;
}

function escapeAttr(s) {
  return s.replace(/"/g, '&quot;');
}

// ── State Helpers ─────────────────────────────────────────────────────────
function isCaught(name) {
  return !!(state.data[name] && state.data[name].caught);
}

// ── Card UI ───────────────────────────────────────────────────────────────
function updateCardUI(name, caught) {
  const card = document.querySelector(`.pokemon-card[data-name="${CSS.escape(name)}"]`);
  if (!card) return;
  card.classList.toggle('caught', caught);
  card.querySelector('.check-icon').textContent               = caught ? '✓' : '';
  card.querySelector('.check-btn span:last-child').textContent = caught ? 'Obtained' : 'Obtain';
}

function updateCounts() {
  let legendCaught = 0, regularCaught = 0;
  for (const p of LEGENDARIES) if (isCaught(p.name)) legendCaught++;
  for (const p of REGULARS)    if (isCaught(p.name)) regularCaught++;
  const total = legendCaught + regularCaught;
  const all   = LEGENDARIES.length + REGULARS.length;

  totalCaughtEl.textContent   = `${total}/${all}`;
  legendCaughtEl.textContent  = `${legendCaught}/${LEGENDARIES.length}`;
  regularCaughtEl.textContent = `${regularCaught}/${REGULARS.length}`;
}

// ── Toggle Caught ─────────────────────────────────────────────────────────
function toggleCaught(name, e) {
  e.stopPropagation();
  const newCaught = !isCaught(name);
  state.data[name] = { ...(state.data[name] || {}), caught: newCaught };
  persist();
  updateCardUI(name, newCaught);
  updateCounts();
}

// ── Modal ─────────────────────────────────────────────────────────────────
function openModal(name) {
  const all     = [...LEGENDARIES, ...REGULARS];
  const pokemon = all.find(p => p.name === name);
  if (!pokemon) return;

  state.openPokemon = pokemon;

  const entry  = state.data[name] || {};
  const caught = !!entry.caught;

  modalImg.src          = spriteUrl(pokemon.id);
  modalImg.alt          = `Shiny ${name}`;
  modalName.textContent = name.toUpperCase();
  $('modal-name-display').textContent = name.toUpperCase();
  modalType.textContent = pokemon.exclusive
    ? `${pokemon.exclusive} Exclusive`
    : 'Available in Both';

  setModalCaughtStatus(caught);
  btnMarkObtained.classList.toggle('active', caught);
  btnMarkObtained.querySelector('span').textContent = caught ? '✓ Obtained' : 'Mark Obtained';

  modalDate.value   = entry.dateCaught  || '';
  modalGame.value   = entry.game        || '';
  modalSwitch.value = entry.switchName  || '';
  modalPlayer.value = entry.player      || '';

  modalBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalBackdrop.classList.remove('open');
  document.body.style.overflow = '';
  state.openPokemon = null;
}

function setModalCaughtStatus(caught) {
  const textSpan = modalStatus.querySelector('span:last-child');
  textSpan.textContent  = caught ? 'Obtained' : 'Not Yet Obtained';
  modalStatus.className = `modal-caught-status${caught ? ' is-caught' : ''}`;
}

function saveModal() {
  if (!state.openPokemon) return;
  const { name } = state.openPokemon;
  const caught   = btnMarkObtained.classList.contains('active');

  state.data[name] = {
    caught,
    dateCaught: modalDate.value   || '',
    game:       modalGame.value   || '',
    switchName: modalSwitch.value || '',
    player:     modalPlayer.value || '',
  };

  persist();
  updateCardUI(name, caught);
  updateCounts();
  closeModal();
}

// ── Events ────────────────────────────────────────────────────────────────
document.addEventListener('click', e => {
  const toggleBtn = e.target.closest('[data-action="toggle"]');
  if (toggleBtn) { toggleCaught(toggleBtn.dataset.name, e); return; }

  const card = e.target.closest('.pokemon-card');
  if (card && !e.target.closest('.check-btn')) { openModal(card.dataset.name); return; }

  if (e.target === modalBackdrop) closeModal();
});

$('modal-close').addEventListener('click', closeModal);

btnMarkObtained.addEventListener('click', () => {
  const active = btnMarkObtained.classList.toggle('active');
  btnMarkObtained.querySelector('span').textContent = active ? '✓ Obtained' : 'Mark Obtained';
  setModalCaughtStatus(active);
});

btnSave.addEventListener('click', saveModal);

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── Boot ──────────────────────────────────────────────────────────────────
init();

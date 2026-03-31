import { sanitizeInput, parseChave, validarDigito, getUfDescricao, getTipoEmissaoDescricao, getModeloDescricao, formatarCnpj, SEGMENTS, ESTADOS, MODELOS } from './chave-acesso.js';
import { initTheme, toggleTheme } from './theme.js';
import { getHistory, addToHistory, clearHistory as clearAllHistory, filterHistory, formatRelativeTime } from './history.js';
import { icon } from './icons.js';
import { trackChaveDecomposta, trackLinkCompartilhado, trackCampoCopied, trackTemaAlterado, trackHistoricoUsado, trackNovaAba, trackChaveViaURL, trackChaveViaPaste } from './analytics.js';

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const SEG_COLORS = {
  uf: 'var(--seg-uf)', ano: 'var(--seg-ano)', mes: 'var(--seg-mes)',
  cnpj: 'var(--seg-cnpj)', modelo: 'var(--seg-modelo)', serie: 'var(--seg-serie)',
  numero: 'var(--seg-numero)', tipoEmissao: 'var(--seg-tipo-emissao)',
  codigoNumerico: 'var(--seg-codigo-numerico)', digitoVerificador: 'var(--seg-digito)',
};

// --- Constants ---
const MAX_TABS = 15;

// --- State ---
let nextTabId = 1;
let tabs = [{ id: nextTabId++, chave: '', parsed: null, validation: null }];
let activeTabId = tabs[0].id;
let currentTheme = 'dark';
let historyOpen = false;
let historyFilter = '';

// --- Helpers ---
function activeTab() {
  return tabs.find(t => t.id === activeTabId);
}

function getModelBadgeClass(modelo) {
  const map = {
    '55': 'badge-nfe', '57': 'badge-cte', '58': 'badge-mdfe',
    '59': 'badge-cfe', '63': 'badge-bpe', '65': 'badge-nfce',
    '66': 'badge-nf3e', '67': 'badge-cte',
  };
  return map[modelo] || '';
}

function updateURL() {
  const params = new URLSearchParams();
  tabs.forEach(t => {
    if (t.chave && t.chave.length === 44) {
      params.append('chave', t.chave);
    }
  });
  const qs = params.toString();
  const url = qs ? `${location.pathname}?${qs}` : location.pathname;
  history.replaceState(null, '', url);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
}

// --- Render Functions ---
function renderTabBar() {
  const tabsHtml = tabs.map(t => {
    const isActive = t.id === activeTabId;
    let label = 'Nova aba';
    if (t.parsed) {
      const modelo = getModeloDescricao(t.parsed.modelo);
      const suffix = t.chave.length >= 8 ? `...${t.chave.slice(-8)}` : '';
      label = `<span class="tab-model">${modelo}</span> <span class="tab-suffix">${suffix}</span>`;
    }
    return `
      <button class="tab ${isActive ? 'active' : ''}" data-tab-id="${t.id}">
        ${label}
        <span class="tab-close" data-close-id="${t.id}">${icon('x', 12)}</span>
      </button>`;
  }).join('');

  const themeIcon = currentTheme === 'dark' ? icon('sun', 16) : icon('moon', 16);

  const modelosRows = Object.entries(MODELOS).map(([code, name]) =>
    `<tr><td>${code}</td><td>${name}</td></tr>`
  ).join('');

  const estadosRows = Object.entries(ESTADOS)
    .map(([code, name]) => `<tr><td>${code}</td><td>${name}</td></tr>`)
    .join('');

  return `
    <div class="tab-bar">
      ${tabsHtml}
      <button class="tab-new" data-action="new-tab" title="Nova aba">${icon('plus', 16)}</button>
      <div class="tab-bar-spacer"></div>
      <button class="toolbar-btn" data-popover="modelos" title="Modelos suportados">${icon('info', 18)}</button>
      <button class="toolbar-btn" data-popover="estados" title="Tabela UF/Estado">${icon('search', 18)}</button>
      <button class="theme-toggle" data-action="toggle-theme" title="Alternar tema">${currentTheme === 'dark' ? icon('sun', 18) : icon('moon', 18)}</button>
    </div>
    <div class="popover" data-popover-id="modelos">
      <div class="popover-header">Modelos Suportados</div>
      <table class="popover-table">
        <thead><tr><th>Cód.</th><th>Modelo</th></tr></thead>
        <tbody>${modelosRows}</tbody>
      </table>
    </div>
    <div class="popover" data-popover-id="estados">
      <div class="popover-header">Códigos UF/Estado</div>
      <div class="popover-scroll">
        <table class="popover-table">
          <thead><tr><th>Cód.</th><th>Estado</th></tr></thead>
          <tbody>${estadosRows}</tbody>
        </table>
      </div>
    </div>`;
}

function renderInput(tab) {
  if (tab.parsed) {
    let spans = '';
    for (const [start, end, key] of SEGMENTS) {
      const chars = tab.chave.substring(start, end);
      spans += `<span data-seg="${key}" style="color: ${SEG_COLORS[key]}">${chars}</span>`;
    }
    return `
      <div class="input-group">
        <label class="input-label">Chave de Acesso</label>
        <div class="chave-display" data-action="edit-chave">${spans}</div>
      </div>`;
  }

  return `
    <div class="input-group">
      <label class="input-label">Chave de Acesso</label>
      <div class="input-wrapper">
        <input
          type="text"
          class="chave-input"
          data-action="input-chave"
          placeholder="Cole ou digite a chave de acesso (44 digitos)"
          value="${escapeAttr(tab.chave)}"
          maxlength="44"
          inputmode="numeric"
        >
        <span class="char-count">${tab.chave.length}/44</span>
      </div>
      <div class="input-hint">Cole a chave de acesso com Ctrl+V em qualquer lugar da pagina</div>
    </div>`;
}

function renderBadges(tab) {
  if (!tab.parsed) return '';
  const p = tab.parsed;
  const v = tab.validation;

  const modelClass = getModelBadgeClass(p.modelo);
  const modelLabel = getModeloDescricao(p.modelo);

  let validationBadge = '';
  if (v) {
    if (v.valido) {
      validationBadge = `<span class="badge badge-valid">${icon('check', 12)} Dígito Válido</span>`;
    } else {
      validationBadge = `<span class="badge badge-invalid">${icon('x', 12)} Dígito Inválido (esperado: ${v.calculado})</span>`;
    }
  }

  return `
    <div class="badges">
      <span class="badge ${modelClass}">${modelLabel}</span>
      ${validationBadge}
    </div>`;
}

function renderFields(tab) {
  if (!tab.parsed) return '';
  const p = tab.parsed;

  const fields = [
    { key: 'uf', label: 'UF/Estado', value: `${p.uf} — ${getUfDescricao(p.uf)}`, copyValue: p.uf },
    { key: 'ano', label: 'Ano/Mês', value: `20${p.ano}/${p.mes}`, copyValue: `20${p.ano}/${p.mes}` },
    { key: 'cnpj', label: 'CNPJ', value: formatarCnpj(p.cnpj), copyValue: p.cnpj },
    { key: 'modelo', label: 'Modelo', value: `${p.modelo} — ${getModeloDescricao(p.modelo)}`, copyValue: p.modelo },
    { key: 'serie', label: 'Série', value: p.serie, copyValue: p.serie },
    { key: 'numero', label: 'Número', value: p.numero, copyValue: p.numero },
    { key: 'tipoEmissao', label: 'Tipo Emissão', value: `${p.tipoEmissao} — ${getTipoEmissaoDescricao(p.tipoEmissao)}`, copyValue: p.tipoEmissao },
    { key: 'codigoNumerico', label: 'Cód. Numérico', value: p.codigoNumerico, copyValue: p.codigoNumerico },
    { key: 'digitoVerificador', label: 'Dígito Verif.', value: p.digitoVerificador, copyValue: p.digitoVerificador },
  ];

  const cards = fields.map(f => {
    const color = SEG_COLORS[f.key] || 'var(--text-primary)';
    const extraStyle = f.key === 'digitoVerificador' ? 'color: var(--seg-digito)' : `color: ${color}`;

    return `
      <div class="field-card" data-field-key="${escapeAttr(f.key)}" data-copy-value="${escapeAttr(f.copyValue)}">
        <span class="field-label">${f.label}</span>
        <span class="field-value" style="${extraStyle}">${f.value}</span>
        <button class="field-copy" title="Copiar">${icon('clipboard', 14)}</button>
        <span class="copy-tooltip">Copiado!</span>
      </div>`;
  }).join('');

  return `<div class="fields-grid">${cards}</div>`;
}

function renderActions(tab) {
  if (!tab.parsed) return '';
  return `
    <div class="actions">
      <button class="btn btn-primary" data-action="copy-link">${icon('link', 14)} Copiar Link</button>
      <button class="btn btn-outline" data-action="clear">Limpar</button>
    </div>`;
}

function renderHistory() {
  const items = historyFilter ? filterHistory(historyFilter) : getHistory();
  const chevronClass = historyOpen ? 'history-chevron open' : 'history-chevron';

  let bodyContent = '';
  if (historyOpen) {
    const searchHtml = `
      <div style="position: relative;">
        <input
          type="text"
          class="history-search"
          data-action="filter-history"
          placeholder="Filtrar chaves..."
          value="${escapeAttr(historyFilter)}"
        >
      </div>`;

    const itemsHtml = items.length
      ? items.map(item => {
          const badgeClass = getModelBadgeClass(item.modelo || '');
          const modelLabel = item.modelo ? getModeloDescricao(item.modelo) : '';
          return `
            <div class="history-item" data-history-chave="${escapeAttr(item.chave)}">
              <div style="display: flex; align-items: center; gap: 8px; overflow: hidden;">
                ${modelLabel ? `<span class="badge ${badgeClass}" style="flex-shrink: 0;">${modelLabel}</span>` : ''}
                <span class="history-chave">${item.chave}</span>
              </div>
              <span class="history-time">${formatRelativeTime(item.timestamp)}</span>
            </div>`;
        }).join('')
      : '<div style="padding: 8px 0; color: var(--text-secondary); font-size: 13px;">Nenhuma chave encontrada</div>';

    const footerHtml = items.length
      ? `<div class="history-footer">
           <button class="btn btn-danger" data-action="clear-history">${icon('trash', 14)} Limpar histórico</button>
         </div>`
      : '';

    bodyContent = `
      <div class="history-body ${historyOpen ? '' : 'collapsed'}">
        ${searchHtml}
        ${itemsHtml}
        ${footerHtml}
      </div>`;
  } else {
    bodyContent = `<div class="history-body collapsed"></div>`;
  }

  const totalCount = getHistory().length;
  if (totalCount === 0 && !historyOpen) return '';

  return `
    <div class="history">
      <div class="history-header" data-action="toggle-history">
        <span class="history-title">Últimas ${totalCount} Chaves Acessadas</span>
        <span class="${chevronClass}">${icon('chevronDown', 16)}</span>
      </div>
      ${bodyContent}
    </div>`;
}

function render() {
  const tab = activeTab();
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderTabBar()}
    <div class="tab-content">
      ${renderInput(tab)}
      ${renderBadges(tab)}
      ${renderFields(tab)}
      ${renderActions(tab)}
      ${renderHistory()}
    </div>`;
  bindEvents();
}

// --- Event Binding ---
function bindEvents() {
  const app = document.getElementById('app');

  // 1. Tab clicks
  app.querySelectorAll('.tab[data-tab-id]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.tab-close')) return;
      activeTabId = Number(el.dataset.tabId);
      render();
    });
  });

  // 2. Tab close
  app.querySelectorAll('.tab-close[data-close-id]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(el.dataset.closeId);
      if (tabs.length === 1) return;
      tabs = tabs.filter(t => t.id !== id);
      if (activeTabId === id) {
        activeTabId = tabs[0].id;
      }
      updateURL();
      render();
    });
  });

  // 3. New tab
  const newTabBtn = app.querySelector('[data-action="new-tab"]');
  if (newTabBtn) {
    newTabBtn.addEventListener('click', () => {
      if (tabs.length >= MAX_TABS) tabs.shift();
      const newTab = { id: nextTabId++, chave: '', parsed: null, validation: null };
      tabs.push(newTab);
      activeTabId = newTab.id;
      trackNovaAba();
      render();
      const input = document.querySelector('.chave-input');
      if (input) input.focus();
    });
  }

  // 4. Theme toggle
  const themeBtn = app.querySelector('[data-action="toggle-theme"]');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      currentTheme = toggleTheme();
      trackTemaAlterado(currentTheme);
      render();
    });
  }

  // 5. Input
  const input = app.querySelector('[data-action="input-chave"]');
  if (input && input.tagName === 'INPUT') {
    input.addEventListener('input', (e) => {
      const tab = activeTab();
      tab.chave = sanitizeInput(e.target.value);
      if (tab.chave.length === 44) {
        tab.parsed = parseChave(tab.chave);
        tab.validation = validarDigito(tab.chave);
        addToHistory({ chave: tab.chave, modelo: tab.parsed.modelo });
        trackChaveDecomposta(getModeloDescricao(tab.parsed.modelo));
        updateURL();
        render();
      } else {
        tab.parsed = null;
        tab.validation = null;
        // Update char count without full re-render
        const countEl = app.querySelector('.char-count');
        if (countEl) countEl.textContent = `${tab.chave.length}/44`;
      }
    });
  }

  // 6. Chave display click (edit mode)
  const chaveDisplay = app.querySelector('.chave-display');
  if (chaveDisplay) {
    chaveDisplay.addEventListener('click', () => {
      const tab = activeTab();
      tab.parsed = null;
      tab.validation = null;
      render();
      const inp = document.querySelector('.chave-input');
      if (inp) inp.focus();
    });
  }

  // 7. Field <-> segment hover
  app.querySelectorAll('.field-card[data-field-key]').forEach(card => {
    const key = card.dataset.fieldKey;
    card.addEventListener('mouseenter', () => {
      app.querySelectorAll('.chave-display span[data-seg]').forEach(seg => {
        if (seg.dataset.seg === key || (key === 'ano' && seg.dataset.seg === 'mes')) {
          seg.classList.add('highlight');
          seg.classList.remove('dimmed');
        } else {
          seg.classList.add('dimmed');
          seg.classList.remove('highlight');
        }
      });
    });
    card.addEventListener('mouseleave', () => {
      app.querySelectorAll('.chave-display span[data-seg]').forEach(span => {
        span.classList.remove('highlight', 'dimmed');
      });
    });
  });

  app.querySelectorAll('.chave-display span[data-seg]').forEach(span => {
    const key = span.dataset.seg;
    span.addEventListener('mouseenter', () => {
      app.querySelectorAll('.chave-display span[data-seg]').forEach(s => {
        if (s.dataset.seg === key) {
          s.classList.add('highlight');
          s.classList.remove('dimmed');
        } else {
          s.classList.add('dimmed');
          s.classList.remove('highlight');
        }
      });
      app.querySelectorAll('.field-card[data-field-key]').forEach(c => {
        if (c.dataset.fieldKey === key) {
          c.style.borderColor = 'var(--border-hover)';
        }
      });
    });
    span.addEventListener('mouseleave', () => {
      app.querySelectorAll('.chave-display span[data-seg]').forEach(s => {
        s.classList.remove('highlight', 'dimmed');
      });
      app.querySelectorAll('.field-card[data-field-key]').forEach(c => {
        c.style.borderColor = '';
      });
    });
  });

  // 8. Copy field
  app.querySelectorAll('.field-card[data-copy-value]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.field-copy')) {
        // clicked the copy button specifically
      }
      const value = card.dataset.copyValue;
      const fieldKey = card.dataset.fieldKey;
      copyToClipboard(value);
      trackCampoCopied(fieldKey);
      const tooltip = card.querySelector('.copy-tooltip');
      if (tooltip) {
        tooltip.classList.add('show');
        setTimeout(() => tooltip.classList.remove('show'), 1500);
      }
    });
  });

  // 9. Copy link
  const copyLinkBtn = app.querySelector('[data-action="copy-link"]');
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', () => {
      copyToClipboard(location.href);
      trackLinkCompartilhado(tabs.filter(t => t.chave.length === 44).length);
      const original = copyLinkBtn.innerHTML;
      copyLinkBtn.innerHTML = `${icon('check', 14)} Link copiado!`;
      setTimeout(() => {
        copyLinkBtn.innerHTML = original;
      }, 1500);
    });
  }

  // 10. Clear
  const clearBtn = app.querySelector('[data-action="clear"]');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const tab = activeTab();
      tab.chave = '';
      tab.parsed = null;
      tab.validation = null;
      updateURL();
      render();
      const inp = document.querySelector('.chave-input');
      if (inp) inp.focus();
    });
  }

  // 11. History toggle
  const historyHeader = app.querySelector('[data-action="toggle-history"]');
  if (historyHeader) {
    historyHeader.addEventListener('click', () => {
      historyOpen = !historyOpen;
      render();
    });
  }

  // 12. History filter
  const historySearch = app.querySelector('[data-action="filter-history"]');
  if (historySearch) {
    historySearch.addEventListener('input', (e) => {
      const cursorPos = e.target.selectionStart;
      historyFilter = e.target.value;
      render();
      const newInput = document.querySelector('[data-action="filter-history"]');
      if (newInput) {
        newInput.focus();
        newInput.setSelectionRange(cursorPos, cursorPos);
      }
    });
  }

  // 13. History item click
  app.querySelectorAll('.history-item[data-history-chave]').forEach(el => {
    el.addEventListener('click', () => {
      if (tabs.length >= MAX_TABS) tabs.shift();
      const chave = el.dataset.historyChave;
      const parsed = parseChave(chave);
      const validation = parsed ? validarDigito(chave) : null;
      const newTab = { id: nextTabId++, chave, parsed, validation };
      tabs.push(newTab);
      activeTabId = newTab.id;
      trackHistoricoUsado();
      updateURL();
      render();
    });
  });

  // 14. Clear history
  const clearHistoryBtn = app.querySelector('[data-action="clear-history"]');
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      clearAllHistory();
      historyFilter = '';
      render();
    });
  }

  // 15. Popover toggle
  document.querySelectorAll('.toolbar-btn[data-popover]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = btn.dataset.popover;
      const popover = document.querySelector(`.popover[data-popover-id="${targetId}"]`);
      if (!popover) return;
      // Close any other open popovers
      document.querySelectorAll('.popover.open').forEach(p => {
        if (p !== popover) p.classList.remove('open');
      });
      popover.classList.toggle('open');
    });
  });
}

// --- Close popovers on outside click ---
document.addEventListener('click', (e) => {
  if (!e.target.closest('.popover') && !e.target.closest('.toolbar-btn')) {
    document.querySelectorAll('.popover.open').forEach(p => p.classList.remove('open'));
  }
});

// --- Global Paste ---
document.addEventListener('paste', (e) => {
  if (document.activeElement?.classList.contains('chave-input')) return;
  if (document.activeElement?.dataset.action === 'filter-history') return;
  e.preventDefault();
  const text = e.clipboardData.getData('text');
  const cleaned = sanitizeInput(text);
  if (!cleaned) return;
  const tab = activeTab();
  tab.chave = cleaned;
  if (cleaned.length === 44) {
    tab.parsed = parseChave(cleaned);
    tab.validation = validarDigito(cleaned);
    addToHistory({ chave: cleaned, modelo: tab.parsed.modelo });
    trackChaveDecomposta(getModeloDescricao(tab.parsed.modelo));
    trackChaveViaPaste();
    updateURL();
  }
  render();
});

// --- URL Params on Load ---
function loadFromURL() {
  const params = new URLSearchParams(location.search);
  const chaves = params.getAll('chave');
  if (chaves.length === 0) return;
  tabs = chaves.map((raw, i) => {
    const chave = sanitizeInput(raw);
    const parsed = parseChave(chave);
    const validation = parsed ? validarDigito(chave) : null;
    if (parsed) addToHistory({ chave, modelo: parsed.modelo });
    return { id: nextTabId++, chave, parsed, validation };
  });
  activeTabId = tabs[0].id;
  trackChaveViaURL(chaves.length);
}

// --- Init ---
currentTheme = initTheme();
loadFromURL();
render();

// Hide SEO-only static content once JS app is running
const seoContent = document.getElementById('seo-content');
if (seoContent) seoContent.style.display = 'none';

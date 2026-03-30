import { sanitizeInput, parseChave, validarDigito, getUfDescricao, getTipoEmissaoDescricao, getModeloDescricao, formatarCnpj, SEGMENTS } from './chave-acesso.js';
import { initTheme, toggleTheme } from './theme.js';
import { getHistory, addToHistory, clearHistory as clearAllHistory, filterHistory, formatRelativeTime } from './history.js';
import { icon } from './icons.js';

const SEG_COLORS = {
  uf: 'var(--seg-uf)', ano: 'var(--seg-ano)', mes: 'var(--seg-mes)',
  cnpj: 'var(--seg-cnpj)', modelo: 'var(--seg-modelo)', serie: 'var(--seg-serie)',
  numero: 'var(--seg-numero)', tipoEmissao: 'var(--seg-tipo-emissao)',
  codigoNumerico: 'var(--seg-codigo-numerico)', digitoVerificador: 'var(--seg-digito)',
};

// --- State ---
let tabs = [{ id: Date.now(), chave: '', parsed: null, validation: null }];
let activeTabId = tabs[0].id;
let currentTheme = 'dark';
let historyOpen = false;
let historyFilter = '';

// --- Helpers ---
function activeTab() {
  return tabs.find(t => t.id === activeTabId);
}

function getModelBadgeClass(modelo) {
  if (modelo === '55') return 'badge-nfe';
  if (modelo === '57') return 'badge-cte';
  if (modelo === '65') return 'badge-nfce';
  return '';
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
      const suffix = t.chave.slice(-4);
      label = `<span class="tab-model">${modelo}</span> <span class="tab-suffix">...${suffix}</span>`;
    }
    return `
      <button class="tab ${isActive ? 'active' : ''}" data-tab-id="${t.id}">
        ${label}
        <span class="tab-close" data-close-id="${t.id}">${icon('x', 12)}</span>
      </button>`;
  }).join('');

  const themeIcon = currentTheme === 'dark' ? icon('sun', 16) : icon('moon', 16);

  return `
    <div class="tab-bar">
      ${tabsHtml}
      <button class="tab-new" data-action="new-tab" title="Nova aba">${icon('plus', 16)}</button>
      <div class="tab-bar-spacer"></div>
      <button class="theme-toggle" data-action="toggle-theme" title="Alternar tema">${themeIcon}</button>
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
          value="${tab.chave}"
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
      validationBadge = `<span class="badge badge-valid">${icon('check', 12)} Digito Valido</span>`;
    } else {
      validationBadge = `<span class="badge badge-invalid">${icon('x', 12)} Digito Invalido (esperado: ${v.calculado})</span>`;
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
    { key: 'ano', label: 'Ano/Mes', value: `${p.mes}/${p.ano}`, copyValue: `${p.mes}/${p.ano}` },
    { key: 'cnpj', label: 'CNPJ', value: formatarCnpj(p.cnpj), copyValue: p.cnpj },
    { key: 'modelo', label: 'Modelo', value: `${p.modelo} — ${getModeloDescricao(p.modelo)}`, copyValue: p.modelo },
    { key: 'serie', label: 'Serie', value: p.serie, copyValue: p.serie },
    { key: 'numero', label: 'Numero', value: p.numero, copyValue: p.numero },
    { key: 'tipoEmissao', label: 'Tipo Emissao', value: `${p.tipoEmissao} — ${getTipoEmissaoDescricao(p.tipoEmissao)}`, copyValue: p.tipoEmissao },
    { key: 'codigoNumerico', label: 'Cod. Numerico', value: p.codigoNumerico, copyValue: p.codigoNumerico },
    { key: 'digitoVerificador', label: 'Digito Verif.', value: p.digitoVerificador, copyValue: p.digitoVerificador },
  ];

  const cards = fields.map(f => {
    const color = SEG_COLORS[f.key] || 'var(--text-primary)';
    const extraStyle = f.key === 'digitoVerificador' ? 'color: var(--seg-digito)' : `color: ${color}`;
    return `
      <div class="field-card" data-field-key="${f.key}" data-copy-value="${f.copyValue}">
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
          value="${historyFilter}"
        >
      </div>`;

    const itemsHtml = items.length
      ? items.map(item => {
          const badgeClass = getModelBadgeClass(item.modelo || '');
          const modelLabel = item.modelo ? getModeloDescricao(item.modelo) : '';
          return `
            <div class="history-item" data-history-chave="${item.chave}">
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
           <button class="btn btn-danger" data-action="clear-history">${icon('trash', 14)} Limpar historico</button>
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
        <span class="history-title">Ultimas ${totalCount} Chaves Acessadas</span>
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
      const newTab = { id: Date.now(), chave: '', parsed: null, validation: null };
      tabs.push(newTab);
      activeTabId = newTab.id;
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
      app.querySelectorAll('.chave-display span[data-seg]').forEach(span => {
        if (span.dataset.seg === key) {
          span.classList.add('highlight');
          span.classList.remove('dimmed');
        } else {
          span.classList.add('dimmed');
          span.classList.remove('highlight');
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
      copyToClipboard(value);
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
      const chave = el.dataset.historyChave;
      const parsed = parseChave(chave);
      const validation = parsed ? validarDigito(chave) : null;
      const newTab = { id: Date.now(), chave, parsed, validation };
      tabs.push(newTab);
      activeTabId = newTab.id;
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
}

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
    return { id: Date.now() + i, chave, parsed, validation };
  });
  activeTabId = tabs[0].id;
}

// --- Init ---
currentTheme = initTheme();
loadFromURL();
render();

// GA4 event tracking — fails silently if gtag not loaded
function track(event, params = {}) {
  if (typeof gtag === 'function') {
    gtag('event', event, params);
  }
}

export function trackChaveDecomposta(modelo) {
  track('chave_decomposta', { modelo });
}

export function trackLinkCompartilhado(quantidadeChaves) {
  track('link_compartilhado', { quantidade_chaves: quantidadeChaves });
}

export function trackCampoCopied(campo) {
  track('campo_copiado', { campo });
}

export function trackTemaAlterado(tema) {
  track('tema_alterado', { tema });
}

export function trackHistoricoUsado() {
  track('historico_usado');
}

export function trackNovaAba() {
  track('nova_aba');
}

export function trackChaveViaURL(quantidade) {
  track('chave_via_url', { quantidade_chaves: quantidade });
}

export function trackChaveViaPaste() {
  track('chave_via_paste');
}

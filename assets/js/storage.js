// storage.js — wrapper sobre localStorage. Estado da partida e nome do xogador.

const CHAVE_PARTIDA = 'enforcado:partida';
const CHAVE_NOME = 'enforcado:nome';

export function gardarPartida(partida) {
  try {
    // letrasPremidasNaPartida é un Set; converte a array para serializar.
    const serializable = {
      ...partida,
      letrasPremidasNaPartida: [...partida.letrasPremidasNaPartida],
    };
    localStorage.setItem(CHAVE_PARTIDA, JSON.stringify(serializable));
  } catch (_) { /* localStorage cheo ou bloqueado: ignorar */ }
}

export function lerPartida() {
  try {
    const raw = localStorage.getItem(CHAVE_PARTIDA);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    obj.letrasPremidasNaPartida = new Set(obj.letrasPremidasNaPartida ?? []);
    return obj;
  } catch (_) { return null; }
}

export function borrarPartida() {
  try { localStorage.removeItem(CHAVE_PARTIDA); } catch (_) {}
}

export function gardarNome(nome) {
  try { localStorage.setItem(CHAVE_NOME, nome); } catch (_) {}
}

export function lerNome() {
  try { return localStorage.getItem(CHAVE_NOME) ?? ''; } catch (_) { return ''; }
}

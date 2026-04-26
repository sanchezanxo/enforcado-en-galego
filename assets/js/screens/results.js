// results.js — render do resumo de partida.

import { precision } from '../game.js';

export function renderResults(partida, raiz, vitoria) {
  raiz.querySelector('[data-zona="results-titulo"]').textContent =
    vitoria ? 'Parabéns!' : 'Fin da partida';
  raiz.querySelector('[data-zona="results-subtitulo"]').textContent =
    vitoria
      ? 'Completaches as 10 palabras.'
      : `Quedaches sen vidas tras ${partida.palabrasAcertadas} ${partida.palabrasAcertadas === 1 ? 'palabra acertada' : 'palabras acertadas'}.`;

  raiz.querySelector('[data-zona="results-puntos"]').textContent = String(partida.puntuacion);
  raiz.querySelector('[data-zona="results-acertadas"]').textContent =
    `${partida.palabrasAcertadas} / ${partida.palabras.length}`;
  raiz.querySelector('[data-zona="results-precision"]').textContent = precision(partida) + '%';
  raiz.querySelector('[data-zona="results-correctas"]').textContent = String(partida.letrasCorrectasTotal);
  raiz.querySelector('[data-zona="results-incorrectas"]').textContent = String(partida.letrasErradasTotal);

  // Lista de palabras
  const lista = raiz.querySelector('[data-zona="results-palabras"]');
  lista.innerHTML = '';

  const titulo = document.createElement('div');
  titulo.className = 'lista-palabras__titulo';
  titulo.textContent = 'Palabras desta partida';
  lista.appendChild(titulo);

  partida.historial.forEach((entrada) => {
    const item = document.createElement('div');
    item.className = 'lista-palabras__item';
    const palabra = document.createElement('span');
    palabra.className = 'lista-palabras__palabra' + (entrada.acertada ? '' : ' lista-palabras__palabra--fallada');
    palabra.textContent = (entrada.acertada ? '✓ ' : '✗ ') + entrada.palabra.toUpperCase();
    const def = document.createElement('span');
    def.className = 'lista-palabras__definicion';
    def.textContent = entrada.definicion;
    item.appendChild(palabra);
    item.appendChild(def);
    lista.appendChild(item);
  });
}

export function resetEstadoConsentimento(raiz) {
  const estado = raiz.querySelector('[data-zona="ranking-estado"]');
  if (estado) {
    estado.textContent = '';
    estado.removeAttribute('data-tipo');
  }
  const consentimento = raiz.querySelector('[data-zona="consentimento"]');
  if (consentimento) consentimento.hidden = false;
}

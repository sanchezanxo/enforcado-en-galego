// play.js — render da pantalla de xogo: vidas, palabra, teclado.

import {
  letrasTeclado,
  estadoCaixas,
  letraDispoñible,
  normalizarLetra,
  palabraActual,
} from '../game.js';

const SVG_CORAZON_CHEO =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
  '<path d="M12 21s-7-4.35-9.5-9.16C.84 8.5 2.7 4.5 6.5 4.5c1.74 0 3.41.81 4.5 2.09C12.09 5.31 13.76 4.5 15.5 4.5c3.8 0 5.66 4 4 7.34C19 16.65 12 21 12 21z"/>' +
  '</svg>';

const SVG_CORAZON_BALEIRO =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M12 21s-7-4.35-9.5-9.16C.84 8.5 2.7 4.5 6.5 4.5c1.74 0 3.41.81 4.5 2.09C12.09 5.31 13.76 4.5 15.5 4.5c3.8 0 5.66 4 4 7.34C19 16.65 12 21 12 21z"/>' +
  '</svg>';

let ultimasVidas = null;

export function renderPlay(partida, raiz, onLetra) {
  renderVidas(partida, raiz);
  renderMeta(partida, raiz);
  renderPalabra(partida, raiz);
  renderTeclado(partida, raiz, onLetra);
}

function renderVidas(partida, raiz) {
  const cont = raiz.querySelector('[data-zona="vidas"]');
  if (!cont) return;
  const total = partida.config.vidasIniciais;
  const html = [];
  for (let i = 0; i < total; i++) {
    const cheo = i < partida.vidas;
    const acaba = ultimasVidas !== null && partida.vidas < ultimasVidas && i === partida.vidas;
    const cls = cheo ? 'vidas__corazon' : 'vidas__corazon vidas__corazon--baleiro';
    html.push(
      `<span class="${cls}${acaba ? ' vidas__corazon--perdido' : ''}" aria-hidden="true">${cheo ? SVG_CORAZON_CHEO : SVG_CORAZON_BALEIRO}</span>`
    );
  }
  cont.innerHTML = html.join('');
  cont.setAttribute('aria-label', `Vidas: ${partida.vidas} de ${total}`);
  ultimasVidas = partida.vidas;
}

function renderMeta(partida, raiz) {
  raiz.querySelector('[data-zona="palabra-num"]').textContent = String(partida.palabraIndex + 1);
  raiz.querySelector('[data-zona="palabra-total"]').textContent = String(partida.palabras.length);
  raiz.querySelector('[data-zona="puntos"]').textContent = String(partida.puntuacion);
}

function renderPalabra(partida, raiz) {
  const cont = raiz.querySelector('[data-zona="palabra"]');
  if (!cont) return;
  const caixas = estadoCaixas(partida);
  cont.innerHTML = '';
  caixas.forEach((c) => {
    const span = document.createElement('span');
    span.className = 'palabra__caixa' + (c.revelada ? ' palabra__caixa--revelada' : '');
    span.textContent = c.letra || ' ';
    cont.appendChild(span);
  });
  // Anuncio para lectores: lonxitude da palabra.
  const total = caixas.length;
  const reveladas = caixas.filter((c) => c.revelada).length;
  cont.setAttribute('aria-label', `Palabra: ${reveladas} de ${total} letras descubertas.`);
}

export function reesponderFinPalabra(partida, raiz) {
  // Cando a palabra rematou: amosar todas as letras (ou marcar erradas).
  const cont = raiz.querySelector('[data-zona="palabra"]');
  if (!cont) return;
  const p = palabraActual(partida);
  if (!p) return;
  const letras = [...p.palabra];
  cont.innerHTML = '';
  letras.forEach((c) => {
    const span = document.createElement('span');
    const norm = normalizarLetra(c);
    const acertada = partida.letrasAdiviñadas.includes(norm);
    span.className = 'palabra__caixa palabra__caixa--final' + (acertada ? '' : ' palabra__caixa--errada');
    span.textContent = c.toUpperCase();
    cont.appendChild(span);
  });
}

function renderTeclado(partida, raiz, onLetra) {
  const cont = raiz.querySelector('[data-zona="teclado"]');
  if (!cont) return;
  const letras = letrasTeclado();
  // 27 letras → 3 filas de 9.
  cont.innerHTML = '';
  for (let f = 0; f < 3; f++) {
    const fila = document.createElement('div');
    fila.className = `teclado__fila teclado__fila--${f + 1}`;
    for (let i = 0; i < 9; i++) {
      const idx = f * 9 + i;
      if (idx >= letras.length) break;
      const letra = letras[idx];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tecla';
      btn.textContent = letra;
      btn.dataset.letra = letra;
      btn.setAttribute('aria-label', `Letra ${letra}`);

      if (partida.letrasAdiviñadas.includes(letra)) {
        btn.classList.add('tecla--acerto');
        btn.disabled = true;
      } else if (partida.letrasErradas.includes(letra)) {
        btn.classList.add('tecla--errado');
        btn.disabled = true;
      } else if (partida.estado !== 'xogando') {
        btn.disabled = true;
      }

      btn.addEventListener('click', () => onLetra(letra));
      fila.appendChild(btn);
    }
    cont.appendChild(fila);
  }
}

export function reset() { ultimasVidas = null; }

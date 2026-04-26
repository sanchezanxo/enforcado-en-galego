// app.js — orquestador. Router de pantallas, listeners globais.

import {
  novaPartida,
  premerLetra,
  seguintePalabra,
  rematarPartida,
  letraDispoñible,
  normalizarLetra,
  elixirPalabras,
  precision as calcPrecision,
} from './game.js';
import * as Storage from './storage.js';
import * as Api from './api.js';
import { renderPlay, reesponderFinPalabra, reset as resetPlay } from './screens/play.js';
import { renderResults, resetEstadoConsentimento } from './screens/results.js';
import { montarRanking, cargarRanking } from './screens/ranking.js';

const PANTALLAS = ['home', 'play', 'results', 'ranking', 'como-se-xoga', 'legal'];
const PANTALLA_DEFECTO = 'home';

let configXogo = {
  vidasIniciais: 10,
  palabrasPorPartida: 10,
  puntosPalabra: 100,
  bonusLetraCorrecta: 10,
  penalizacionLetraIncorrecta: -5,
  bonusPalabraSenErros: 50,
};

let todasAsPalabras = [];
let partida = null;
let partidaId = null;
let ultimaVitoria = false;
let rankingMontado = false;

const root = document;

document.addEventListener('DOMContentLoaded', async () => {
  await cargarConfig();
  await cargarPalabras();
  intentarRecuperarPartida();
  configurarListeners();
  irPantalla(rutaActualOuDefecto());
  window.addEventListener('hashchange', () => irPantalla(rutaActualOuDefecto()));
});

// ---------- Carga inicial ----------

async function cargarConfig() {
  try {
    const r = await fetch('/data/config.json');
    if (!r.ok) return;
    const c = await r.json();
    configXogo = {
      vidasIniciais: c.vidas_iniciais ?? configXogo.vidasIniciais,
      palabrasPorPartida: c.palabras_por_partida ?? configXogo.palabrasPorPartida,
      puntosPalabra: c.puntos_palabra ?? configXogo.puntosPalabra,
      bonusLetraCorrecta: c.bonus_letra_correcta ?? configXogo.bonusLetraCorrecta,
      penalizacionLetraIncorrecta: c.penalizacion_letra_incorrecta ?? configXogo.penalizacionLetraIncorrecta,
      bonusPalabraSenErros: c.bonus_palabra_sen_erros ?? configXogo.bonusPalabraSenErros,
    };
  } catch (_) { /* usa defaults */ }
}

async function cargarPalabras() {
  try {
    const r = await fetch('/data/palabras.json');
    if (!r.ok) throw new Error('palabras.json non dispoñible');
    const j = await r.json();
    todasAsPalabras = (j.palabras || []).filter((p) => p && p.palabra && p.definicion);
  } catch (e) {
    console.error('Erro cargando palabras', e);
    todasAsPalabras = [];
  }
}

function intentarRecuperarPartida() {
  const gardada = Storage.lerPartida();
  if (gardada && gardada.estado === 'xogando') {
    partida = gardada;
    const continuar = root.querySelector('[data-accion="continuar-partida"]');
    if (continuar) continuar.hidden = false;
  }
}

// ---------- Router ----------

function rutaActualOuDefecto() {
  const hash = (window.location.hash || '').replace(/^#/, '');
  if (PANTALLAS.includes(hash)) return hash;
  return PANTALLA_DEFECTO;
}

function irPantalla(nome) {
  const nodo = root.querySelector(`[data-pantalla="${nome}"]`);
  if (!nodo) return irPantalla(PANTALLA_DEFECTO);

  root.querySelectorAll('[data-pantalla]').forEach((el) => {
    el.hidden = el.dataset.pantalla !== nome;
  });
  document.body.dataset.pantallaActiva = nome;

  if (window.location.hash !== '#' + nome) {
    history.replaceState(null, '', '#' + nome);
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: '/#' + nome,
      page_title: 'enforcado · ' + nome,
    });
  }

  if (nome === 'play') {
    if (!partida || partida.estado === 'rematado') comezarPartida();
    else renderizarPlay();
  }

  if (nome === 'ranking') {
    if (!rankingMontado) {
      montarRanking(root.querySelector('[data-pantalla="ranking"]'));
      rankingMontado = true;
    } else {
      cargarRanking(root.querySelector('[data-pantalla="ranking"]'));
    }
  }
}

// ---------- Listeners globais ----------

function configurarListeners() {
  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-accion],[data-ir-a]');
    if (!t) return;

    if (t.dataset.irA) {
      e.preventDefault();
      irPantalla(t.dataset.irA);
      return;
    }

    const accion = t.dataset.accion;
    switch (accion) {
      case 'empezar-partida': comezarPartida(); irPantalla('play'); break;
      case 'continuar-partida': irPantalla('play'); break;
      case 'rematar-desde-play': rematarManual(); break;
      case 'seguinte-palabra': pasarSeguintePalabra(); break;
      case 'nova-partida': comezarPartida(); irPantalla('play'); break;
      case 'volver-home': irPantalla('home'); break;
      case 'enviar-ranking': enviarRanking(); break;
      case 'compartir': compartir(); break;
    }
  });

  // Teclado físico: A-Z, Ñ, e tildes.
  document.addEventListener('keydown', (e) => {
    if (document.body.dataset.pantallaActiva !== 'play') return;
    if (!partida || partida.estado !== 'xogando') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (typeof k !== 'string' || k.length !== 1) return;
    if (!/[\p{L}]/u.test(k)) return;
    e.preventDefault();
    onLetraPremida(k);
  });
}

// ---------- Partida ----------

function comezarPartida() {
  if (todasAsPalabras.length === 0) return;
  const elixidas = elixirPalabras(todasAsPalabras, configXogo.palabrasPorPartida);
  partida = novaPartida(elixidas, configXogo);
  partidaId = Api.uuidV4();
  ultimaVitoria = false;
  resetPlay();
  Storage.gardarPartida(partida);
}

function renderizarPlay() {
  const raiz = root.querySelector('[data-pantalla="play"]');
  renderPlay(partida, raiz, onLetraPremida);
}

function onLetraPremida(letra) {
  const norm = normalizarLetra(letra);
  if (!letraDispoñible(partida, norm)) return;
  const evento = premerLetra(partida, letra);
  Storage.gardarPartida(partida);
  renderizarPlay();

  if (evento.tipo === 'palabra-feita') {
    abrirDialogoPalabra(true, evento.bono);
    reesponderFinPalabra(partida, root.querySelector('[data-pantalla="play"]'));
  } else if (evento.tipo === 'sen-vidas') {
    abrirDialogoPalabra(false, 0);
    reesponderFinPalabra(partida, root.querySelector('[data-pantalla="play"]'));
  }
}

function pasarSeguintePalabra() {
  pecharDialogoPalabra();
  if (partida.vidas <= 0) {
    rematarPartida(partida);
    finalizar(false);
    return;
  }
  const ev = seguintePalabra(partida);
  if (partida.estado === 'rematado') {
    finalizar(ev.vitoria === true);
    return;
  }
  Storage.gardarPartida(partida);
  renderizarPlay();
}

function rematarManual() {
  if (!partida) return;
  rematarPartida(partida);
  finalizar(false);
}

function finalizar(vitoria) {
  ultimaVitoria = vitoria;
  if (!partida.fin) partida.fin = Date.now();
  Storage.borrarPartida();
  const continuar = root.querySelector('[data-accion="continuar-partida"]');
  if (continuar) continuar.hidden = true;

  const raiz = root.querySelector('[data-pantalla="results"]');
  resetEstadoConsentimento(raiz);
  // Pre-cargar nome se o usuario xa o usou antes.
  const inputNome = raiz.querySelector('[data-zona="nome-input"]');
  if (inputNome) inputNome.value = Storage.lerNome();
  renderResults(partida, raiz, vitoria);
  irPantalla('results');
}

// ---------- Diálogo entre palabras ----------

function abrirDialogoPalabra(acertada, bono) {
  const dlg = root.getElementById('dialogo-palabra');
  if (!dlg) return;
  const ultima = partida.historial[partida.historial.length - 1];
  if (!ultima) return;
  dlg.querySelector('[data-zona="dialogo-titulo"]').textContent =
    acertada ? 'Acertaches!' : 'Quedaches sen vidas';
  dlg.querySelector('[data-zona="dialogo-palabra"]').textContent = ultima.palabra.toUpperCase();
  dlg.querySelector('[data-zona="dialogo-definicion"]').textContent = ultima.definicion;
  dlg.querySelector('[data-zona="dialogo-puntos"]').textContent =
    acertada ? `+${bono} puntos${ultima.perfecta ? ' (sen erros!)' : ''}` : '';
  if (typeof dlg.showModal === 'function') dlg.showModal();
  else dlg.setAttribute('open', '');
}

function pecharDialogoPalabra() {
  const dlg = root.getElementById('dialogo-palabra');
  if (!dlg) return;
  if (typeof dlg.close === 'function') dlg.close();
  else dlg.removeAttribute('open');
}

// ---------- Enviar ao ranking ----------

async function enviarRanking() {
  const raiz = root.querySelector('[data-pantalla="results"]');
  const input = raiz.querySelector('[data-zona="nome-input"]');
  const estado = raiz.querySelector('[data-zona="ranking-estado"]');
  const btn = raiz.querySelector('[data-accion="enviar-ranking"]');

  const nome = (input.value || '').trim();
  if (!nome) {
    estado.textContent = 'Necesitamos un nome para gardar a puntuación.';
    estado.dataset.tipo = 'erro';
    input.focus();
    return;
  }

  Storage.gardarNome(nome);

  btn.disabled = true;
  estado.textContent = 'Enviando…';
  estado.removeAttribute('data-tipo');

  try {
    await Api.gardarPartida({
      id: partidaId,
      nome,
      puntos: partida.puntuacion,
      palabras_total: partida.palabras.length,
      palabras_acertadas: partida.palabrasAcertadas,
      letras_correctas: partida.letrasCorrectasTotal,
      letras_incorrectas: partida.letrasErradasTotal,
      precision: calcPrecision(partida),
      vidas_iniciais: partida.config.vidasIniciais,
      vidas_restantes: Math.max(0, partida.vidas),
      vitoria: ultimaVitoria ? 1 : 0,
      inicio: partida.inicio,
      fin: partida.fin || Date.now(),
    });
    estado.textContent = 'Puntuación gardada no ranking público.';
    estado.dataset.tipo = 'ok';
    raiz.querySelector('[data-zona="consentimento"]').hidden = true;
  } catch (e) {
    estado.textContent = e.message || 'Erro gardando.';
    estado.dataset.tipo = 'erro';
    btn.disabled = false;
  }
}

// ---------- Compartir ----------

async function compartir() {
  const texto = `Xoguei ao Enforcado en galego en ${window.location.origin}: ${partida?.puntuacion ?? 0} puntos, ${partida?.palabrasAcertadas ?? 0}/${partida?.palabras.length ?? 0} palabras.`;
  const url = window.location.origin;
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Enforcado en galego', text: texto, url });
    } catch (_) { /* usuario cancelou */ }
    return;
  }
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(`${texto} ${url}`);
      const raiz = root.querySelector('[data-pantalla="results"]');
      const estado = raiz.querySelector('[data-zona="ranking-estado"]');
      estado.textContent = 'Copiouse a ligazón ao portapapeis.';
      estado.dataset.tipo = 'ok';
    } catch (_) {}
  }
}

// game.js — lóxica pura do enforcado, sen DOM nin fetch.

const ALFABETO = [
  'A','B','C','D','E','F','G','H','I',
  'J','K','L','M','N','Ñ','O','P','Q',
  'R','S','T','U','V','W','X','Y','Z',
];

// Letras "irrelevantes" en galego pero conserválas no teclado por estranxeirismos
// (KIWI, JET, YOGUR, WHISKY...) para non romper palabras importadas.

export function letrasTeclado() {
  return ALFABETO.slice();
}

// Normaliza unha letra para comparación: quita tildes pero mantén Ñ/N como
// letras distintas. 'Á' → 'A', 'É' → 'E', 'Ü' → 'U'. 'Ñ' → 'Ñ'.
export function normalizarLetra(c) {
  if (c === 'ñ' || c === 'Ñ') return 'Ñ';
  return c.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
}

export function letrasNormalizadasDe(palabra) {
  return [...palabra].map(normalizarLetra);
}

// Crea un estado novo de partida. `palabras` é un array de {palabra, definicion}.
export function novaPartida(palabras, config) {
  return {
    palabras: palabras.slice(),
    palabraIndex: 0,
    letrasAdiviñadas: [],   // letras normalizadas correctamente premidas para a palabra actual
    letrasErradas: [],      // letras normalizadas erradas para a palabra actual
    letrasPremidasNaPartida: new Set(), // todas as letras (correctas e erradas) en toda a partida — para resumo
    vidas: config.vidasIniciais,
    puntuacion: 0,
    palabrasAcertadas: 0,
    letrasCorrectasTotal: 0,
    letrasErradasTotal: 0,
    historial: [],          // [{palabra, definicion, acertada, vidas_perdidas_aqui, perfecta}]
    inicio: Date.now(),
    fin: null,
    estado: 'xogando',      // 'xogando' | 'palabra-feita' | 'rematado'
    config,
  };
}

export function palabraActual(partida) {
  return partida.palabras[partida.palabraIndex] ?? null;
}

// Devolve as letras orixinais da palabra (con tildes) na orde, ou '' para huecos.
export function estadoCaixas(partida) {
  const p = palabraActual(partida);
  if (!p) return [];
  const letras = [...p.palabra];
  return letras.map((c) => {
    const norm = normalizarLetra(c);
    if (partida.letrasAdiviñadas.includes(norm)) {
      return { letra: c.toUpperCase(), revelada: true };
    }
    return { letra: '', revelada: false };
  });
}

export function letraDispoñible(partida, letraNormal) {
  return !partida.letrasAdiviñadas.includes(letraNormal)
      && !partida.letrasErradas.includes(letraNormal);
}

// Premer letra. Devolve un evento describindo o resultado:
//   { tipo: 'duplicada' | 'acerto' | 'fallo' | 'palabra-feita' | 'sen-vidas', delta }
export function premerLetra(partida, letra) {
  if (partida.estado !== 'xogando') return { tipo: 'duplicada' };
  const norm = normalizarLetra(letra);
  if (!letraDispoñible(partida, norm)) return { tipo: 'duplicada' };

  partida.letrasPremidasNaPartida.add(norm);
  const palabraNorm = letrasNormalizadasDe(palabraActual(partida).palabra);

  if (palabraNorm.includes(norm)) {
    partida.letrasAdiviñadas.push(norm);
    const ocorrencias = palabraNorm.filter((c) => c === norm).length;
    partida.letrasCorrectasTotal += ocorrencias;
    partida.puntuacion += ocorrencias * partida.config.bonusLetraCorrecta;

    if (palabraCompleta(partida)) {
      return rematarPalabra(partida, /*acertada=*/true);
    }
    return { tipo: 'acerto', ocorrencias };
  }

  partida.letrasErradas.push(norm);
  partida.letrasErradasTotal += 1;
  partida.vidas -= 1;
  partida.puntuacion = Math.max(0, partida.puntuacion + partida.config.penalizacionLetraIncorrecta);

  if (partida.vidas <= 0) {
    return rematarPalabra(partida, /*acertada=*/false);
  }
  return { tipo: 'fallo' };
}

function palabraCompleta(partida) {
  const norm = letrasNormalizadasDe(palabraActual(partida).palabra);
  return norm.every((c) => partida.letrasAdiviñadas.includes(c));
}

function rematarPalabra(partida, acertada) {
  const palabraObj = palabraActual(partida);
  const erradas = partida.letrasErradas.length;
  let bono = 0;

  if (acertada) {
    bono = partida.config.puntosPalabra;
    if (erradas === 0) bono += partida.config.bonusPalabraSenErros;
    partida.puntuacion += bono;
    partida.palabrasAcertadas += 1;
  }

  partida.historial.push({
    palabra: palabraObj.palabra,
    definicion: palabraObj.definicion,
    acertada,
    vidas_perdidas: erradas,
    perfecta: acertada && erradas === 0,
    bono,
  });

  partida.estado = 'palabra-feita';

  if (!acertada || partida.vidas <= 0) {
    return { tipo: 'sen-vidas', bono };
  }
  return { tipo: 'palabra-feita', bono };
}

// Pasa á seguinte palabra. Se non quedan, marca a partida como rematada.
export function seguintePalabra(partida) {
  partida.palabraIndex += 1;
  partida.letrasAdiviñadas = [];
  partida.letrasErradas = [];

  if (partida.palabraIndex >= partida.palabras.length) {
    partida.estado = 'rematado';
    partida.fin = Date.now();
    return { tipo: 'partida-rematada', vitoria: true };
  }

  partida.estado = 'xogando';
  return { tipo: 'nova-palabra' };
}

export function rematarPartida(partida) {
  if (partida.estado !== 'rematado') {
    partida.estado = 'rematado';
    partida.fin = Date.now();
  }
}

export function precision(partida) {
  const total = partida.letrasCorrectasTotal + partida.letrasErradasTotal;
  if (total === 0) return 0;
  return Math.round((partida.letrasCorrectasTotal / total) * 100);
}

// Selecciona N palabras aleatorias dunha lista, evitando repeticións.
export function elixirPalabras(todas, n) {
  if (n >= todas.length) return mesturar(todas.slice());
  const copia = todas.slice();
  mesturar(copia);
  return copia.slice(0, n);
}

function mesturar(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

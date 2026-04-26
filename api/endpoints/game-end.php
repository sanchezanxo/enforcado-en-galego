<?php
// POST /api/game-end → garda partida do enforcado.

declare(strict_types=1);

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responderErro(405, 'METODO', 'Método non permitido.');
}

validarCsrf($config);

$pdo = obterConexion();
verificarLimite($pdo, 'game-end', $config['rate_limit']['max_por_minuto']);

$body = lerBody();

$id = validarUuid((string)($body['id'] ?? ''));
$nome = validarNomeXogador((string)($body['nome'] ?? ''));

$puntos             = validarRangoInt($body['puntos']             ?? null, 0, 1_000_000, 'puntos');
$palabrasTotal      = validarRangoInt($body['palabras_total']     ?? null, 1, 100,       'palabras_total');
$palabrasAcertadas  = validarRangoInt($body['palabras_acertadas'] ?? null, 0, $palabrasTotal, 'palabras_acertadas');
$letrasCorrectas    = validarRangoInt($body['letras_correctas']   ?? null, 0, 100_000,   'letras_correctas');
$letrasIncorrectas  = validarRangoInt($body['letras_incorrectas'] ?? null, 0, 100_000,   'letras_incorrectas');
$precision          = validarRangoInt($body['precision']          ?? null, 0, 100,       'precision');
$vidasIniciais      = validarRangoInt($body['vidas_iniciais']     ?? null, 1, 100,       'vidas_iniciais');
$vidasRestantes     = validarRangoInt($body['vidas_restantes']    ?? null, 0, $vidasIniciais, 'vidas_restantes');
$vitoria            = validarRangoInt($body['vitoria']            ?? null, 0, 1,         'vitoria');

$inicio = validarRangoInt($body['inicio'] ?? null, 1_000_000_000_000, 9_999_999_999_999, 'inicio');
$fin    = validarRangoInt($body['fin']    ?? null, 1_000_000_000_000, 9_999_999_999_999, 'fin');
if ($fin < $inicio) {
    throw new InvalidArgumentException('A data de fin é anterior ao inicio.');
}
$duracionSeg = (int) round(($fin - $inicio) / 1000);
if ($duracionSeg > 24 * 3600) {
    throw new InvalidArgumentException('Duración da partida fóra de rango.');
}

$inicioIso = msIso8601($inicio);
$finIso    = msIso8601($fin);
$fingerprint = obterFingerprint($config);

try {
    $stmt = $pdo->prepare(
        'INSERT INTO partidas
         (id, nome, fingerprint, puntos, palabras_total, palabras_acertadas,
          letras_correctas, letras_incorrectas, precision_pct,
          vidas_iniciais, vidas_restantes, vitoria,
          duracion_seg, inicio, fin)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $id, $nome, $fingerprint, $puntos, $palabrasTotal, $palabrasAcertadas,
        $letrasCorrectas, $letrasIncorrectas, $precision,
        $vidasIniciais, $vidasRestantes, $vitoria,
        $duracionSeg, $inicioIso, $finIso,
    ]);
} catch (PDOException $e) {
    if (str_contains((string)$e->getMessage(), 'UNIQUE') ||
        str_contains((string)$e->getMessage(), 'Duplicate')) {
        responderErro(409, 'DUPLICADO', 'Esta partida xa estaba gardada.');
    }
    throw $e;
}

responderOk(['id' => $id]);

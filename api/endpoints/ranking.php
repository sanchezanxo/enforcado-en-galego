<?php
// GET /api/ranking?periodo=semana|mes|todo&top=20

declare(strict_types=1);

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    responderErro(405, 'METODO', 'Método non permitido.');
}

$pdo = obterConexion();
verificarLimite($pdo, 'ranking', $config['rate_limit']['max_por_minuto'] * 3);

$periodo = $_GET['periodo'] ?? 'todo';
if (!in_array($periodo, ['semana', 'mes', 'todo'], true)) {
    $periodo = 'todo';
}

$top = (int) ($_GET['top'] ?? 20);
if ($top < 1) $top = 1;
if ($top > 50) $top = 50;

$driverEsSqlite = obterDriver() === 'sqlite';

$where = '';
if ($periodo === 'semana') {
    $where = $driverEsSqlite
        ? "WHERE inicio >= datetime('now', '-7 days')"
        : "WHERE inicio >= (NOW() - INTERVAL 7 DAY)";
} elseif ($periodo === 'mes') {
    $where = $driverEsSqlite
        ? "WHERE inicio >= datetime('now', '-30 days')"
        : "WHERE inicio >= (NOW() - INTERVAL 30 DAY)";
}

$sql =
    "SELECT nome, puntos, palabras_acertadas, palabras_total,
            letras_correctas, letras_incorrectas, precision_pct,
            vitoria, inicio
     FROM partidas
     $where
     ORDER BY puntos DESC, palabras_acertadas DESC, precision_pct DESC, inicio DESC
     LIMIT $top";

$stmt = $pdo->query($sql);
$filas = $stmt->fetchAll();

$resultado = array_map(function ($f) {
    return [
        'nome'      => $f['nome'],
        'puntos'    => (int) $f['puntos'],
        'acertadas' => (int) $f['palabras_acertadas'],
        'total'     => (int) $f['palabras_total'],
        'precision' => (int) $f['precision_pct'],
        'vitoria'   => (bool) $f['vitoria'],
        'data'      => $f['inicio'],
    ];
}, $filas);

responderOk(['periodo' => $periodo, 'top' => $top, 'ranking' => $resultado]);

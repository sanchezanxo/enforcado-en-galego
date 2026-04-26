# Enforcado en galego — As Chaves da Lingua

Web app para xogar ao **Enforcado en galego**: adiviña 10 palabras letra a letra antes de quedar sen vidas. En produción en https://enforcado.aschavesdalingua.gal.

## Stack

- HTML5 + CSS + JS vanilla (ES6 módulos). Sen build-step.
- PHP 8.1+ procedural con PDO.
- SQLite 3 (mesmo motor en local e produción; esquema dual mantido para MariaDB).
- Tipografías Merriweather + Open Sans, **self-hosted**.

## Desenvolvemento local

```bash
cp api/config.sample.php api/config.php
# Xerar salts e poñelos en api/config.php
php -r "echo bin2hex(random_bytes(32)).PHP_EOL;"

php db/init.php
php -S localhost:8000 router.php
```

Abrir <http://localhost:8000>.

## Despregue á produción

```bash
# Desde o monorepo
rsync -avz \
  --exclude='.git/' --exclude='.gitignore' \
  --exclude='.claude/' --exclude='CLAUDE.md' --exclude='README.md' \
  --exclude='api/config.php' \
  --exclude='db/*.sqlite*' \
  --exclude='router.php' \
  --exclude='*.log' --exclude='.DS_Store' \
  ./enforcado/ usuario@servidor:enforcado.aschavesdalingua.gal/
```

No servidor, primeira vez:

```bash
ssh usuario@servidor
cd enforcado.aschavesdalingua.gal
cp api/config.sample.php api/config.php
# editar api/config.php: env=production, salts aleatorios, origen_permitido https://enforcado.aschavesdalingua.gal
chmod 600 api/config.php
php db/init.php
```

## Estrutura

```
enforcado/
├── index.html              # SPA con hash routes
├── .htaccess
├── assets/
│   ├── fonts/              # merriweather + opensans (self-hosted)
│   ├── css/                # main / components / screens
│   └── js/                 # app, game, api, storage + screens/*
├── data/
│   ├── palabras.json       # base léxica (~900 palabras + definicións)
│   └── config.json         # parámetros do xogo (vidas, puntos…)
├── api/                    # PHP + PDO
│   ├── index.php
│   ├── db.php
│   ├── lib/utils.php
│   ├── config.sample.php
│   └── endpoints/{token,game-end,ranking}.php
└── db/
    ├── init.php
    └── schema.{sqlite,mariadb}.sql
```

## Licenza

- Código: GPL-3.0.
- Base léxica: CC BY-NC 4.0.

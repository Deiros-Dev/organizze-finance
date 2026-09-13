# Banca · Day Trade

Aplicativo para acompanhar a banca de day trade / opções binárias: banca em destaque,
dashboard diário das operações (com fotos das entradas), aportes e um simulador de
projeção de lucro.

## Stack

- **Vite + React + TypeScript**
- **Tailwind CSS** — tema escuro (padrão) e claro, tons de preto e azul
- **lucide-react** — ícones
- **Supabase** — Postgres (dados) + Storage (fotos das operações), acesso sem login
  pela chave anônima
- **zustand** + `persist` — estado em memória; só preferências de tela ficam no
  `localStorage` (tema, parâmetros da projeção)
- Gráficos em SVG próprio (sem dependência de biblioteca de charts)

## Rodando

```bash
npm install
cp .env.example .env.local   # preencha com os valores do seu projeto Supabase
npm run db:migrate           # cria as tabelas e o bucket de fotos
npm run dev
```

Abre em `http://localhost:5173`. Sem `.env.local` configurado o app mostra uma tela
pedindo as variáveis.

Outros scripts:

```bash
npm run build      # build de produção em dist/
npm run preview    # serve o build
npm run typecheck  # checagem de tipos
npm run db:migrate # aplica supabase/migrations/*.sql no banco
```

## Como funciona

### Banca

`Banca = aportes + lucro/prejuízo das operações` (+ banca inicial opcional em Ajustes).

### Operações

Cada registro é o **resultado consolidado de um dia** (ganho ou perda em R$), com
observação e até 6 fotos (prints das entradas). A aba mostra um dashboard por mês —
resumo com subtotal/assertividade e gráfico de barras por dia — seguido de um card por
dia operado com o resultado em destaque e as fotos ao lado; clique numa foto para abrir
em tela cheia, ou no card para editar/excluir.

### Aportes

Lista de capital adicionado à banca, com data e observação.

### Projeção

Simulador estatístico baseado em valor esperado:

```
valor por entrada   = banca × risco%
valor esperado/op   = stake × (acerto% × payout% − erro%)
lucro no mês        = EV/op × nº de entradas      (ou composto, entrada a entrada)
ponto de equilíbrio = 1 / (1 + payout)            → acerto mínimo para não ter prejuízo
```

Parâmetros: banca, risco por entrada, operações/mês, assertividade, payout, dias
operados e juros compostos. Mostra lucro mensal e diário, ROI, banca projetada ao fim
do mês, curva de evolução e sensibilidade à assertividade.

> Projeção é referência de planejamento, não garantia. Opções binárias envolvem risco
> real de perda.

## Dados

Operações, aportes e fotos moram no Supabase (sem login — RLS liberada pela chave
anônima; veja `supabase/migrations/`). Em **Ajustes** dá para exportar/importar um JSON
de backup (não inclui as fotos em si, só os paths), carregar dados de exemplo ou limpar
tudo (inclusive o bucket de fotos).

## Estrutura

```
src/
  lib/        store (zustand + Supabase), storage (upload/URL de fotos), cálculos,
              formatação pt-BR, dados de exemplo
  components/ ui base, gráficos SVG, fotos (picker/tira/lightbox), sidebar, hero da
              banca, diálogos
  pages/      Dashboard, Operações, Aportes, Projeção, Ajustes
supabase/
  migrations/ schema SQL (tabelas + RLS + bucket de fotos), aplicado via db:migrate
scripts/
  migrate.mjs roda os .sql de supabase/migrations no Postgres do projeto
```

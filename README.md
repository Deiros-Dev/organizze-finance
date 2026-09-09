# Banca · Day Trade

Aplicativo para acompanhar a banca de day trade / opções binárias: banca em destaque,
relatório de operações por dia, aportes e um simulador de projeção de lucro.

## Stack

- **Vite + React + TypeScript**
- **Tailwind CSS** — tema escuro (padrão) e claro, tons de preto e azul
- **lucide-react** — ícones
- **zustand** + `persist` — estado salvo no `localStorage` (chave `daytrade-banca`)
- Gráficos em SVG próprio (sem dependência de biblioteca de charts)

## Rodando

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

Outros scripts:

```bash
npm run build      # build de produção em dist/
npm run preview    # serve o build
npm run typecheck  # checagem de tipos
```

## Como funciona

### Banca

`Banca = aportes + lucro/prejuízo das operações` (+ banca inicial opcional em Ajustes).

### Operações

Cada registro é o **resultado consolidado de um dia** (ganho ou perda em R$). Aparece no
relatório agrupado por mês, com subtotal, contagem de greens/reds e assertividade.
Clique numa linha para editar ou excluir.

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

Tudo fica no navegador (`localStorage`). Em **Ajustes** dá para exportar/importar um
JSON de backup, carregar dados de exemplo ou limpar tudo.

## Estrutura

```
src/
  lib/        store (zustand), cálculos, formatação pt-BR, dados de exemplo
  components/ ui base, gráficos SVG, sidebar, hero da banca, diálogos
  pages/      Dashboard, Operações, Aportes, Projeção, Ajustes
```

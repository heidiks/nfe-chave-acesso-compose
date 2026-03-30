# Chave de Acesso Compose

Ferramenta web para decomposição e validação de chaves de acesso de documentos fiscais eletrônicos brasileiros.

[Acesse online](https://heidiks.github.io/nfe-chave-acesso-compose)

## Modelos suportados

| Modelo | Documento | Descrição |
|--------|-----------|-----------|
| 55 | NF-e | Nota Fiscal Eletrônica |
| 57 | CT-e | Conhecimento de Transporte Eletrônico |
| 58 | MDF-e | Manifesto Eletrônico de Documentos Fiscais |
| 59 | CF-e SAT | Cupom Fiscal Eletrônico (SAT) |
| 63 | BP-e | Bilhete de Passagem Eletrônico |
| 65 | NFC-e | Nota Fiscal de Consumidor Eletrônica |
| 66 | NF3e | Nota Fiscal de Energia Elétrica Eletrônica |
| 67 | CT-e OS | CT-e para Outros Serviços |

Todos seguem a mesma estrutura de chave de 44 dígitos com validação Mod 11.

## Funcionalidades

- Decomposição automática ao colar uma chave de 44 dígitos
- Validação automática do dígito verificador
- Highlight colorido de cada segmento da chave
- Multi-tab (múltiplas chaves abertas simultaneamente)
- Histórico das últimas 10 chaves acessadas com busca
- Copiar campos individuais com um clique
- URL compartilhável (`?chave=...`)
- Tema dark/light com detecção automática do sistema
- Layout responsivo (desktop, tablet, mobile)
- Ctrl+V global (cola em qualquer lugar da página)

## Estrutura da chave de acesso

```
Posição  Tam  Campo
──────── ──── ──────────────────
 0-1      2   UF (código do estado)
 2-3      2   Ano de emissão
 4-5      2   Mês de emissão
 6-19    14   CNPJ do emitente
20-21     2   Modelo do documento
22-24     3   Série
25-33     9   Número do documento
34        1   Tipo de emissão
35-42     8   Código numérico
43        1   Dígito verificador (Mod 11)
```

## Desenvolvimento

```bash
# instalar dependências
npm install

# dev server com hot reload
npm run dev

# build para produção
npm run build

# preview do build
npm run preview
```

## Tech Stack

- Vanilla JS (ES modules)
- Vite
- CSS puro (custom properties, grid, media queries)
- Zero dependências runtime

## Referências

- [Portal da NF-e — Sefaz](http://www.nfe.fazenda.gov.br)

## Licença

MIT

# GAME Sistema Comércio — FENICS 2026

Jogo de totem touchscreen (43", Android 11, 1080×1920 vertical) para o **FENICS 2026**
— Montes Claros/MG, 10 a 13 de setembro de 2026. Sistema Fecomércio MG.

Captura de leads em 4 telas + três mini-jogos de 45 segundos:

- **Relacione as colunas** — serviços do Sesc Montes Claros e seus benefícios
- **Caça-palavras** — a oferta do Senac Montes Claros
- **Jogo da memória** — soluções do Sistema Fecomércio para empresas

HTML puro, sem build e sem dependências. Funciona offline; os leads ficam no
`localStorage` e sincronizam com uma planilha Google quando há rede.

```bash
python3 -m http.server 8766     # → http://localhost:8766
```

Documentação técnica completa em [CLAUDE.md](CLAUDE.md).

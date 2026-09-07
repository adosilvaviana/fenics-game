# CLAUDE.md — FENICS 2026 · GAME Sistema Comércio

> Leia este arquivo inteiro antes de mexer em qualquer coisa.

---

## O que é

Jogo de totem touchscreen para o **FENICS 2026** — Parque de Exposições João Alencar
Athayde, Montes Claros/MG, **10 a 13 de setembro de 2026**, das 18h às 00h.
Público estimado: 100 mil pessoas. Cliente: Sistema Fecomércio MG (Sesc/Senac/Sindicatos).

Captura leads num formulário de 4 telas e oferece três mini-jogos de 45 segundos.
Baseado no `expousipa-game`, mas com arte, textos e jogos totalmente novos.

**Instalação do totem: 09/09/2026.** Técnico de plantão durante os 3 dias do evento.

---

## Rodar e publicar

```bash
python3 -m http.server 8766      # → http://localhost:8766
```

Para conferir a arte de uma tela específica: `http://localhost:8766/?tela=cta-sesc`
(nomes na tabela de telas abaixo). O app **sempre abre na splash** — recarregar no
meio de uma partida não pode deixar o totem preso num jogo.

Publicar:

```bash
git add -A && git commit -m "descrição" && git push origin main
```

GitHub Pages publica em ~1 min. **Depois do push, `Ctrl+Shift+R` no totem** — o Pages
serve com `Cache-Control: max-age=600`, então sem recarga forçada o totem pode rodar a
versão antiga por até 10 minutos. Se não der para forçar, abrir com `?v=2` (qualquer
valor novo) também escapa do cache.

---

## Totem (especificação do contrato)

| Item | Valor |
|---|---|
| Tela | 43", Full HD 1920×1080, **vertical (portrait)** |
| Touch | capacitivo, até 10 toques simultâneos, resposta 6 ms |
| SO | Android 11 |
| RAM / Armazenamento | 4 GB / 32 GB |
| Rede | Wi-Fi 2.4 GHz, Ethernet RJ45, Bluetooth |

O app é desenhado num canvas fixo de **1080×1920** e `scaleToFit()` aplica
`transform: scale()` para caber em qualquer tela. Se o modelo do totem mudar,
nada precisa ser reescrito.

---

## Arquitetura

Dois arquivos, zero dependências, zero build: `index.html` (app) e `admin.html` (leads).

- **Navegação:** `goTo(id)` troca a `.screen` ativa e escreve o hash. Sem router.
- **Telas:** cada tela é um `<div class="screen">` com a arte oficial como
  `background-image`, e por cima apenas os elementos que precisam mudar.
- **Toques:** um único `document.addEventListener('click', ...)` com `closest()`.
  **Nunca usar `onclick` inline.**
- **Persistência:** `localStorage` (`fenics_leads`) + fila de reenvio (`fenics_queue`).
- **XSS:** toda string de usuário renderizada no DOM passa por `esc()`.

### Por que a arte é imagem e não CSS

As telas vieram prontas do designer do cliente, já aprovadas. Os títulos usam
**Joc Display, Plakato Neon Pro e Rix_Pro 3D** — fontes Adobe protegidas que **não
vieram** no pacote e não podem ser reproduzidas. Por isso as 23 telas são usadas
como imagem, exatamente como exportadas.

**Não recriar elemento de arte em CSS ou SVG.** Se precisar de uma peça nova,
recorte do material em `_ref/` (veja abaixo).

Só têm texto em HTML (fontes Roboto e Press Start 2P, essas sim liberadas):
os campos do cadastro, as mensagens de erro, o cronômetro e as letras do caça-palavras.

---

## Material de origem (`_ref/`)

Não vai para o Git (é pesado). Guardar em backup separado.

| Pasta | O que é |
|---|---|
| `_ref/TELAS_ABERTAS/…/*.ai` | **Arquivo do Illustrator — é um PDF 1.6 válido.** 24 pranchetas 1080×1920, vetoriais, com o texto ainda vivo. Abre com PyMuPDF (`fitz`). |
| `_ref/TELAS_PNG/` | Os mesmos layouts em PNG 8000×14223 |
| `_ref/ai_render/` | As 24 pranchetas renderizadas em 1080×1920 |

As telas em `telas/` **foram geradas do `.ai`**, não dos PNGs — saem mais nítidas e
com um terço do peso. Para regerar:

```python
import fitz
d = fitz.open('_ref/TELAS_ABERTAS/.../web_fenics2026_telas_jogo_1080x1920px_004.ai')
d[N].get_pixmap(dpi=72).save('saida.png')     # dpi=72 → 1080×1920 exato
```

**Exceção — `telas/selecao.png`:** a prancheta 5 do `.ai` tem dois títulos empilhados
no mesmo lugar ("Selecione seu jogo", versão antiga, atrás de "Sistema Comércio MG").
Renderizar o `.ai` mostra os dois sobrepostos. Essa tela vem do PNG oficial reduzido.

**Fundos limpos:** `col-jogo-bg`, `mem-jogo-bg` e `cp-jogo-bg` são versões sem os
cards/cartas/letras, para que os elementos dinâmicos sejam desenhados por cima.
Foram obtidos apagando essas áreas por interpolação vertical (a horizontal borrava
a curva creme). O miolo dessas áreas fica sempre coberto pelas peças.

---

## Telas

| Nome (`?tela=`) | Papel |
|---|---|
| `splash` | Abertura — toque em qualquer lugar |
| `cad1` | Nome, CPF/CNPJ, e-mail, telefone, maior de 18 |
| `cad2` | Perfil profissional (escolha única) |
| `cad3` | O que busca no momento (múltipla escolha) |
| `cad4` | Política de Privacidade / LGPD |
| `selecao` | Escolha do jogo (3 caminhos) |
| `col-regras` `col-jogo` `col-win` `col-lose` `cta-sesc` | Relacione as colunas → Credencial Sesc |
| `cp-regras` `cp-jogo` `cp-win` `cp-lose` `cta-senac` | Caça-palavras → Matricule-se |
| `mem-regras` `mem-jogo` `mem-win` `mem-lose` `cta-sind` | Jogo da memória → Filie-se |

`ENCERRAR` volta pra splash e limpa tudo. `PRÓXIMO JOGO` volta pra seleção
mantendo o cadastro — a pessoa pode jogar os três sem recadastrar, e os resultados
se acumulam **no mesmo lead**.

Sem toque por **90 segundos** → volta pra splash e descarta o cadastro em andamento.

---

## Os três jogos

Todos com **45 segundos** e contagem regressiva 3-2-1 antes de começar.

O cronômetro usa um **prazo absoluto** (`Date.now() + 45s`), não contagem de ticks.
O Android suspende timers de aba em segundo plano; com prazo absoluto o relógio se
corrige ao voltar, em vez de "ganhar" o tempo parado. `visibilitychange` reacerta na hora.

**Botão JOGAR nas três telas de regras:** elas não avançam mais com toque em qualquer
lugar — assim a pessoa lê as regras sem começar sem querer. O botão é um **recorte da
própria arte** (o JOGAR da tela LGPD, `sprites/btn-jogar.png`), não um botão refeito em CSS.

Fica em `left:412px; top:1240px` nas três: as telas de regras têm layout idêntico (o
último texto termina em y1172 e o ícone só começa em y1345), então a mesma posição serve
para todas e nada precisa ser ajustado caso a caso.

O recorte precisou de transparência porque na arte ele está sobre branco e aqui vai
sobre amarelo. Flood-fill simples não serviu: partindo da cor do canto ele parava cedo
e sobrava fundo; usando só "não é preto" como barreira ele vazava para dentro, porque
a borda pixel tem falhas de 1 px. O que funcionou foi engrossar a barreira preta em
2 px antes de preencher e depois devolver esses 2 px sem invadir o preto real.

### Revelar as respostas ao perder

Quando o tempo acaba com o jogo incompleto, **o que faltou aparece em verde (`#2e9e4f`)**
por 4 segundos antes da tela de resultado, e o cronômetro vira um selo verde "RESPOSTAS".
Quem terminou a tempo vai direto para a tela de vitória, sem revelação.

A razão é o objetivo do jogo: ele existe para a pessoa conhecer os serviços do Sistema
Comércio. Sair sem ver a resposta desperdiça a visita.

O código de cores é o mesmo nos três: **a cor do jogo = o que a pessoa acertou, verde =
o que faltou**. No caça-palavras, laranja contra verde; no Relacione as colunas, ligação
azul contra ligação verde; na memória, todas as cartas viram e as não encontradas ganham
borda verde.

Cada `fim*()` chama `revelar*()` e depois `revelarEDepois(idDoTimer, telaDestino)`.
Esse helper guarda em qual tela estava: se a pessoa sair antes dos 4 s (ENCERRAR ou os
90 s de inatividade), o `setTimeout` não sequestra a tela. `goTo()` também cancela a
revelação pendente e limpa o estado do cronômetro.

### Relacione as colunas (Sesc Montes Claros)

As duas colunas são **embaralhadas a cada partida**. Toca num card de um lado e no par
do outro. Acerto desenha uma curva SVG ligando os dois; erro sacode os cards.

| Serviço | Benefício |
|---|---|
| Psicologia | Escuta ativa |
| Ginástica multifuncional | Corpo em movimento |
| Ioga e pilates | Equilíbrio |
| Turismo | Lazer |
| Psiquiatria | Saúde mental |

### Caça-palavras (Senac Montes Claros)

**Grade fixa, 23 linhas × 12 colunas** — é a que o cliente aprovou na arte, transcrita
letra por letra do texto vivo do `.ai` (não de OCR). Fica em `CP_GRID`.

Joga-se com **um toque em qualquer letra da palavra**, que revela ela inteira — em
totem de feira, com fila andando, exigir duas seleções ou arrastar o dedo encarece
demais a jogada. Toque numa letra que não pertence a palavra nenhuma pisca cinza.

Isso não banaliza o jogo: 55 das 276 células revelam algo (~20%), então tocar à toa
precisa de **51 toques em média** para achar as cinco, e em 45 s dá tempo de uns 30.
Quem lê a lista de palavras acha em 5 toques. Se um dia isso for afrouxado (mais
palavras, grade menor), vale refazer a conta antes.

Numa letra de **cruzamento** (a linha 8 corta as três verticais), o toque revela a
primeira palavra ainda não achada na ordem de `CP_PALAVRAS`; tocar de novo revela a outra.

As letras são `<div>`s em Press Start 2P posicionados sobre a moldura vazia, alinhados
às coordenadas originais da arte
(origem 187,36 × 812,62; passo 62,2617 × 32,9965; corpo 26,8 px).

| Palavra | Direção | Posição |
|---|---|---|
| QUALIFICAÇÃO | vertical | coluna 10, linhas 0–11 |
| GRATUITOS | vertical | coluna 2, linhas 1–9 |
| TRANSFORMAÇÃO | vertical | coluna 3, linhas 3–15 |
| PROFISSIONAL | horizontal | linha 8 |
| PÓS-GRADUAÇÃO | horizontal | linha 17 |

> A prancheta 12 do `.ai` tem uma grade **diferente** da 13. A boa é a da 13 — é a que
> mostra as cinco palavras destacadas. Se for mexer na grade, use a 13 como referência.

### Jogo da memória (Sistema Fecomércio)

5 pares, 10 cartas embaralhadas a cada partida: Linha de Crédito, Certificação Digital,
Plano de Saúde, Curso Senac, Credencial Sesc. Verso e frentes são recortes da arte
(`sprites/mem-*.png`). Par encontrado fica aberto — assim o fundo nunca aparece.

---

## Leads

Gravados em `localStorage` **e** enviados para uma planilha Google.

O lead é regravado ao fim de cada jogo, sempre **atualizando a mesma linha** pelo `id`
(o Apps Script procura o ID antes de inserir). Um lead sem `id` nunca é gravado —
cadastro incompleto não vira linha órfã.

### Planilha (já ligada)

Planilha **Leads FENICS 2026**, webhook Apps Script configurado em `SHEETS_WEBHOOK_URL`
no topo do `<script>` de `index.html`. Testado em 07/09/2026: insere, e reenvio do
mesmo `id` atualiza a linha em vez de duplicar.

Se precisar reimplantar o script, a URL `/exec` muda — troque a constante e publique.
O passo a passo está no cabeçalho de `google-apps-script.gs`.

Se a constante ficar vazia, nada é enviado: tudo fica na fila local e o painel mostra
"a sincronizar". O jogo funciona igual offline; a fila é reenviada a cada 30 s e
quando a rede volta.

**Testar o webhook pelo terminal:** `curl -L` não serve — o Apps Script responde 302 e
o curl perde o POST no redirecionamento, devolvendo "página não encontrada" mesmo com
tudo certo. Siga o redirect à mão:

```bash
U='...exec'
L=$(curl -s -o /dev/null -w "%{redirect_url}" -X POST "$U" \
     -H 'Content-Type: text/plain;charset=utf-8' -d '{"id":"T1","nome":"Teste"}')
curl -s "$L"     # → {"ok":true,"id":"T1","atualizado":false}
```

### Atalho de teste (preencher sem digitar)

Na tela `cad1`, um botão **invisível sobre o "C" de "Cadastre-se"** (x 137–217, y 242–401)
preenche o cadastro inteiro com dados fictícios: nome sorteado, CPF gerado com dígitos
verificadores corretos (passa na validação de verdade), e-mail, telefone, e já deixa
marcadas as opções das telas 2, 3 e 4. Depois do toque, o caminho até o jogo é
AVANÇAR, AVANÇAR, AVANÇAR, JOGAR.

Serve para conferir o app no totem sem encarar o teclado do Android.

**Todo nome gerado começa com `TESTE `** — é assim que se filtra e apaga essas linhas
da planilha depois, sem confundir com lead de verdade. Antes de abrir para o público,
vale conferir se sobrou algum `TESTE ` na planilha.

Um visitante curioso pode tocar no "C" sem querer e ver o formulário se preencher.
Se isso incomodar, exigir dois toques em até 600 ms resolve, ao custo de o técnico
precisar saber disso.

### Painel

Botão invisível no canto inferior direito — **4 toques** abrem o menu → "Painel de leads".
Exporta CSV com BOM (abre no Excel com acentos corretos) e backup JSON.

> O contrato pede o relatório de leads em Excel **até 5 dias após o evento**.
> Baixe o CSV pelo painel antes de desmontar o totem, mesmo que a planilha esteja
> sincronizando — é a cópia local de segurança.

---

## Pendências antes do evento

- [x] Criar a planilha e colar a URL em `SHEETS_WEBHOOK_URL` — feito em 07/09/2026
- [ ] **Apagar as linhas de teste da planilha** (ids `DIAG-*` e `TESTE-*`)
- [ ] Testar no totem real (touch, teclado Android nos campos, brilho)
- [ ] Confirmar que o Wi-Fi do evento não bloqueia `script.google.com`

---

## O que NÃO fazer

- Não recriar arte em CSS/SVG — usar os PNGs de `telas/` e `sprites/`.
- Não dividir em vários arquivos — tudo em `index.html` e `admin.html`.
- Não adicionar framework nem dependência externa: precisa abrir offline.
- Não usar `onclick` inline; a delegação de eventos já existe.
- Toda string de usuário no DOM passa por `esc()`.
- Não mudar a grade do caça-palavras nem os pares dos jogos sem pedido do cliente —
  a arte foi aprovada assim.

// ═══════════════════════════════════════════════════════════════
//  FENICS 2026 — GAME Sistema Comércio
//  Webhook que grava os leads do totem numa planilha Google.
//
//  COMO INSTALAR (5 minutos):
//   1. Crie uma planilha nova em sheets.new
//   2. Extensões → Apps Script
//   3. Apague o conteúdo e cole TODO este arquivo
//   4. Implantar → Nova implantação → tipo "App da Web"
//        Executar como: Eu mesmo
//        Quem pode acessar: Qualquer pessoa
//   5. Copie a URL gerada (termina em /exec)
//   6. Cole em index.html, na constante SHEETS_WEBHOOK_URL
// ═══════════════════════════════════════════════════════════════

const SHEET_NAME = 'Leads';

const COLUNAS = [
  'ID', 'Data', 'Hora', 'Nome', 'CPF/CNPJ', 'E-mail', 'Telefone',
  'Maior de 18', 'Perfil profissional', 'Interesses', 'LGPD',
  'Jogos', 'Sincronizado em'
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);            // evita perder leads simultâneos
    const d = JSON.parse(e.postData.contents);
    const sheet = abaLeads();

    const jaTem = acharLinha(sheet, d.id);
    const linha = montarLinha(d);

    if (jaTem > 0) {
      sheet.getRange(jaTem, 1, 1, COLUNAS.length).setValues([linha]);
    } else {
      sheet.appendRow(linha);
    }

    return json({ ok: true, id: d.id, atualizado: jaTem > 0 });

  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function doGet() {
  return json({ ok: true, status: 'FENICS 2026 webhook ativo' });
}

function montarLinha(d) {
  const tz = 'America/Sao_Paulo';
  const dt = d.timestamp ? new Date(d.timestamp) : new Date();
  return [
    d.id || '',
    Utilities.formatDate(dt, tz, 'dd/MM/yyyy'),
    Utilities.formatDate(dt, tz, 'HH:mm:ss'),
    d.nome || '',
    formatarDoc(d.doc),
    d.email || '',
    formatarTel(d.tel),
    d.maior18 || '',
    d.perfil || '',
    d.busca || '',
    d.lgpd || '',
    d.jogos || '',
    Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy HH:mm:ss')
  ];
}

// o lead é reenviado quando a pessoa termina cada jogo — atualiza em vez de duplicar
function acharLinha(sheet, id) {
  if (!id || sheet.getLastRow() < 2) return -1;
  const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function formatarDoc(v) {
  const s = String(v || '').replace(/\D/g, '');
  if (s.length === 11) return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (s.length === 14) return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return "'" + s;   // apóstrofo: impede o Sheets de comer o zero à esquerda
}

function formatarTel(v) {
  const s = String(v || '').replace(/\D/g, '');
  if (s.length === 11) return s.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (s.length === 10) return s.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return "'" + s;
}

function abaLeads() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUNAS);
    sheet.getRange(1, 1, 1, COLUNAS.length)
         .setFontWeight('bold').setBackground('#0a3d75').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 130);
    sheet.setColumnWidth(4, 220);
    sheet.setColumnWidth(6, 220);
    sheet.setColumnWidth(10, 300);
    sheet.setColumnWidth(12, 240);
  }
  return sheet;
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
                       .setMimeType(ContentService.MimeType.JSON);
}

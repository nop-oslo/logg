// =============================================================
//  NOP Treningslogg – script.js
//  Erstatt APPS_SCRIPT_URL med URL-en til ditt Google Apps Script
// =============================================================

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwlvT2OGBj8GsT_RAPH-51bW3T_NGlO5Rk2qCkbk5nLCr0jjVU-cgr0eVf8aHxk5Bi-/exec';

// ── State ─────────────────────────────────────────────────────
let alleRader = [];
let filtrerteRader = [];

// ── DOM-referanser ─────────────────────────────────────────────
const searchNavn   = document.getElementById('search-navn');
const filterBane   = document.getElementById('filter-bane');
const filterFra    = document.getElementById('filter-fra');
const filterTil    = document.getElementById('filter-til');
const btnNullstill = document.getElementById('btn-nullstill');
const btnPdf       = document.getElementById('btn-pdf');
const treffInfo    = document.getElementById('treff-info');
const statusDiv    = document.getElementById('status-melding');
const tabellSeksjon = document.getElementById('tabell-seksjon');
const tabellBody   = document.getElementById('tabell-body');

const pdfModal     = document.getElementById('pdf-modal');
const btnAvbryt    = document.getElementById('btn-avbryt');
const btnGenererPdf = document.getElementById('btn-generer-pdf');
const pdfNavn      = document.getElementById('pdf-navn');
const pdfTittel    = document.getElementById('pdf-tittel');
const pdfDato      = document.getElementById('pdf-dato');

// ── Init ───────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Set dagens dato som standard i modal
  pdfDato.value = new Date().toISOString().split('T')[0];
  hentData();
  bindListeners();
});

// ── Hent data fra Apps Script ──────────────────────────────────
async function hentData() {
  try {
    const res = await fetch(APPS_SCRIPT_URL);
    const json = await res.json();

    // Apps Script returner rader (array of arrays) eller objekter
    // Tilpass etter hva ditt script returnerer
    const rader = json.data || json;

    // Kolonner i ny sheet (1QLZC7jBkMIgxeAyY7DIpzVwcPhWMp_re7fxUJT2LSQ0):
    // A=0 Tidsmerke, B=1 Fornavn, C=2 Etternavn, D=3 Treningsform,
    // E=4 Ansvarlig skytebaneleder, F=5 Skytebane, G=6 Våpen,
    // H=7 Kaliber, I=8 Antall skudd, J=9 Andre momenter
    alleRader = rader.map(r => ({
      tidsmerke:    r[0] || '',
      fornavn:      r[1] || '',
      etternavn:    r[2] || '',
      treningsform: r[3] || '',
      ansvarlig:    r[4] || '',
      bane:         r[5] || '',
      vaapen:       r[6] || '',
      kaliber:      r[7] || '',
      antallSkudd:  r[8] || '',
      andreMomenter:r[9] || '',
      // Parsed date for filtering
      dato:         parseDato(r[0] || ''),
    }));

    byggBaneFilter();
    filtrerOgVis();
    statusDiv.style.display = 'none';
    tabellSeksjon.style.display = '';

  } catch (err) {
    statusDiv.innerHTML = `
      <span style="color:#c00;">⚠ Kunne ikke laste data.<br>
      Sjekk at APPS_SCRIPT_URL er satt riktig i script.js.</span>
    `;
    console.error(err);
  }
}

// ── Parse norsk dato-format: "05.04.2025 kl. 14.27.27" ─────────
function parseDato(str) {
  const match = str.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!match) return null;
  return new Date(`${match[3]}-${match[2]}-${match[1]}`);
}

// ── Bygg bane-filter dynamisk ──────────────────────────────────
function byggBaneFilter() {
  const baner = [...new Set(alleRader.map(r => r.bane).filter(Boolean))].sort();
  baner.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b;
    filterBane.appendChild(opt);
  });
}

// ── Filter + visning ───────────────────────────────────────────
function filtrerOgVis() {
  const navn = searchNavn.value.trim().toLowerCase();
  const bane = filterBane.value;
  const fra  = filterFra.value ? new Date(filterFra.value) : null;
  const til  = filterTil.value ? new Date(filterTil.value + 'T23:59:59') : null;

  filtrerteRader = alleRader.filter(r => {
    if (navn) {
      const fulltNavn = `${r.fornavn} ${r.etternavn}`.toLowerCase();
      if (!fulltNavn.includes(navn)) return false;
    }
    if (bane && r.bane !== bane) return false;
    if (fra && r.dato && r.dato < fra) return false;
    if (til && r.dato && r.dato > til) return false;
    return true;
  });

  renderTabell();
  oppdaterTreffInfo();
}

// ── Render tabell ──────────────────────────────────────────────
function renderTabell() {
  tabellBody.innerHTML = '';

  if (filtrerteRader.length === 0) {
    tabellBody.innerHTML = `
      <tr><td colspan="9" class="ingen-treff">Ingen treff med gjeldende filter.</td></tr>
    `;
    return;
  }

  filtrerteRader.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.tidsmerke}</td>
      <td>${r.fornavn}</td>
      <td>${r.etternavn}</td>
      <td>${r.ansvarlig}</td>
      <td>${r.bane}</td>
      <td>${r.vaapen}</td>
      <td>${r.kaliber}</td>
      <td>${r.antallSkudd}</td>
      <td>${r.treningsform}</td>
    `;
    tabellBody.appendChild(tr);
  });
}

function oppdaterTreffInfo() {
  treffInfo.textContent = `Viser ${filtrerteRader.length} av ${alleRader.length} registreringer`;
}

// ── Listeners ──────────────────────────────────────────────────
function bindListeners() {
  searchNavn.addEventListener('input', filtrerOgVis);
  filterBane.addEventListener('change', filtrerOgVis);
  filterFra.addEventListener('change', filtrerOgVis);
  filterTil.addEventListener('change', filtrerOgVis);

  btnNullstill.addEventListener('click', () => {
    searchNavn.value = '';
    filterBane.value = '';
    filterFra.value = '';
    filterTil.value = '';
    filtrerOgVis();
  });

  btnPdf.addEventListener('click', () => {
    pdfModal.style.display = 'flex';
  });

  btnAvbryt.addEventListener('click', () => {
    pdfModal.style.display = 'none';
  });

  pdfModal.addEventListener('click', e => {
    if (e.target === pdfModal) pdfModal.style.display = 'none';
  });

  btnGenererPdf.addEventListener('click', genererPDF);
}

// ── PDF-generering ─────────────────────────────────────────────
async function genererPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const signNavn   = pdfNavn.value.trim()   || 'Navn';
  const signTittel = pdfTittel.value.trim() || 'Tittel';
  const signDato   = pdfDato.value
    ? new Date(pdfDato.value).toLocaleDateString('nb-NO')
    : new Date().toLocaleDateString('nb-NO');

  const sideW = doc.internal.pageSize.getWidth();
  const sideH = doc.internal.pageSize.getHeight();

  // ── Øverst: logo + tittel ──
  // Last inn logo som base64
  const logoBase64 = await hentLogoBase64();

  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 14, 10, 22, 22);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Organisert treningslogg NOP (Svar)', logoBase64 ? 40 : 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Godkjent av NOP', logoBase64 ? 40 : 14, 25);

  // ── Linje ──
  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.line(14, 34, sideW - 14, 34);

  // ── Godkjenner-info ──
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Oversikt over organisert trening som bekreftes og godkjennes av NOP', 14, 41);

  doc.setFont('helvetica', 'bold');
  doc.text(signNavn, 14, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(signTittel, 14, 55);
  doc.text(signDato, 14, 60);

  // Signaturlinje
  doc.setDrawColor(80);
  doc.setLineWidth(0.5);
  doc.line(14, 48, 80, 48);

  // ── Tabell ──
  const kolonner = ['Tidsmerke', 'Fornavn', 'Etternavn', 'Ansvarlig skytebaneleder', 'Skytebane'];
  const rader = filtrerteRader.map(r => [
    r.tidsmerke,
    r.fornavn,
    r.etternavn,
    r.ansvarlig,
    r.bane,
  ]);

  doc.autoTable({
    head: [kolonner],
    body: rader,
    startY: 66,
    margin: { left: 14, right: 14 },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: [26, 26, 26],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [240, 237, 232],
    },
    didDrawPage: (data) => {
      // Bunntekst på hver side
      const sideNr = doc.internal.getCurrentPageInfo().pageNumber;
      const totalt = doc.internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(120);
      doc.setFont('helvetica', 'normal');
      const naa = new Date().toLocaleString('nb-NO');
      doc.text(naa, 14, sideH - 8);
      doc.text(`Side ${sideNr} av ${totalt}`, sideW - 14, sideH - 8, { align: 'right' });
      doc.setTextColor(0);
    }
  });

  // ── Last ned ──
  const filnavn = `NOP_treningslogg_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filnavn);
  pdfModal.style.display = 'none';
}

// ── Konverter logo til base64 for jsPDF ────────────────────────
function hentLogoBase64() {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = 'NOP_Logo.png';
  });
}

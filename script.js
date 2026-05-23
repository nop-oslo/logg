// =============================================================
//  NOP Treningslogg – script.js
// =============================================================

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwlvT2OGBj8GsT_RAPH-51bW3T_NGlO5Rk2qCkbk5nLCr0jjVU-cgr0eVf8aHxk5Bi-/exec';

// ── Signatarer ─────────────────────────────────────────────────
const SIGNATARER = [
  { rolle: 'Leder',                            navn: 'Fenr. Tormod Strand',      tlf: '95048911', epost: null },
  { rolle: 'Nestleder',                         navn: 'Lt. Thor Grannæs',         tlf: '90082064', epost: null },
  { rolle: 'Sekretær',                          navn: 'Øivind Brekke',            tlf: '99439145', epost: null },
  { rolle: 'Kasserer',                          navn: 'Fenr. Geir Herdal',        tlf: '97182164', epost: null },
  { rolle: 'Banemester',                        navn: 'Sondre Nervold',           tlf: '91517423', epost: null },
  { rolle: '1. Styremedlem / Seremonimester',   navn: 'Kapt. Kjetil Edvardsen',  tlf: '90787587', epost: null },
  { rolle: 'Oppmann Militær',                   navn: 'Lt. Thor Grannæs',         tlf: '90082064', epost: 'militar@nop.no' },
  { rolle: 'Oppmann Dynamisk',                  navn: 'Oblt. Espen Fiskebeck',    tlf: '48245691', epost: 'dynamisk@nop.no' },
  { rolle: 'Oppmann Svartkrutt',                navn: 'Kapt. Arne Thorvaldsen',   tlf: '91758767', epost: 'svartkrutt@nop.no' },
];

// Våpengrupper
const HANDVAAPEN  = ['Pistol', 'Revolver', 'PCC'];
const RIFLE       = ['Rifle'];

// ── State ──────────────────────────────────────────────────────
let alleRader = [];
let filtrerteRader = [];
let aktivSoknad = 'alle'; // 'alle' | 'handvaapen' | 'rifle'

// ── DOM ────────────────────────────────────────────────────────
const searchNavn    = document.getElementById('search-navn');
const filterBane    = document.getElementById('filter-bane');
const filterVaapen  = document.getElementById('filter-vaapen');
const filterFra     = document.getElementById('filter-fra');
const filterTil     = document.getElementById('filter-til');
const btnNullstill  = document.getElementById('btn-nullstill');
const btnPdf        = document.getElementById('btn-pdf');
const treffInfo     = document.getElementById('treff-info');
const statusDiv     = document.getElementById('status-melding');
const tabellSeksjon = document.getElementById('tabell-seksjon');
const tabellBody    = document.getElementById('tabell-body');

const pdfModal      = document.getElementById('pdf-modal');
const pdfSignatur   = document.getElementById('pdf-signatur');
const pdfNavn       = document.getElementById('pdf-navn');
const pdfTittel     = document.getElementById('pdf-tittel');
const pdfTlf        = document.getElementById('pdf-tlf');
const pdfEpost      = document.getElementById('pdf-epost');
const pdfEpostGruppe= document.getElementById('pdf-epost-gruppe');
const pdfDato       = document.getElementById('pdf-dato');
const btnAvbryt     = document.getElementById('btn-avbryt');
const btnGenererPdf = document.getElementById('btn-generer-pdf');

const btnHandvaapen = document.getElementById('btn-handvaapen');
const btnRifle      = document.getElementById('btn-rifle');
const btnAlle       = document.getElementById('btn-alle');

// ── Init ───────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  pdfDato.value = new Date().toISOString().split('T')[0];
  hentData();
  bindListeners();
});

// ── Hent data ──────────────────────────────────────────────────
async function hentData() {
  try {
    const res = await fetch(APPS_SCRIPT_URL);
    const json = await res.json();
    const rader = json.data || json;

    alleRader = rader.map(r => ({
      tidsmerke:     r[0] || '',
      fornavn:       r[1] || '',
      etternavn:     r[2] || '',
      treningsform:  r[3] || '',
      ansvarlig:     r[4] || '',
      bane:          r[5] || '',
      vaapen:        r[6] || '',
      kaliber:       r[7] || '',
      antallSkudd:   r[8] || '',
      andreMomenter: r[9] || '',
      dato:          parseDato(r[0] || ''),
    }));

    byggBaneFilter();
    byggVaapenFilter();
    filtrerOgVis();
    statusDiv.style.display = 'none';
    tabellSeksjon.style.display = '';
  } catch (err) {
    statusDiv.innerHTML = `<span style="color:#c00;">⚠ Kunne ikke laste data. Sjekk at APPS_SCRIPT_URL er korrekt.</span>`;
    console.error(err);
  }
}

// ── Parse dato – støtter både norsk og ISO-format ────────────
// Norsk: "05.04.2025 kl. 14.27.27"
// ISO:   "2022-02-12T11:51:02.000Z"
function parseDato(str) {
  if (!str) return null;
  // Norsk format: DD.MM.YYYY
  const norsk = str.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (norsk) {
    return new Date(parseInt(norsk[3]), parseInt(norsk[2]) - 1, parseInt(norsk[1]));
  }
  // ISO format: YYYY-MM-DD...
  const iso = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return new Date(parseInt(iso[1]), parseInt(iso[2]) - 1, parseInt(iso[3]));
  }
  return null;
}

// ── Formater dato til norsk visning ───────────────────────────
function formaterDato(str) {
  if (!str) return '';
  // Allerede norsk format
  if (str.match(/^\d{2}\.\d{2}\.\d{4}/)) return str;
  // ISO format – konverter til DD.MM.YYYY HH:MM
  const iso = str.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (iso) {
    return `${iso[3]}.${iso[2]}.${iso[1]} kl. ${iso[4]}.${iso[5]}`;
  }
  return str;
}

// Konverter YYYY-MM-DD streng til lokal midnatt
function datoFraInput(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Konverter YYYY-MM-DD streng til lokal slutt av dag
function datoTilSluttAvDag(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

// ── Datogrense for søknadstype ─────────────────────────────────
function settSoknadsDatoer(dager) {
  const til = new Date();
  const fra = new Date();
  fra.setDate(fra.getDate() - dager);
  // Formater som YYYY-MM-DD i lokal tid
  filterFra.value = lokalDatoStreng(fra);
  filterTil.value = lokalDatoStreng(til);
  filterFra.disabled = true;
  filterTil.disabled = true;
}

function lokalDatoStreng(dato) {
  const y = dato.getFullYear();
  const m = String(dato.getMonth() + 1).padStart(2, '0');
  const d = String(dato.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function frigjorDatoer() {
  filterFra.disabled = false;
  filterTil.disabled = false;
}

// ── Bygg dynamiske filter ──────────────────────────────────────
function byggBaneFilter() {
  const baner = [...new Set(alleRader.map(r => r.bane).filter(Boolean))].sort();
  baner.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b; opt.textContent = b;
    filterBane.appendChild(opt);
  });
}

function byggVaapenFilter() {
  const vaapen = [...new Set(alleRader.map(r => r.vaapen).filter(Boolean))].sort();
  vaapen.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v; opt.textContent = v;
    filterVaapen.appendChild(opt);
  });
}

// ── Filter + visning ───────────────────────────────────────────
function filtrerOgVis() {
  const navn   = searchNavn.value.trim().toLowerCase();
  const bane   = filterBane.value;
  const vaapen = filterVaapen.value;
  const fra    = filterFra.value ? datoFraInput(filterFra.value) : null;
  const til    = filterTil.value ? datoTilSluttAvDag(filterTil.value) : null;

  filtrerteRader = alleRader.filter(r => {
    if (navn) {
      const fulltNavn = `${r.fornavn} ${r.etternavn}`.toLowerCase();
      if (!fulltNavn.includes(navn)) return false;
    }
    if (bane && r.bane !== bane) return false;
    if (vaapen && r.vaapen !== vaapen) return false;

    // Søknadstype-filter på våpengruppe
    if (aktivSoknad === 'handvaapen') {
      const v = (r.vaapen || '').trim();
      if (!HANDVAAPEN.some(h => v.toLowerCase().includes(h.toLowerCase()))) return false;
    }
    if (aktivSoknad === 'rifle') {
      const v = (r.vaapen || '').trim();
      if (!RIFLE.some(rf => v.toLowerCase().includes(rf.toLowerCase()))) return false;
    }

    if (fra && r.dato && r.dato < fra) return false;
    if (til && r.dato && r.dato > til) return false;
    return true;
  });

  renderTabell();
  oppdaterTreffInfo();
}

function renderTabell() {
  tabellBody.innerHTML = '';
  if (filtrerteRader.length === 0) {
    tabellBody.innerHTML = `<tr><td colspan="9" class="ingen-treff">Ingen treff med gjeldende filter.</td></tr>`;
    return;
  }
  filtrerteRader.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formaterDato(r.tidsmerke)}</td>
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
  filterVaapen.addEventListener('change', filtrerOgVis);
  filterFra.addEventListener('change', filtrerOgVis);
  filterTil.addEventListener('change', filtrerOgVis);

  // Søknadstype-knapper
  btnHandvaapen.addEventListener('click', () => {
    aktivSoknad = 'handvaapen';
    filterVaapen.value = '';
    settSoknadsDatoer(179);
    oppdaterSoknadKnapper();
    filtrerOgVis();
  });

  btnRifle.addEventListener('click', () => {
    aktivSoknad = 'rifle';
    filterVaapen.value = '';
    settSoknadsDatoer(729);
    oppdaterSoknadKnapper();
    filtrerOgVis();
  });

  btnAlle.addEventListener('click', () => {
    aktivSoknad = 'alle';
    frigjorDatoer();
    filterFra.value = '';
    filterTil.value = '';
    oppdaterSoknadKnapper();
    filtrerOgVis();
  });

  btnNullstill.addEventListener('click', () => {
    searchNavn.value = '';
    filterBane.value = '';
    filterVaapen.value = '';
    filterFra.value = '';
    filterTil.value = '';
    aktivSoknad = 'alle';
    frigjorDatoer();
    oppdaterSoknadKnapper();
    filtrerOgVis();
  });

  btnPdf.addEventListener('click', () => { pdfModal.style.display = 'flex'; });
  btnAvbryt.addEventListener('click', () => { pdfModal.style.display = 'none'; });
  pdfModal.addEventListener('click', e => { if (e.target === pdfModal) pdfModal.style.display = 'none'; });

  // Signatar-dropdown fyller feltene automatisk
  pdfSignatur.addEventListener('change', () => {
    const idx = pdfSignatur.value;
    if (idx === '') {
      pdfNavn.value = '';
      pdfTittel.value = '';
      pdfTlf.value = '';
      pdfEpost.value = '';
      pdfEpostGruppe.style.display = 'none';
      return;
    }
    const s = SIGNATARER[parseInt(idx)];
    pdfNavn.value   = s.navn;
    pdfTittel.value = s.rolle;
    pdfTlf.value    = s.tlf;
    if (s.epost) {
      pdfEpost.value = s.epost;
      pdfEpostGruppe.style.display = '';
    } else {
      pdfEpost.value = '';
      pdfEpostGruppe.style.display = 'none';
    }
  });

  btnGenererPdf.addEventListener('click', genererPDF);
}

function oppdaterSoknadKnapper() {
  btnHandvaapen.classList.toggle('aktiv', aktivSoknad === 'handvaapen');
  btnRifle.classList.toggle('aktiv', aktivSoknad === 'rifle');
  btnAlle.classList.toggle('aktiv', aktivSoknad === 'alle');
}

// ── PDF-generering ─────────────────────────────────────────────
async function genererPDF() {
  // Vis spinner på knappen
  btnGenererPdf.disabled = true;
  btnGenererPdf.innerHTML = '<span class="pdf-spinner"></span> Genererer…';

  // Liten delay så UI rekker å oppdatere seg
  await new Promise(r => setTimeout(r, 50));

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const signNavn   = pdfNavn.value.trim()   || '—';
  const signTittel = pdfTittel.value.trim() || '—';
  const signTlf    = pdfTlf.value.trim();
  const signEpost  = pdfEpost.value.trim();
  const signDato   = pdfDato.value
    ? new Date(pdfDato.value).toLocaleDateString('nb-NO')
    : new Date().toLocaleDateString('nb-NO');

  const sideW = doc.internal.pageSize.getWidth();
  const sideH = doc.internal.pageSize.getHeight();

  const logoBase64 = await hentLogoBase64();

  // ── Logo ──
  if (logoBase64) {
    doc.addImage(logoBase64, 'JPEG', 14, 8, 24, 24);
  }

  // ── Tittel ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Organisert treningslogg NOP (Svar)', 42, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text('Godkjent av NOP', 42, 24);
  doc.setTextColor(0);

  // ── Horisontal linje ──
  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.line(14, 35, sideW - 14, 35);

  // ── Godkjenner-tekst ──
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Oversikt over organisert trening som bekreftes og godkjennes av NOP', 14, 42);

  // ── Signaturlinje (med luft over navnet) ──
  doc.setDrawColor(60);
  doc.setLineWidth(0.5);
  doc.line(14, 52, 90, 52);

  // Navn starter 6mm under streken
  let y = 60;
  doc.setFont('helvetica', 'bold');
  doc.text(signNavn, 14, y);

  doc.setFont('helvetica', 'normal');
  y += 5;
  doc.text(signTittel, 14, y);
  y += 5;
  if (signTlf) { doc.text(`Tlf: ${signTlf}`, 14, y); y += 5; }
  if (signEpost) { doc.text(`E-post: ${signEpost}`, 14, y); y += 5; }
  doc.text(signDato, 14, y);

  // ── Tabell ──
  const kolonner = ['Tidsmerke', 'Fornavn', 'Etternavn', 'Ansvarlig skytebaneleder', 'Skytebane'];
  const rader = filtrerteRader.map(r => [
    formaterDato(r.tidsmerke), r.fornavn, r.etternavn, r.ansvarlig, r.bane,
  ]);

  doc.autoTable({
    head: [kolonner],
    body: rader,
    startY: y + 6,
    margin: { left: 14, right: 14 },
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5 },
    headStyles: {
      fillColor: [26, 26, 26],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: { fillColor: [240, 237, 232] },
    didDrawPage: () => {
      const sideNr = doc.internal.getCurrentPageInfo().pageNumber;
      const totalt = doc.internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(120);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date().toLocaleString('nb-NO'), 14, sideH - 8);
      doc.text(`Side ${sideNr} av ${totalt}`, sideW - 14, sideH - 8, { align: 'right' });
      doc.setTextColor(0);
    }
  });

  const filnavn = `NOP_treningslogg_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filnavn);
  pdfModal.style.display = 'none';

  // Tilbakestill knappen
  btnGenererPdf.disabled = false;
  btnGenererPdf.innerHTML = 'Generer PDF';
}

// ── Logo til base64 – skalert og komprimert ───────────────────
function hentLogoBase64() {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Skaler ned til maks 120px for å holde PDF-størrelsen liten
      const MAX = 120;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      // Hvit bakgrunn (unngår transparent PNG-overhead)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      // JPEG med 80% kvalitet – dramatisk mindre enn PNG
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => resolve(null);
    img.src = 'NOP_Logo.png';
  });
}

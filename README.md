# NOP – Organisert Treningslogg

Nettside for å søke, filtrere og eksportere organisert treningslogg fra Google Sheets.

---

## Innhold

```
nop-treningslogg/
├── index.html       – selve nettsiden
├── style.css        – styling
├── script.js        – datahenting, filter og PDF-generering
├── NOP_Logo.png     – NOP-logoen
└── README.md        – denne filen
```

---

## Steg 1 – Sett opp Google Apps Script

Du trenger et Google Apps Script som gjør Google Sheet-en tilgjengelig som JSON.

1. Åpne Google Sheets-dokumentet ditt (ID: `1QLZC7jBkMIgxeAyY7DIpzVwcPhWMp_re7fxUJT2LSQ0`)
2. Gå til **Utvidelser → Apps Script**
3. Erstatt alt innholdet med følgende kode:

```javascript
function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // Hopp over rad 1 (overskrifter)
  const rader = data.slice(1);
  
  return ContentService
    .createTextOutput(JSON.stringify({ data: rader }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Klikk **Lagre** (disk-ikon)
5. Klikk **Distribuer → Ny distribusjon**
6. Velg type: **Nettapp**
7. Sett **"Kjør som"** til deg selv
8. Sett **"Hvem har tilgang"** til **Alle** (anonymt)
9. Klikk **Distribuer**
10. Kopier **Nettapp-URL-en** som vises

---

## Steg 2 – Oppdater script.js

Åpne `script.js` og erstatt:

```javascript
const APPS_SCRIPT_URL = 'DIN_APPS_SCRIPT_URL_HER';
```

med URL-en du kopierte:

```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/ABC.../exec';
```

---

## Steg 3 – Last opp til GitHub Pages

1. Opprett et nytt repository på [github.com](https://github.com)
2. Last opp alle filene i denne mappen
3. Gå til **Settings → Pages**
4. Under **Source**, velg **Deploy from a branch**
5. Velg **main** og **/ (root)**, klikk **Save**
6. Siden er tilgjengelig på: `https://[ditt-brukernavn].github.io/[repo-navn]/`

---

## Funksjonalitet

- **Søk** på fornavn eller etternavn
- **Filter** på skytebane og datoperiode
- **Last ned PDF** med filtrert liste – lik den offisielle NOP-rapporten
  - Redigerbart navn, tittel og dato på godkjenner
  - NOP-logo øverst
  - Sidetall og tidsstempel i bunntekst

---

## Spørsmål?

Kontakt NOP eller den som satte opp systemet.

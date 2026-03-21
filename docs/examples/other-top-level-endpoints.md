# Beispiele für die anderen Top-Level-Endpunkte

Diese Datei ergänzt die Justiz-Beispiele um **andere offizielle RIS-API-Endpunkte**.

Alle Requests wurden live gegen `https://data.bka.gv.at/ris/api/v2.6/` geprüft.

---

## 1) Bundesrecht – `Applikation=BrKons`

```bash
curl -sG 'https://data.bka.gv.at/ris/api/v2.6/Bundesrecht' \
  --data-urlencode 'Applikation=BrKons' \
  --data-urlencode 'Suchworte=Datenschutz' \
  --data-urlencode 'DokumenteProSeite=Ten' \
  --data-urlencode 'Seitennummer=1' \
  --data-urlencode 'Sortierung.SortedByColumn=Inkrafttretensdatum' \
  --data-urlencode 'Sortierung.SortDirection=Descending'
```

Live geprüft:
- Treffer: `8215`
- erster Datensatz: `NOR40271932`

Response-Auszug:

```json
{
  "ID": "NOR40271932",
  "DokumentUrl": "https://www.ris.bka.gv.at/eli/bgbl/i/1997/12/P44b/NOR40271932",
  "Bundesrecht": {
    "Kurztitel": "Waffengesetz 1996",
    "BrKons": {
      "Dokumenttyp": "Paragraph",
      "ArtikelParagraphAnlage": "§ 44b",
      "Inkrafttretensdatum": "9000-01-01",
      "Gesetzesnummer": "10006016",
      "GesamteRechtsvorschriftUrl": "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10006016"
    }
  }
}
```

---

## 2) Landesrecht – `Applikation=LrKons`

```bash
curl -sG 'https://data.bka.gv.at/ris/api/v2.6/Landesrecht' \
  --data-urlencode 'Applikation=LrKons' \
  --data-urlencode 'Suchworte=Datenschutz' \
  --data-urlencode 'DokumenteProSeite=Ten' \
  --data-urlencode 'Seitennummer=1' \
  --data-urlencode 'Sortierung.SortedByColumn=Inkrafttretensdatum' \
  --data-urlencode 'Sortierung.SortDirection=Descending'
```

Live geprüft:
- Treffer: `2741`
- erster Datensatz: `LKT40020761`

Response-Auszug:

```json
{
  "ID": "LKT40020761",
  "DokumentUrl": "https://www.ris.bka.gv.at/eli/lgbl/KA/2022/53/P5/LKT40020761",
  "Landesrecht": {
    "Kurztitel": "Kärntner Gemeinde-Ausbildungs- und Prüfungsverordnung – K-GAPV",
    "Bundesland": "Kärnten",
    "LrKons": {
      "Dokumenttyp": "Paragraph",
      "ArtikelParagraphAnlage": "§ 5",
      "Inkrafttretensdatum": "2029-01-01",
      "Gesetzesnummer": "20000444"
    }
  }
}
```

---

## 3) Gemeinden – `Applikation=Gr`

```bash
curl -sG 'https://data.bka.gv.at/ris/api/v2.6/Gemeinden' \
  --data-urlencode 'Applikation=Gr' \
  --data-urlencode 'Suchworte=Hund' \
  --data-urlencode 'DokumenteProSeite=Ten' \
  --data-urlencode 'Seitennummer=1' \
  --data-urlencode 'Sortierung.SortedByColumn=Gemeinde' \
  --data-urlencode 'Sortierung.SortDirection=Ascending'
```

Live geprüft:
- Treffer: `793`
- erster Datensatz: `GEMRE_KA_20701_000_902__2023_me`

Response-Auszug:

```json
{
  "ID": "GEMRE_KA_20701_000_902__2023_me",
  "DokumentUrl": "https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=Gemeinderecht&Dokumentnummer=GEMRE_KA_20701_000_902__2023_me",
  "Gemeinden": {
    "Kurztitel": "2. Nachtragsvoranschlag 2023",
    "Bundesland": "Kärnten",
    "Gemeinde": "Afritz am See",
    "Typ": "Verordnung",
    "Geschaeftszahl": {
      "item": "000-902-/2023/me"
    }
  }
}
```

---

## 4) Bezirke – `Applikation=Bvb`

```bash
curl -sG 'https://data.bka.gv.at/ris/api/v2.6/Bezirke' \
  --data-urlencode 'Applikation=Bvb' \
  --data-urlencode 'Suchworte=Verordnung' \
  --data-urlencode 'DokumenteProSeite=Ten' \
  --data-urlencode 'Seitennummer=1' \
  --data-urlencode 'Sortierung.SortedByColumn=Kundmachungsdatum' \
  --data-urlencode 'Sortierung.SortDirection=Descending'
```

Live geprüft:
- Treffer: `2194`
- erster Datensatz: `BVB_NI_BN_20260320_5`

Response-Auszug:

```json
{
  "ID": "BVB_NI_BN_20260320_5",
  "DokumentUrl": "https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=Bvb&Dokumentnummer=BVB_NI_BN_20260320_5",
  "Bezirke": {
    "Kurztitel": "Schutzzone Bad Vöslau",
    "Bundesland": "Niederösterreich",
    "Bvb": {
      "Kundmachungsdatum": "2026-03-20",
      "Kundmachungsnummer": "5/2026",
      "Typ": "Verordnung",
      "Bezirksverwaltungsbehoerde": "Bezirkshauptmannschaft Baden"
    }
  }
}
```

---

## 5) Sonstige – `Applikation=Avn`

```bash
curl -sG 'https://data.bka.gv.at/ris/api/v2.6/Sonstige' \
  --data-urlencode 'Applikation=Avn' \
  --data-urlencode 'Suchworte=Tierseuche' \
  --data-urlencode 'DokumenteProSeite=Ten' \
  --data-urlencode 'Seitennummer=1' \
  --data-urlencode 'Sortierung.SortedByColumn=Kundmachungsdatum' \
  --data-urlencode 'Sortierung.SortDirection=Descending'
```

Live geprüft:
- Treffer: `25`
- erster Datensatz: `AVN_20250423_AVN_2025_12_9`

Response-Auszug:

```json
{
  "ID": "AVN_20250423_AVN_2025_12_9",
  "DokumentUrl": "https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=Avn&Dokumentnummer=AVN_20250423_AVN_2025_12_9",
  "Sonstige": {
    "Kurztitel": "Kundmachung zur Festlegung eines Tarifes zur Entlohnung von aufgrund einer Tierseuche bestellten ...",
    "Kundmachungsdatum": "2025-04-23",
    "Avn": {
      "Avnnummer": "AVN 2025/12-9",
      "Typ": "Kundmachung",
      "Geschaeftszahl": "2025-0.304.024"
    }
  }
}
```

---

## 6) History

```bash
curl -sG 'https://data.bka.gv.at/ris/api/v2.6/History' \
  --data-urlencode 'Anwendung=Justiz' \
  --data-urlencode 'AenderungenVon=2026-03-01' \
  --data-urlencode 'AenderungenBis=2026-03-21' \
  --data-urlencode 'DokumenteProSeite=Ten' \
  --data-urlencode 'Seitennummer=1'
```

Live geprüft:
- Treffer: `2139`
- erster Datensatz: `JJT_20250327_OLG0819_0130RA00036_24B0000_000`

Response-Auszug:

```json
{
  "ID": "JJT_20250327_OLG0819_0130RA00036_24B0000_000",
  "Applikation": "Justiz",
  "Organ": "OLG Innsbruck",
  "Geaendert": "2026-03-21"
}
```

`History` ist besonders nützlich, wenn man inkrementelle Änderungen über eine Anwendung verfolgen möchte.

---

## Siehe auch

- [`../ris-api-endpoints-catalog.md`](../ris-api-endpoints-catalog.md)
- [`../ris-api-judikatur-justiz.md`](../ris-api-judikatur-justiz.md)
- [`./official-examples-index.md`](./official-examples-index.md)

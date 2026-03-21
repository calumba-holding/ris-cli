# OGD RIS API v2.6 – Überblick

## Offizielle Quellen

### 1) API-Startseite
- <https://data.bka.gv.at/ris/api/v2.6/>

Die Startseite verlinkt auf:
- `Help`
- `Content/Examples.zip`
- den RIS-Datensatz auf `data.gv.at`

### 2) Help-Index
- <https://data.bka.gv.at/ris/api/v2.6/Help>

Der Help-Index listet die Controller-Gruppen, ist aber inhaltlich sehr dünn. Verifiziert wurden dort diese Gruppen:
- `Bundesrecht`
- `Sonstige`
- `Landesrecht`
- `Bezirke`
- `Gemeinden`
- `Version`
- `Judikatur`
- `History`

Für fast alle Gruppen sind `GET` und `POST` vorhanden; `Version` bietet `GET`.

### 3) Offizielles Handbuch
- `OGD-RIS API Handbuch V2_6`
- lokale Markdown-Kopie: [`official-ogd-ris-api-handbuch-v2.6.md`](./official-ogd-ris-api-handbuch-v2.6.md)
- offizielle PDF-Quelle auf `data.gv.at`

### 4) Offizielle Beispielsammlung
- <https://data.bka.gv.at/ris/api/v2.6/Content/Examples.zip>
- lokale Übersicht: [`examples/official-examples-index.md`](./examples/official-examples-index.md)

---

## Basis-URLs

### REST API
```text
https://data.bka.gv.at/ris/api/v2.6/
```

### Zugrundeliegender OGD-RIS Service
Laut offiziellem Handbuch basiert die REST-API auf dem gleichnamigen Service:

```text
https://data.bka.gv.at/ris/ogd/v2.6
```

---

## Wichtige Eigenschaften der API

Laut offiziellem Handbuch:

- Die API ist ein REST-Service.
- Abfragen funktionieren mit `GET` oder `POST`.
- Das Ergebnis ist immer **JSON**.
- Die eigentlichen Nutzdaten der Dokumente liegen typischerweise nicht inline vor, sondern über direkte URLs unter:
  - `.../Dokumentliste/ContentReference/Urls`
- Dort sind je nach Dokument u. a. diese Formate verfügbar:
  - `Xml`
  - `Html`
  - `Pdf`
  - `Rtf`

Das ist für dieses Projekt wichtig, weil `ris-cli` genau diese Content-URLs weiterverarbeitet.

---

## Aufbau der Requests

Die API verwendet oft zusammengesetzte Parameternamen. Im Handbuch wird das als `<spec>` beschrieben.

Beispiele:
- `Sortierung.SortedByColumn`
- `Sortierung.SortDirection`
- `AenderungenSeit.Periode`
- `Dokumenttyp.SucheInRechtssaetzen`
- `Dokumenttyp.SucheInEntscheidungstexten`

Laut Glossar sind als Trennzeichen für `<spec>` zulässig:
- `.`
- `_`
- `-`

In den offiziellen Beispielseiten wird überwiegend die Punkt-Notation verwendet.

---

## Typische Standardparameter

Viele Endpunkte verwenden wiederkehrende Parameter:

- `Applikation`
- `Suchworte`
- `ImRisSeit`
- `DokumenteProSeite`
- `Seitennummer`
- `Sortierung.SortedByColumn`
- `Sortierung.SortDirection`

Häufige Enum-Werte:

### `DokumenteProSeite`
- `Ten`
- `Twenty`
- `Fifty`
- `OneHundred`

### `Sortierung.SortDirection`
- `Ascending`
- `Descending`

### `ImRisSeit` bzw. `AenderungenSeit.Periode`
- `Undefined`
- `EinerWoche`
- `ZweiWochen`
- `EinemMonat`
- `DreiMonaten`
- `SechsMonaten`
- `EinemJahr`

Hinweis: In der offiziellen Example-UI werden meist nur die praktisch auswählbaren Werte ohne `Undefined` angezeigt.

---

## Suchausdruck-Typen laut Handbuch

Das Handbuch unterscheidet u. a. diese Suchtypen:

- `FulltextSearchExpression`
  - Volltextsuche analog zur RIS-Bürgerapplikation
- `PhraseSearchExpression`
  - Suche nach Begriffen/Phrasen, Wildcard `*` möglich
- `TermSearchExpression`
  - Suche nach einem Begriff ohne Leerzeichen, Wildcard `*` möglich
- `ExactMatchSearchExpression`
  - exakter Wert, keine Wildcards

Für freie Nutzer-Queries ist meist `Suchworte` als `FulltextSearchExpression` relevant.

---

## Version-Endpoint

Offiziell dokumentiert im Handbuch als:

```text
<domain>/ris/api/<vers>/version
```

Live geprüft:

```bash
curl -s https://data.bka.gv.at/ris/api/v2.6/Version
```

Antwort:

```json
{
  "OgdSearchResult": {
    "Version": "2.6"
  }
}
```

---

## Kompletter Endpoint-Katalog

Für alle offiziellen Top-Level-Endpunkte und Applikationen siehe:
- [`ris-api-endpoints-catalog.md`](./ris-api-endpoints-catalog.md)

## Für dieses Projekt relevante Route

`ris-cli` verwendet:

```text
GET/POST https://data.bka.gv.at/ris/api/v2.6/Judikatur
```

mit:

```text
Applikation=Justiz
```

Dazu gibt es eine eigene Detailseite:
- [`ris-api-judikatur-justiz.md`](./ris-api-judikatur-justiz.md)

---

## Fehlerformat

Das Handbuch zeigt Fehlermeldungen in diesem Schema:

```json
{
  "OgdSearchResult": {
    "Error": {
      "Applikation": "Landesnormen",
      "Message": "soap:Client ..."
    }
  }
}
```

Bei Serverfehlern wird zusätzlich HTTP `500` genannt.

Typische Fehlerursachen laut Handbuch:
- ungültige Enum-Werte
- ungültige Suchsyntax
- `Seitennummer` größer als verfügbare Seitenzahl
- Schema-Validierungsfehler

---

## Relevanz für `ris-cli`

Aus `../src/adapters/ris.ts`:

- Basis-URL: `https://data.bka.gv.at/ris/api/v2.6`
- Endpoint: `/Judikatur`
- feste Parameter:
  - `Applikation=Justiz`
  - `Sortierung.SortedByColumn=Datum`
  - `Sortierung.SortDirection=Descending`
- optionale Parameter aus CLI:
  - `Suchworte`
  - `EntscheidungsdatumVon`
  - `EntscheidungsdatumBis`
  - `Gericht`
- `limit` wird auf `DokumenteProSeite` gemappt:
  - `<=10 => Ten`
  - `<=20 => Twenty`
  - `<=50 => Fifty`
  - sonst `OneHundred`

Damit ist klar: die im Projekt verwendete Implementierung passt zur offiziellen REST-Doku und zur offiziellen Example-UI.

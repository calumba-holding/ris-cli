# RIS API – Judikatur / Justiz

Diese Datei fasst die **offizielle** Doku für den im Projekt tatsächlich verwendeten Use-Case zusammen:

```text
https://data.bka.gv.at/ris/api/v2.6/Judikatur
Applikation=Justiz
```

Quellen:
- offizielles Handbuch `OGD-RIS API Handbuch V2_6`
- offizielle Example-UI `Examples/justiz.html`
- live verifizierte Requests gegen die API

---

## Endpoint

```text
GET  /ris/api/v2.6/Judikatur
POST /ris/api/v2.6/Judikatur
```

Pflichtparameter für diesen Suchtyp:

```text
Applikation=Justiz
```

---

## Offizielle Parameter für `Judikatur/Justiz`

Laut Handbuch unterstützt `Applikation=Justiz` diese Parameter:

| Parameter | Typ / Werte | Pflicht | Hinweis |
|---|---|---:|---|
| `Applikation` | `Justiz` | ja | Muss gesetzt sein |
| `Suchworte` | `FulltextSearchExpression` | nein | freie RIS-Suchabfrage |
| `Dokumenttyp.SucheInRechtssaetzen` | `true` | nein | Suche auf Rechtssätze einschränken |
| `Dokumenttyp.SucheInEntscheidungstexten` | `true` | nein | Suche auf Entscheidungstexte einschränken |
| `Geschaeftszahl` | `FulltextSearchExpression` | nein | Geschäftszahl |
| `Norm` | `FulltextSearchExpression` | nein | zitierte Norm |
| `EntscheidungsdatumVon` | `YYYY-MM-DD` | nein | Startdatum |
| `EntscheidungsdatumBis` | `YYYY-MM-DD` | nein | Enddatum |
| `Rechtsgebiet` | Enum | nein | siehe unten |
| `Fachgebiet` | Enum | nein | siehe unten |
| `Gericht` | `FulltextSearchExpression` | nein | z. B. `OGH` |
| `Rechtssatznummer` | `FulltextSearchExpression` | nein | RIS-Rechtssatznummer |
| `Entscheidungsart` | Enum | nein | siehe unten |
| `RechtlicheBeurteilung` | `FulltextSearchExpression` | nein | Volltext |
| `Spruch` | `FulltextSearchExpression` | nein | Volltext |
| `Fundstelle` | `FulltextSearchExpression` | nein | Volltext |
| `AenderungenSeit.Periode` | Enum | nein | siehe unten |
| `Sortierung.SortedByColumn` | Enum | nein | siehe unten |
| `Sortierung.SortDirection` | `Ascending` / `Descending` | nein | Sortierrichtung |
| `ImRisSeit` | Enum | nein | siehe unten |
| `DokumenteProSeite` | `Ten` / `Twenty` / `Fifty` / `OneHundred` | nein | Page size |
| `Seitennummer` | `1..n` | nein | Paging |

---

## Enum-Werte

### `Rechtsgebiet`
- `Zivilrecht`
- `Strafrecht`

### `Entscheidungsart`
- `Ordentliche Erledigung (Sachentscheidung)`
- `Zurückweisung mangels erheblicher Rechtsfrage`
- `Zurückweisung aus anderen Gründen`
- `Verstärkter Senat`

### `Sortierung.SortedByColumn`
- `Geschaeftszahl`
- `Datum`
- `Gericht`
- `Typ`
- `Kurzinformation`

### `Sortierung.SortDirection`
- `Ascending`
- `Descending`

### `DokumenteProSeite`
- `Ten`
- `Twenty`
- `Fifty`
- `OneHundred`

### `ImRisSeit` und `AenderungenSeit.Periode`
Laut Handbuch:
- `Undefined`
- `EinerWoche`
- `ZweiWochen`
- `EinemMonat`
- `DreiMonaten`
- `SechsMonaten`
- `EinemJahr`

Die offizielle Example-UI zeigt davon typischerweise diese auswählbaren Werte:
- `EinerWoche`
- `ZweiWochen`
- `EinemMonat`
- `DreiMonaten`
- `SechsMonaten`
- `EinemJahr`

---

## Fachgebiete laut offizieller Example-UI / Handbuch

Für `Fachgebiet` sind u. a. diese Werte dokumentiert:

- `Amtsdelikte/Korruption`
- `Amtshaftung inkl. StEG`
- `Anfechtungsrecht`
- `Arbeitsrecht`
- `Bestandrecht`
- `Datenschutzrecht`
- `Erbrecht und Verlassenschaftsverfahren`
- `Erwachsenenschutzrecht`
- `Exekutionsrecht`
- `Familienrecht (ohne Unterhalt)`
- `Finanzstrafsachen`
- `Gewerblicher Rechtsschutz`
- `Grundbuchsrecht`
- `Grundrechte`
- `Insolvenzrecht`
- `Internationales Privat- und Zivilverfahrensrecht`
- `Jugendstrafsachen`
- `Kartellrecht`
- `Klauselentscheidungen`
- `Konsumentenschutz und Produkthaftung`
- `Medienrecht`
- `Persönlichkeitsschutzrecht`
- `Schadenersatz nach Verkehrsunfall`
- `Schlepperei/FPG`
- `Schiedsverfahrensrecht`
- `Sexualdelikte`
- `Sozialrecht`
- `Standes- und Disziplinarrecht für Anwälte`
- `Suchtgiftdelikte`
- `Transportrecht`
- `Unionsrecht`
- `Unterbringungs- und Heimaufenthaltsrecht`
- `Unterhaltsrecht inkl. UVG`
- `Unternehmens-, Gesellschafts- und Wertpapierrecht`
- `Urheberrecht`
- `Versicherungsvertragsrecht`
- `Wirtschaftsstrafsachen`
- `Wohnungseigentumsrecht`
- `Zivilverfahrensrecht`

---

## Response-Struktur

Die API liefert JSON unter `OgdSearchResult`.

Wichtige Felder in der Praxis:

```json
{
  "OgdSearchResult": {
    "OgdDocumentResults": {
      "Hits": {
        "@pageNumber": "1",
        "@pageSize": "10",
        "#text": "7"
      },
      "OgdDocumentReference": [
        {
          "Data": {
            "Metadaten": {
              "Technisch": {
                "ID": "...",
                "Applikation": "Justiz",
                "Organ": "OGH"
              },
              "Allgemein": {
                "DokumentUrl": "https://www.ris.bka.gv.at/Dokument.wxe?..."
              },
              "Judikatur": {
                "Dokumenttyp": "Rechtssatz",
                "Geschaeftszahl": { "item": "15Os114/11w" },
                "Entscheidungsdatum": "2012-05-30",
                "Justiz": {
                  "Gericht": "OGH"
                }
              }
            },
            "Dokumentliste": {
              "ContentReference": {
                "Urls": {
                  "ContentUrl": [
                    { "DataType": "Xml", "Url": "...xml" },
                    { "DataType": "Html", "Url": "...html" },
                    { "DataType": "Rtf", "Url": "...rtf" },
                    { "DataType": "Pdf", "Url": "...pdf" }
                  ]
                }
              }
            }
          }
        }
      ]
    }
  }
}
```

### Wichtige Beobachtung für dieses Projekt

Die eigentlichen Dokumentdateien kommen häufig **nicht** direkt als Text im JSON zurück, sondern als direkte RIS-URLs unter:

```text
Data.Dokumentliste.ContentReference.Urls.ContentUrl[]
```

Genau diese URLs nutzt `ris-cli`, um XML/HTML/RTF/PDF nachzuladen.

---

## Live verifiziertes Beispiel

GET mit projektnahem Query:

```bash
curl -sG 'https://data.bka.gv.at/ris/api/v2.6/Judikatur' \
  --data-urlencode 'Applikation=Justiz' \
  --data-urlencode 'Suchworte=Beleidigung §115 StGB' \
  --data-urlencode 'DokumenteProSeite=Ten' \
  --data-urlencode 'Seitennummer=1' \
  --data-urlencode 'Sortierung.SortedByColumn=Datum' \
  --data-urlencode 'Sortierung.SortDirection=Descending'
```

Geprüfte Antwortauszüge:

```json
{
  "Hits": {
    "@pageNumber": "1",
    "@pageSize": "10",
    "#text": "7"
  },
  "first": {
    "ID": "JJR_20120530_OGH0002_0150OS00114_11W0000_001",
    "DokumentUrl": "https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=Justiz&Dokumentnummer=JJR_20120530_OGH0002_0150OS00114_11W0000_001",
    "Dokumenttyp": "Rechtssatz",
    "Geschaeftszahl": {
      "item": "15Os114/11w"
    },
    "Entscheidungsdatum": "2012-05-30",
    "Gericht": "OGH"
  }
}
```

---

## Mapping zu `ris-cli`

Aus `../src/adapters/ris.ts`:

```ts
const params: Record<string, any> = {
  Applikation: 'Justiz',
  Suchworte: query,
  DokumenteProSeite: this.mapPageSizeToApiValue(pageSize),
  'Sortierung.SortedByColumn': 'Datum',
  'Sortierung.SortDirection': 'Descending',
};

if (options.fromDate) params.EntscheidungsdatumVon = options.fromDate;
if (options.toDate) params.EntscheidungsdatumBis = options.toDate;
if (options.gericht && options.gericht !== 'All') params.Gericht = options.gericht;
```

Damit nutzt das Projekt offiziell dokumentierte Parameter:

- `Suchworte`
- `EntscheidungsdatumVon`
- `EntscheidungsdatumBis`
- `Gericht`
- `DokumenteProSeite`
- `Seitennummer`
- `Sortierung.SortedByColumn`
- `Sortierung.SortDirection`

---

## Relevante Projekt-Defaults

`ris-cli` setzt serverseitig standardmäßig:

- Sortierung nach `Datum`
- Richtung `Descending`
- `Applikation=Justiz`

Außerdem mappt das Projekt `limit` auf RIS-Werte so:

- `<= 10` → `Ten`
- `<= 20` → `Twenty`
- `<= 50` → `Fifty`
- `> 50` → `OneHundred`

Das ist konsistent mit Handbuch und offizieller Example-UI.

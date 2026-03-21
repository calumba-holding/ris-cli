# Beispiel: `GET /Judikatur` mit `Applikation=Justiz`

Dieses Beispiel ist direkt für `ris-cli` relevant.

## Minimaler GET-Request

```bash
curl -sG 'https://data.bka.gv.at/ris/api/v2.6/Judikatur' \
  --data-urlencode 'Applikation=Justiz' \
  --data-urlencode 'Suchworte=Beleidigung §115 StGB' \
  --data-urlencode 'DokumenteProSeite=Ten' \
  --data-urlencode 'Seitennummer=1' \
  --data-urlencode 'Sortierung.SortedByColumn=Datum' \
  --data-urlencode 'Sortierung.SortDirection=Descending'
```

## Live verifizierter Response-Auszug

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
                "ID": "JJR_20120530_OGH0002_0150OS00114_11W0000_001",
                "Applikation": "Justiz",
                "Organ": "OGH"
              },
              "Allgemein": {
                "DokumentUrl": "https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=Justiz&Dokumentnummer=JJR_20120530_OGH0002_0150OS00114_11W0000_001"
              },
              "Judikatur": {
                "Dokumenttyp": "Rechtssatz",
                "Geschaeftszahl": {
                  "item": "15Os114/11w"
                },
                "Entscheidungsdatum": "2012-05-30",
                "Justiz": {
                  "Gericht": "OGH"
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

---

## Beispiel mit Datumsfilter und Gericht

```bash
curl -sG 'https://data.bka.gv.at/ris/api/v2.6/Judikatur' \
  --data-urlencode 'Applikation=Justiz' \
  --data-urlencode 'Suchworte=Verhetzung §283 StGB' \
  --data-urlencode 'EntscheidungsdatumVon=2020-01-01' \
  --data-urlencode 'EntscheidungsdatumBis=2026-12-31' \
  --data-urlencode 'Gericht=OGH' \
  --data-urlencode 'DokumenteProSeite=Ten' \
  --data-urlencode 'Seitennummer=1' \
  --data-urlencode 'Sortierung.SortedByColumn=Datum' \
  --data-urlencode 'Sortierung.SortDirection=Descending'
```

Das entspricht direkt dem, was `ris-cli` aus CLI-Optionen baut:
- `--from-date` → `EntscheidungsdatumVon`
- `--to-date` → `EntscheidungsdatumBis`
- `--court` → `Gericht`

---

## Wichtige Response-Felder

Für die Weiterverarbeitung im Projekt besonders wichtig:

- `OgdSearchResult.OgdDocumentResults.Hits`
- `...Technisch.ID`
- `...Allgemein.DokumentUrl`
- `...Judikatur.Dokumenttyp`
- `...Judikatur.Geschaeftszahl`
- `...Judikatur.Entscheidungsdatum`
- `...Judikatur.Justiz.Gericht`
- `...Dokumentliste.ContentReference.Urls.ContentUrl[]`

Über `ContentUrl[]` bekommt man direkte Links zu `xml`, `html`, `rtf` und `pdf`.

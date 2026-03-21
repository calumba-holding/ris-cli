# Beispiel: `POST /Judikatur` mit `Applikation=Justiz`

Die offizielle Example-UI (`justiz.html`) verwendet `POST` mit formularcodierten Parametern.

## POST-Request (`application/x-www-form-urlencoded`)

```bash
curl -s 'https://data.bka.gv.at/ris/api/v2.6/Judikatur' \
  -H 'Accept: application/json' \
  --data-urlencode 'Applikation=Justiz' \
  --data-urlencode 'Suchworte=Datenschutz' \
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
        "#text": "49"
      },
      "OgdDocumentReference": [
        {
          "Data": {
            "Metadaten": {
              "Technisch": {
                "ID": "JJR_20091215_OGH0002_0090OB00058_09H0000_001",
                "Applikation": "Justiz",
                "Organ": "OGH"
              },
              "Allgemein": {
                "DokumentUrl": "https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=Justiz&Dokumentnummer=JJR_20091215_OGH0002_0090OB00058_09H0000_001"
              },
              "Judikatur": {
                "Dokumenttyp": "Rechtssatz",
                "Entscheidungsdatum": "2026-02-24",
                "Justiz": {
                  "Gericht": "OGH",
                  "Rechtsgebiete": {
                    "item": "Zivilrecht"
                  },
                  "Rechtssatznummern": {
                    "item": "RS0125513"
                  }
                }
              }
            },
            "Dokumentliste": {
              "ContentReference": {
                "Urls": {
                  "ContentUrl": [
                    {
                      "DataType": "Xml",
                      "Url": "https://www.ris.bka.gv.at/Dokumente/Justiz/JJR_20091215_OGH0002_0090OB00058_09H0000_001/JJR_20091215_OGH0002_0090OB00058_09H0000_001.xml"
                    },
                    {
                      "DataType": "Html",
                      "Url": "https://www.ris.bka.gv.at/Dokumente/Justiz/JJR_20091215_OGH0002_0090OB00058_09H0000_001/JJR_20091215_OGH0002_0090OB00058_09H0000_001.html"
                    },
                    {
                      "DataType": "Rtf",
                      "Url": "https://www.ris.bka.gv.at/Dokumente/Justiz/JJR_20091215_OGH0002_0090OB00058_09H0000_001/JJR_20091215_OGH0002_0090OB00058_09H0000_001.rtf"
                    },
                    {
                      "DataType": "Pdf",
                      "Url": "https://www.ris.bka.gv.at/Dokumente/Justiz/JJR_20091215_OGH0002_0090OB00058_09H0000_001/JJR_20091215_OGH0002_0090OB00058_09H0000_001.pdf"
                    }
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

---

## Beispiel mit Dokumenttyp-Filtern

Laut Handbuch und offizieller Example-UI kann `Dokumenttyp` in spezialisierter Form gesetzt werden:

```bash
curl -s 'https://data.bka.gv.at/ris/api/v2.6/Judikatur' \
  --data-urlencode 'Applikation=Justiz' \
  --data-urlencode 'Suchworte=Datenschutz' \
  --data-urlencode 'Dokumenttyp.SucheInRechtssaetzen=true' \
  --data-urlencode 'Dokumenttyp.SucheInEntscheidungstexten=true' \
  --data-urlencode 'DokumenteProSeite=Ten' \
  --data-urlencode 'Seitennummer=1'
```

## Warum POST nützlich ist

POST ist praktisch, wenn:
- viele Parameter kombiniert werden
- zusammengesetzte Feldnamen verwendet werden
- ein Browser-Formular oder eine Beispiel-UI nachgebaut wird

Für einfache Automatisierung funktioniert aber auch `GET` sehr gut.

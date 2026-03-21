# Beispiel: `GET /Version`

Offizielle Quellen:
- Help-Index: <https://data.bka.gv.at/ris/api/v2.6/Help>
- Beispielseite in `Examples.zip`: `version.html`

## Request

```bash
curl -s https://data.bka.gv.at/ris/api/v2.6/Version
```

## Live verifizierte Response

```json
{
  "OgdSearchResult": {
    "Version": "2.6"
  }
}
```

## Nutzen

Praktisch als schneller Health-Check:

- API erreichbar?
- erwartete Version vorhanden?
- JSON-Antwort funktioniert?

## Projektbezug

Für `ris-cli` ist das kein Kern-Endpoint, aber gut für Smoke-Tests oder einfache Verbindungschecks.

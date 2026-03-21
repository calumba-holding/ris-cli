// Test fixtures - Sample API responses for testing

export const sampleAPIResponse = {
  Data: [
    {
      Metadaten: {
        Technisch: { ID: "JJR_20230315_OGH0002_0040OB00123_2300000_001" },
        Allgemein: {
          DokumentUrl:
            "https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=Justiz&Dokumentnummer=JJR_20230315_OGH0002_0040OB00123_2300000_001",
        },
        Judikatur: {
          Dokumenttyp: "Rechtssatz",
          Geschaeftszahl: "4Ob123/23x",
          Gericht: "OGH",
          Entscheidungsdatum: "2023-03-15",
          EuropeanCaseLawIdentifier: "ECLI:AT:OGH0002:2023:RS0000001",
          Schlagworte: "üble Nachrede, Cybermobbing, Internet",
          Entscheidungstexte: {
            item: [
              {
                Geschaeftszahl: "4 Ob 123/23x",
                Dokumenttyp: "Text",
                Gericht: "OGH",
                Entscheidungsdatum: "2023-03-15",
                Anmerkung:
                  "Der Beschwerdeführer wurde der üblen Nachrede schuldig erkannt.",
                DokumentUrl:
                  "https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=Justiz&Dokumentnummer=JJT_20230315_OGH0002_0040OB00123_2300000_000",
              },
            ],
          },
        },
      },
    },
    {
      Metadaten: {
        Technisch: { ID: "JJR_20230322_OGH0002_0050OB00456_2300000_001" },
        Allgemein: {
          DokumentUrl:
            "https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=Justiz&Dokumentnummer=JJR_20230322_OGH0002_0050OB00456_2300000_001",
        },
        Judikatur: {
          Dokumenttyp: "Rechtssatz",
          Geschaeftszahl: "5Ob456/23y",
          Gericht: "OGH",
          Entscheidungsdatum: "2023-03-22",
          EuropeanCaseLawIdentifier: "ECLI:AT:OGH0002:2023:RS0000002",
          Schlagworte: "Beleidigung, soziale Medien",
          Entscheidungstexte: {
            item: [
              {
                Geschaeftszahl: "5 Ob 456/23y",
                Dokumenttyp: "Text",
                Gericht: "OGH",
                Entscheidungsdatum: "2023-03-22",
                Anmerkung:
                  "Im vorliegenden Fall wurde eine Beleidigung im Internet festgestellt.",
                DokumentUrl:
                  "https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=Justiz&Dokumentnummer=JJT_20230322_OGH0002_0050OB00456_2300000_000",
              },
            ],
          },
        },
      },
    },
  ],
};

export const sampleAPIResponseEmpty = {
  Data: [],
};

export const sampleAPIStringResponse = JSON.stringify(sampleAPIResponse);

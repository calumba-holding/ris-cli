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

export const sampleBundesrechtAPIResponse = {
  Data: [
    {
      Metadaten: {
        Technisch: { ID: "NOR40271932" },
        Allgemein: {
          DokumentUrl:
            "https://www.ris.bka.gv.at/eli/bgbl/i/1997/12/P44b/NOR40271932",
        },
        Bundesrecht: {
          Kurztitel: "Waffengesetz 1996",
          BrKons: {
            Dokumenttyp: "Paragraph",
            ArtikelParagraphAnlage: "§ 44b",
            Inkrafttretensdatum: "9000-01-01",
            Gesetzesnummer: "10006016",
            GesamteRechtsvorschriftUrl:
              "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10006016",
          },
        },
      },
      Dokumentliste: {
        ContentReference: {
          Urls: {
            ContentUrl: [
              {
                DataType: "Xml",
                Url: "https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR40271932/NOR40271932.xml",
              },
              {
                DataType: "Html",
                Url: "https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR40271932/NOR40271932.html",
              },
              {
                DataType: "Rtf",
                Url: "https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR40271932/NOR40271932.rtf",
              },
            ],
          },
        },
      },
    },
    {
      Metadaten: {
        Technisch: { ID: "NOR40200000" },
        Allgemein: {
          DokumentUrl:
            "https://www.ris.bka.gv.at/eli/bgbl/i/2000/1/P1/NOR40200000",
        },
        Bundesrecht: {
          Kurztitel: "Datenschutzgesetz",
          BrKons: {
            Dokumenttyp: "Paragraph",
            ArtikelParagraphAnlage: "§ 1",
            Inkrafttretensdatum: "2024-01-01",
            Gesetzesnummer: "10001597",
            GesamteRechtsvorschriftUrl:
              "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10001597",
          },
        },
      },
    },
  ],
};

export const sampleAPIStringResponse = JSON.stringify(sampleAPIResponse);
export const sampleBundesrechtAPIStringResponse = JSON.stringify(
  sampleBundesrechtAPIResponse,
);

export const sampleVwghAPIResponse = {
  Data: [
    {
      Metadaten: {
        Technisch: {
          ID: "JWR_2025080088_20260226L01",
          Applikation: "Vwgh",
          Organ: "Verwaltungsgerichtshof (VwGH)",
        },
        Allgemein: {
          DokumentUrl:
            "https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=Vwgh&Dokumentnummer=JWR_2025080088_20260226L01",
        },
        Judikatur: {
          Dokumenttyp: "Rechtssatz",
          Geschaeftszahl: { item: "Ra 2025/08/0088" },
          Entscheidungsdatum: "2026-02-26",
          Schlagworte:
            "Individuelle Normen und Parteienrechte Bindung der Verwaltungsbehörden an gerichtliche Entscheidungen",
          EuropeanCaseLawIdentifier: "ECLI:AT:VWGH:2026:RA2025080088.L01",
          Vwgh: {
            Rechtssatznummer: "1",
            Entscheidungsart: "Erkenntnis",
            Gericht: "Verwaltungsgerichtshof (VwGH)",
          },
          GesamteEntscheidungUrl:
            "https://www.ris.bka.gv.at/JudikaturEntscheidung.wxe?Abfrage=Vwgh&Dokumentnummer=JWR_2025080088_20260226L01",
          EntscheidungstextUrl:
            "https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=Vwgh&Dokumentnummer=JWT_2025080088_20260226L00",
        },
      },
      Dokumentliste: {
        ContentReference: {
          Urls: {
            ContentUrl: [
              {
                DataType: "Html",
                Url: "https://www.ris.bka.gv.at/Dokumente/Vwgh/JWR_2025080088_20260226L01/JWR_2025080088_20260226L01.html",
              },
            ],
          },
        },
      },
    },
  ],
};

// Przykładowe pytania (wersja demo).
// Gdy obok leży plik pytania.js, jego pytania zastępują te poniżej.
// Identyfikatory zaczynają się od "DEMO-", żeby postępy z wersji demo
// nie mieszały się z pytaniami z pełnej bazy.
window.PYTANIA_PRZYKLAD = [
  {
    id: "DEMO-001",
    dzial: "MED.10.1 Bezpieczeństwo i higiena pracy",
    pytanie: "Jaką czynność należy wykonać jako pierwszą, udzielając pomocy osobie porażonej prądem elektrycznym?",
    odpowiedzi: {
      A: "Rozpocząć uciskanie klatki piersiowej",
      B: "Odłączyć źródło prądu",
      C: "Ułożyć poszkodowanego w pozycji bezpiecznej",
      D: "Podać poszkodowanemu wodę do picia"
    },
    poprawna: "B",
    wyjasnienie: "Najpierw trzeba przerwać przepływ prądu (wyłączyć zasilanie). Dotknięcie poszkodowanego, który wciąż jest pod napięciem, grozi porażeniem ratownika.",
    zrodlo: "MED.10.1.8"
  },
  {
    id: "DEMO-002",
    dzial: "MED.10.1 Bezpieczeństwo i higiena pracy",
    pytanie: "Co powinien zrobić masażysta bezpośrednio przed rozpoczęciem i po zakończeniu zabiegu?",
    odpowiedzi: {
      A: "Umyć i zdezynfekować ręce",
      B: "Nałożyć rękawice ochronne na cały dzień pracy",
      C: "Przewietrzyć gabinet przez 30 minut",
      D: "Zmierzyć pacjentowi temperaturę"
    },
    poprawna: "A",
    wyjasnienie: "Higiena rąk przed zabiegiem i po nim chroni pacjenta i masażystę przed przenoszeniem drobnoustrojów.",
    zrodlo: "MED.10.1.7"
  },
  {
    id: "DEMO-003",
    dzial: "MED.10.2 Podstawy masażu",
    pytanie: "Który staw prostuje mięsień czworogłowy uda?",
    odpowiedzi: {
      A: "Skokowy górny",
      B: "Biodrowy",
      C: "Kolanowy",
      D: "Krzyżowo-biodrowy"
    },
    poprawna: "C",
    wyjasnienie: "Mięsień czworogłowy uda przyczepia się przez więzadło rzepki do guzowatości piszczeli i jest głównym prostownikiem stawu kolanowego.",
    zrodlo: "MED.10.2.11"
  },
  {
    id: "DEMO-004",
    dzial: "MED.10.2 Podstawy masażu",
    pytanie: "Do której kości przyczepia się ścięgno piętowe (Achillesa)?",
    odpowiedzi: {
      A: "Skokowej",
      B: "Piętowej",
      C: "Łódkowatej",
      D: "Strzałkowej"
    },
    poprawna: "B",
    wyjasnienie: "Ścięgno piętowe jest wspólnym ścięgnem mięśnia trójgłowego łydki i przyczepia się do guza kości piętowej.",
    zrodlo: "MED.10.2.9"
  },
  {
    id: "DEMO-005",
    dzial: "MED.10.2 Podstawy masażu",
    pytanie: "Jaka jest prawidłowa częstość tętna spoczynkowego u zdrowej osoby dorosłej?",
    odpowiedzi: {
      A: "30–50 uderzeń na minutę",
      B: "60–80 uderzeń na minutę",
      C: "100–140 uderzeń na minutę",
      D: "140–180 uderzeń na minutę"
    },
    poprawna: "B",
    wyjasnienie: "Prawidłowe tętno spoczynkowe dorosłego mieści się zwykle w przedziale 60–80 (do 100) uderzeń na minutę.",
    zrodlo: "MED.10.2.13"
  },
  {
    id: "DEMO-006",
    dzial: "MED.10.2 Podstawy masażu",
    pytanie: "Którą techniką rozpoczyna się masaż klasyczny?",
    odpowiedzi: {
      A: "Ugniataniem",
      B: "Oklepywaniem",
      C: "Wibracją",
      D: "Głaskaniem"
    },
    poprawna: "D",
    wyjasnienie: "Kolejność technik w masażu klasycznym: głaskanie, rozcieranie, ugniatanie, oklepywanie, wibracja. Głaskanie rozpoczyna i kończy masaż.",
    zrodlo: "MED.10.2.15"
  },
  {
    id: "DEMO-007",
    dzial: "MED.10.2 Podstawy masażu",
    pytanie: "W jakim kierunku wykonuje się zasadniczo ruchy w masażu klasycznym kończyn?",
    odpowiedzi: {
      A: "Dosercowym",
      B: "Odsercowym",
      C: "Poprzecznym do osi kończyny",
      D: "Dowolnym, zależnie od wygody masażysty"
    },
    poprawna: "A",
    wyjasnienie: "Ruchy wykonuje się dosercowo, zgodnie z kierunkiem odpływu krwi żylnej i chłonki.",
    zrodlo: "MED.10.2.15"
  },
  {
    id: "DEMO-008",
    dzial: "MED.10.3 Podstawy masażu w medycynie",
    pytanie: "Okolicy których narządów nie należy oklepywać podczas masażu grzbietu?",
    odpowiedzi: {
      A: "Mięśni czworobocznych",
      B: "Łopatek",
      C: "Nerek",
      D: "Mięśni najszerszych grzbietu"
    },
    poprawna: "C",
    wyjasnienie: "Oklepywania nie wykonuje się w okolicy nerek (okolica lędźwiowa przy kręgosłupie), ponieważ wstrząsy mogą im zaszkodzić.",
    zrodlo: "MED.10.3.3"
  },
  {
    id: "DEMO-009",
    dzial: "MED.10.3 Podstawy masażu w medycynie",
    pytanie: "Który stan pacjenta jest przeciwwskazaniem do wykonania masażu?",
    odpowiedzi: {
      A: "Płaskostopie",
      B: "Gorączka",
      C: "Zanik mięśni po unieruchomieniu",
      D: "Przewlekłe zaparcia nawykowe"
    },
    poprawna: "B",
    wyjasnienie: "Gorączka i ostre stany zapalne to przeciwwskazania do masażu. Pozostałe stany są wskazaniami do masażu.",
    zrodlo: "MED.10.3.3"
  },
  {
    id: "DEMO-010",
    dzial: "MED.10.4 Wykonywanie masażu w medycynie",
    pytanie: "Od opracowania której okolicy rozpoczyna się manualny drenaż limfatyczny?",
    odpowiedzi: {
      A: "Stóp",
      B: "Dłoni",
      C: "Okolicy nadobojczykowej (szyi)",
      D: "Okolicy lędźwiowej"
    },
    poprawna: "C",
    wyjasnienie: "Drenaż zaczyna się od udrożnienia ujść chłonki do żył w okolicy nadobojczykowej, a dopiero potem opracowuje się okolice dalsze.",
    zrodlo: "MED.10.4.7"
  }
];

window.PYTANIA = window.PYTANIA_PRZYKLAD;

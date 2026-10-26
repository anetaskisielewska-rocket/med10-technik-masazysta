// Aplikacja do nauki na egzamin MED.10 (technik masażysta).
// Działa bez serwera: pytania są wczytywane przez <script> w index.html.
(function () {
  'use strict';

  var KLUCZ = 'med10-postepy-v1';
  var LITERY = ['A', 'B', 'C', 'D'];
  var PYTAN_NA_EGZAMINIE = 40;
  var CZAS_EGZAMINU_MS = 60 * 60 * 1000;
  var PROG_ZDANIA = 50;
  var POPRAWNYCH_DO_ZALICZENIA_BLEDU = 2;
  var MAKS_HISTORIA = 100;

  var app = document.getElementById('app');

  // ---------- Pytania ----------

  function oczyscPytania(lista) {
    if (!Array.isArray(lista)) return [];
    var wynik = [];
    var widziane = {};
    var pominiete = 0;
    lista.forEach(function (p) {
      var ok = p && typeof p === 'object' &&
        typeof p.id === 'string' && p.id && !widziane[p.id] &&
        typeof p.pytanie === 'string' && p.pytanie.trim() &&
        p.odpowiedzi && typeof p.odpowiedzi === 'object';
      var poprawna = ok ? String(p.poprawna || '').trim().toUpperCase() : '';
      var litery = ok ? LITERY.filter(function (l) {
        return typeof p.odpowiedzi[l] === 'string' && p.odpowiedzi[l].trim();
      }) : [];
      if (!ok || litery.length < 2 || litery.indexOf(poprawna) === -1) {
        pominiete++;
        return;
      }
      widziane[p.id] = true;
      wynik.push({
        id: p.id,
        dzial: (typeof p.dzial === 'string' && p.dzial.trim()) || 'Inne',
        pytanie: p.pytanie,
        odpowiedzi: p.odpowiedzi,
        litery: litery,
        poprawna: poprawna,
        wyjasnienie: typeof p.wyjasnienie === 'string' ? p.wyjasnienie : '',
        zrodlo: typeof p.zrodlo === 'string' ? p.zrodlo : ''
      });
    });
    if (pominiete) console.warn('MED.10: pominięto ' + pominiete + ' niepoprawnych lub powtórzonych pytań.');
    return wynik;
  }

  function wczytajPytania() {
    var przyklad = window.PYTANIA_PRZYKLAD || [];
    var zrodlo;
    // pytania.js mógłby użyć "const PYTANIA = …" zamiast "window.PYTANIA = …";
    // gołe odwołanie znajdzie obie wersje.
    try {
      zrodlo = typeof PYTANIA !== 'undefined' ? PYTANIA : window.PYTANIA; // eslint-disable-line no-undef
    } catch (e) {
      zrodlo = window.PYTANIA;
    }
    if (zrodlo && zrodlo !== przyklad) {
      var pelne = oczyscPytania(zrodlo);
      if (pelne.length) return { lista: pelne, demo: false };
    }
    return { lista: oczyscPytania(przyklad), demo: true };
  }

  var baza = wczytajPytania();
  var pytania = baza.lista;
  var poId = {};
  pytania.forEach(function (p) { poId[p.id] = p; });

  var dzialy = [];
  pytania.forEach(function (p) {
    if (dzialy.indexOf(p.dzial) === -1) dzialy.push(p.dzial);
  });
  dzialy.sort(function (a, b) { return a.localeCompare(b, 'pl', { numeric: true }); });

  // ---------- Zapis postępów (localStorage może być zablokowany) ----------

  var magazynDziala = (function () {
    try {
      var t = '__med10_test__';
      window.localStorage.setItem(t, '1');
      window.localStorage.removeItem(t);
      return true;
    } catch (e) {
      return false;
    }
  })();

  function pustyStan() {
    return { wyniki: {}, bledy: {}, egzaminy: [], egzamin: null, podpowiedzi: false };
  }

  function wczytajStan() {
    var s = pustyStan();
    var tekst = null;
    try {
      tekst = window.localStorage.getItem(KLUCZ);
    } catch (e) {
      return s;
    }
    if (!tekst) return s;
    try {
      var o = JSON.parse(tekst);
      if (o && typeof o === 'object') {
        if (o.wyniki && typeof o.wyniki === 'object') s.wyniki = o.wyniki;
        if (o.bledy && typeof o.bledy === 'object') s.bledy = o.bledy;
        if (Array.isArray(o.egzaminy)) s.egzaminy = o.egzaminy;
        if (o.egzamin && Array.isArray(o.egzamin.ids)) s.egzamin = o.egzamin;
        if (typeof o.podpowiedzi === 'boolean') s.podpowiedzi = o.podpowiedzi;
      }
    } catch (e) {
      console.warn('MED.10: zapisane postępy były uszkodzone – zaczynam od nowa.');
    }
    return s;
  }

  var stan = wczytajStan();

  function zapisz() {
    try {
      window.localStorage.setItem(KLUCZ, JSON.stringify(stan));
    } catch (e) {
      magazynDziala = false;
    }
  }

  function maWlasnosc(obj, klucz) {
    return Object.prototype.hasOwnProperty.call(obj, klucz);
  }

  // Zapisuje odpowiedź do statystyk i aktualizuje listę błędów.
  // Pytanie wypada z powtórki po 2 poprawnych odpowiedziach z rzędu.
  function zanotujOdpowiedz(p, litera) {
    var dobrze = litera === p.poprawna;
    var w = maWlasnosc(stan.wyniki, p.id) ? stan.wyniki[p.id] : (stan.wyniki[p.id] = { ok: 0, zle: 0 });
    if (dobrze) w.ok++; else w.zle++;
    if (!dobrze) {
      stan.bledy[p.id] = 0;
    } else if (maWlasnosc(stan.bledy, p.id)) {
      stan.bledy[p.id]++;
      if (stan.bledy[p.id] >= POPRAWNYCH_DO_ZALICZENIA_BLEDU) delete stan.bledy[p.id];
    }
    return dobrze;
  }

  function idsDoPowtorki() {
    return Object.keys(stan.bledy).filter(function (id) { return poId[id]; });
  }

  // ---------- Pomocnicze ----------

  function h(tekst) {
    return String(tekst == null ? '' : tekst)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function wymieszaj(tab) {
    var a = tab.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function procent(czesc, calosc) {
    return calosc ? czesc / calosc * 100 : 0;
  }

  function fmtProcent(x) {
    return (Math.round(x * 10) / 10).toString().replace('.', ',') + '%';
  }

  function fmtCzas(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(s / 60);
    s = s % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function fmtData(ms) {
    var d = new Date(ms);
    function dw(n) { return (n < 10 ? '0' : '') + n; }
    return dw(d.getDate()) + '.' + dw(d.getMonth() + 1) + '.' + d.getFullYear() +
      ', ' + dw(d.getHours()) + ':' + dw(d.getMinutes());
  }

  function odmiana(n, jeden, kilka, wiele) {
    if (n === 1) return jeden;
    var r10 = n % 10, r100 = n % 100;
    if (r10 >= 2 && r10 <= 4 && (r100 < 12 || r100 > 14)) return kilka;
    return wiele;
  }

  function pasek(proc, klasa) {
    return '<div class="pasek-postepu ' + (klasa || '') + '"><div style="width:' +
      Math.max(0, Math.min(100, proc)).toFixed(1) + '%"></div></div>';
  }

  // ---------- Nawigacja między ekranami ----------

  var timer = null;
  var klawisze = null;   // obsługa klawiatury aktywnego ekranu
  var akcje = {};        // akcje przycisków aktywnego ekranu (data-akcja)
  var wHistorii = false;

  function pokaz(html, opcje) {
    opcje = opcje || {};
    if (timer) { clearInterval(timer); timer = null; }
    app.innerHTML = html;
    klawisze = opcje.klawisze || null;
    akcje = opcje.akcje || {};
    if (!opcje.bezPrzewijania) window.scrollTo(0, 0);
    // Przycisk/gest „wstecz” w telefonie wraca do menu zamiast zamykać aplikację.
    if (opcje.start) return;
    if (!wHistorii) {
      try { history.pushState({ med10: true }, ''); wHistorii = true; } catch (e) { /* file:// bywa ograniczone */ }
    }
  }

  window.addEventListener('popstate', function () {
    wHistorii = false;
    ekranStart();
  });

  function doMenu() {
    if (wHistorii) {
      try { history.back(); return; } catch (e) { /* przejdź niżej */ }
    }
    ekranStart();
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-akcja]') : null;
    if (!el || el.disabled) return;
    var nazwa = el.getAttribute('data-akcja');
    var arg = el.getAttribute('data-arg');
    if (nazwa === 'menu') { doMenu(); return; }
    if (akcje[nazwa]) akcje[nazwa](arg, el);
  });

  document.addEventListener('keydown', function (e) {
    if (!klawisze || e.ctrlKey || e.metaKey || e.altKey) return;
    var cel = e.target;
    var tag = cel && cel.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    var k = e.key;
    var litera = null;
    if (k >= '1' && k <= '4' && k.length === 1) litera = LITERY[Number(k) - 1];
    else if (k && k.length === 1 && 'abcdABCD'.indexOf(k) !== -1) litera = k.toUpperCase();
    if (litera) {
      if (klawisze.litera) { e.preventDefault(); klawisze.litera(litera); }
      return;
    }
    if (k === 'Enter') {
      // Enter na zaznaczonym (Tab) przycisku działa jak zwykle – klika go.
      if (tag === 'BUTTON' || tag === 'A') return;
      if (klawisze.enter) { e.preventDefault(); klawisze.enter(); }
      return;
    }
    if (k === 'ArrowLeft' && klawisze.lewo) { klawisze.lewo(); return; }
    if (k === 'ArrowRight' && klawisze.prawo) { klawisze.prawo(); return; }
  });

  // ---------- Ekran startowy ----------

  function podsumowanie(lista) {
    var ok = 0, zle = 0, przerobione = 0;
    lista.forEach(function (p) {
      var w = stan.wyniki[p.id];
      if (w && (w.ok || w.zle)) {
        przerobione++;
        ok += w.ok || 0;
        zle += w.zle || 0;
      }
    });
    return { ok: ok, zle: zle, odpowiedzi: ok + zle, przerobione: przerobione, wszystkie: lista.length };
  }

  function ekranStart() {
    var s = podsumowanie(pytania);
    var doPowtorki = idsDoPowtorki().length;
    var ostatni = stan.egzaminy[stan.egzaminy.length - 1];
    var egz = stan.egzamin;
    var egzPozostalo = egz ? egz.koniec - Date.now() : 0;

    var html = '<section class="karta powitanie">' +
      '<h1>Nauka do egzaminu MED.10</h1>' +
      '<p class="podtytul">Świadczenie usług w zakresie masażu</p>' +
      '<div class="liczby">' +
        '<div><strong>' + pytania.length + '</strong><span>' + odmiana(pytania.length, 'pytanie', 'pytania', 'pytań') + ' w bazie</span></div>' +
        '<div><strong>' + s.przerobione + '</strong><span>przerobionych</span></div>' +
        '<div><strong>' + (s.odpowiedzi ? fmtProcent(procent(s.ok, s.odpowiedzi)) : '–') + '</strong><span>poprawnych odpowiedzi</span></div>' +
      '</div>' +
      pasek(procent(s.przerobione, s.wszystkie)) +
      '<p class="maly">Przerobiono ' + s.przerobione + ' z ' + s.wszystkie + ' pytań' +
        (ostatni ? ' · ostatni egzamin próbny: ' + fmtProcent(ostatni.procent) + ' (' + (ostatni.zdany ? 'zdany' : 'niezdany') + ')' : '') +
      '</p>' +
    '</section>' +
    '<nav class="tryby">' +
      '<button type="button" class="tryb" data-akcja="nauka"><span class="ikona" aria-hidden="true">📖</span>' +
        '<span><strong>Tryb nauki</strong><small>Pytania z wybranego działu, od razu z wyjaśnieniem</small></span></button>' +
      (egz && egzPozostalo > 0
        ? '<button type="button" class="tryb wyrozniony" data-akcja="wznowEgzamin"><span class="ikona" aria-hidden="true">⏱️</span>' +
          '<span><strong>Wróć do egzaminu</strong><small>Zostało ' + fmtCzas(egzPozostalo) + ' · odpowiedziano na ' +
          Object.keys(egz.odp || {}).length + ' z ' + egz.ids.length + '</small></span></button>'
        : '<button type="button" class="tryb" data-akcja="egzamin"><span class="ikona" aria-hidden="true">📝</span>' +
          '<span><strong>Egzamin próbny</strong><small>' + Math.min(PYTAN_NA_EGZAMINIE, pytania.length) + ' pytań, 60 minut, wynik na końcu</small></span></button>') +
      '<button type="button" class="tryb" data-akcja="powtorka"' + (doPowtorki ? '' : ' disabled') + '><span class="ikona" aria-hidden="true">🔁</span>' +
        '<span><strong>Powtórka błędów' + (doPowtorki ? ' (' + doPowtorki + ')' : '') + '</strong><small>' +
        (doPowtorki ? 'Pytanie znika po 2 poprawnych odpowiedziach z rzędu' : 'Na razie brak błędów do powtórzenia') +
        '</small></span></button>' +
      '<button type="button" class="tryb" data-akcja="statystyki"><span class="ikona" aria-hidden="true">📊</span>' +
        '<span><strong>Statystyki</strong><small>Wyniki w działach i historia egzaminów</small></span></button>' +
    '</nav>';

    var uwagi = [];
    if (baza.demo) {
      uwagi.push('Wersja demo: ' + pytania.length + ' przykładowych pytań. Pełna baza pojawi się po dodaniu pliku <code>pytania.js</code>.');
    }
    if (!magazynDziala) {
      uwagi.push('Przeglądarka blokuje zapisywanie danych – postępy znikną po zamknięciu strony.');
    }
    if (uwagi.length) html += '<p class="uwaga">' + uwagi.join('<br>') + '</p>';
    html += '<p class="podpowiedz">Klawiatura: 1–4 lub A–D wybiera odpowiedź, Enter przechodzi dalej.</p>';

    pokaz(html, {
      start: true,
      akcje: {
        nauka: ekranWyborDzialu,
        egzamin: ekranPrzedEgzaminem,
        wznowEgzamin: function () { ekranEgzamin(); },
        powtorka: rozpocznijPowtorke,
        statystyki: ekranStatystyki
      }
    });

    // Egzamin, któremu skończył się czas, gdy aplikacja była zamknięta.
    if (egz && egzPozostalo <= 0) zakonczEgzamin(true);
  }

  // ---------- Tryb nauki i powtórka ----------

  function ekranWyborDzialu() {
    var html = '<h1>Tryb nauki</h1><p>Wybierz dział:</p><div class="lista-dzialow">' +
      przyciskDzialu('', 'Wszystkie działy', pytania);
    dzialy.forEach(function (d, i) {
      html += przyciskDzialu(String(i), d, pytania.filter(function (p) { return p.dzial === d; }));
    });
    html += '</div><button type="button" class="drugorzedny" data-akcja="menu">← Menu</button>';
    pokaz(html, {
      akcje: {
        dzial: function (arg) {
          var lista = arg === '' ? pytania : pytania.filter(function (p) { return p.dzial === dzialy[Number(arg)]; });
          rozpocznijSesje('nauka', wymieszaj(lista), arg === '' ? 'Wszystkie działy' : dzialy[Number(arg)]);
        }
      }
    });
  }

  function przyciskDzialu(arg, nazwa, lista) {
    var s = podsumowanie(lista);
    return '<button type="button" class="dzial-przycisk" data-akcja="dzial" data-arg="' + arg + '">' +
      '<span class="dzial-nazwa">' + h(nazwa) + '</span>' +
      '<span class="dzial-info">' + lista.length + ' ' + odmiana(lista.length, 'pytanie', 'pytania', 'pytań') +
      (s.odpowiedzi ? ' · ' + fmtProcent(procent(s.ok, s.odpowiedzi)) + ' poprawnych' : '') + '</span>' +
      pasek(procent(s.przerobione, s.wszystkie), 'cienki') +
      '</button>';
  }

  function rozpocznijPowtorke() {
    var ids = idsDoPowtorki();
    if (!ids.length) { ekranStart(); return; }
    rozpocznijSesje('powtorka', wymieszaj(ids.map(function (id) { return poId[id]; })), 'Powtórka błędów');
  }

  var sesja = null;

  function rozpocznijSesje(tryb, lista, tytul) {
    sesja = { tryb: tryb, tytul: tytul, lista: lista, i: 0, wybrana: null, dobre: 0, zle: 0 };
    ekranPytaniaSesji();
  }

  function ekranPytaniaSesji(poOdpowiedzi) {
    var p = sesja.lista[sesja.i];
    var odp = sesja.wybrana;
    var html = '<div class="gora-sesji"><span>' + h(sesja.tytul) + '</span>' +
      '<span>Pytanie ' + (sesja.i + 1) + ' z ' + sesja.lista.length +
      ' · <span class="dobrze">✓ ' + sesja.dobre + '</span> <span class="zle">✗ ' + sesja.zle + '</span></span></div>' +
      pasek(procent(sesja.i + (odp ? 1 : 0), sesja.lista.length)) +
      htmlPytania(p, odp, true);

    if (odp) {
      var dobrze = odp === p.poprawna;
      var seria = maWlasnosc(stan.bledy, p.id) ? stan.bledy[p.id] : null;
      html += htmlWyjasnienia(p, odp, sesja.tryb === 'powtorka'
          ? (seria === null
            ? 'To pytanie znika z powtórki – 2 razy z rzędu dobrze!'
            : (dobrze ? 'Jeszcze 1 poprawna odpowiedź, a pytanie zniknie z powtórki.' : 'Pytanie zostaje w powtórce.'))
          : '') +
        '<button type="button" class="glowny" data-akcja="dalej">' +
        (sesja.i + 1 < sesja.lista.length ? 'Dalej' : 'Zakończ') + ' <kbd>Enter</kbd></button>';
    } else {
      html += '<button type="button" class="drugorzedny" data-akcja="pomin">Pomiń pytanie</button>';
    }
    html += '<button type="button" class="drugorzedny" data-akcja="koniecSesji">Zakończ naukę</button>';

    function odpowiedz(litera) {
      if (sesja.wybrana || p.litery.indexOf(litera) === -1) return;
      sesja.wybrana = litera;
      if (zanotujOdpowiedz(p, litera)) sesja.dobre++; else sesja.zle++;
      zapisz();
      ekranPytaniaSesji(true);
    }
    function dalej() {
      if (!sesja.wybrana) return;
      nastepne();
    }
    function nastepne() {
      sesja.i++;
      sesja.wybrana = null;
      if (sesja.i >= sesja.lista.length) ekranKoniecSesji();
      else ekranPytaniaSesji();
    }

    pokaz(html, {
      bezPrzewijania: poOdpowiedzi,
      klawisze: { litera: odpowiedz, enter: dalej },
      akcje: {
        odp: odpowiedz,
        dalej: dalej,
        pomin: nastepne,
        koniecSesji: ekranKoniecSesji
      }
    });

    if (poOdpowiedzi) {
      var w = app.querySelector('.glowny');
      if (w && w.scrollIntoView) w.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function ekranKoniecSesji() {
    var razem = sesja.dobre + sesja.zle;
    var pozostalo = idsDoPowtorki().length;
    var html = '<section class="karta wynik-sesji"><h1>' +
      (sesja.tryb === 'powtorka' ? 'Koniec powtórki' : 'Koniec nauki') + '</h1>' +
      (razem
        ? '<p class="duzy">' + sesja.dobre + ' / ' + razem + '</p><p>poprawnych odpowiedzi (' + fmtProcent(procent(sesja.dobre, razem)) + ')</p>'
        : '<p>Nie udzielono żadnej odpowiedzi.</p>') +
      '<p class="maly">Pytań do powtórki: ' + pozostalo + '</p></section>' +
      '<div class="przyciski">' +
      (sesja.tryb === 'powtorka' && pozostalo
        ? '<button type="button" class="glowny" data-akcja="powtorka">Powtórz błędy jeszcze raz</button>'
        : '<button type="button" class="glowny" data-akcja="nauka">Ucz się dalej</button>') +
      '<button type="button" class="drugorzedny" data-akcja="menu">Menu</button></div>';
    pokaz(html, {
      klawisze: { enter: doMenu },
      akcje: { powtorka: rozpocznijPowtorke, nauka: ekranWyborDzialu }
    });
  }

  function htmlWyjasnienia(p, odp, dopisek) {
    var dobrze = odp === p.poprawna;
    return '<div class="wyjasnienie ' + (dobrze ? 'ok' : 'blad') + '" role="status">' +
      '<p class="werdykt">' + (dobrze ? '✓ Dobrze!' : '✗ Źle. Poprawna odpowiedź: ' + p.poprawna) + '</p>' +
      (p.wyjasnienie ? '<p>' + h(p.wyjasnienie) + '</p>' : '') +
      (p.zrodlo ? '<p class="zrodlo">Źródło: ' + h(p.zrodlo) + '</p>' : '') +
      (dopisek ? '<p class="zrodlo">' + h(dopisek) + '</p>' : '') +
      '</div>';
  }

  function htmlPytania(p, wybrana, pokazPoprawna) {
    var html = '<p class="dzial-etykieta">' + h(p.dzial) + '</p>' +
      '<h2 class="tresc">' + h(p.pytanie) + '</h2><div class="odpowiedzi">';
    p.litery.forEach(function (l, i) {
      var klasa = 'odp';
      if (pokazPoprawna && wybrana) {
        if (l === p.poprawna) klasa += ' poprawna';
        else if (l === wybrana) klasa += ' bledna';
        else klasa += ' wyszarzona';
      } else if (l === wybrana) {
        klasa += ' wybrana';
      }
      html += '<button type="button" class="' + klasa + '" data-akcja="odp" data-arg="' + l + '"' +
        (pokazPoprawna && wybrana ? ' disabled' : '') +
        ' aria-pressed="' + (l === wybrana) + '" aria-keyshortcuts="' + (i + 1) + ' ' + l + '">' +
        '<span class="litera">' + l + '</span><span class="tekst">' + h(p.odpowiedzi[l]) + '</span></button>';
    });
    return html + '</div>';
  }

  // ---------- Egzamin próbny ----------

  function ekranPrzedEgzaminem() {
    var n = Math.min(PYTAN_NA_EGZAMINIE, pytania.length);
    var html = '<h1>Egzamin próbny</h1>' +
      '<section class="karta"><p>' + n + ' losowych pytań ze wszystkich działów, 60 minut. ' +
      'Możesz wracać do pytań i zmieniać odpowiedzi. Do zdania potrzeba co najmniej ' + PROG_ZDANIA + '%.</p></section>' +
      '<label class="przelacznik karta"><input type="checkbox" id="podpowiedzi"' + (stan.podpowiedzi ? ' checked' : '') + '>' +
      '<span><strong>Pokazuj poprawne odpowiedzi od razu</strong>' +
      '<small>Po kliknięciu odpowiedzi od razu widać, czy jest dobra, i wyjaśnienie. ' +
      'Odpowiedzi nie da się wtedy zmienić. Wyłącz, żeby egzamin był jak prawdziwy.</small></span></label>' +
      '<div class="przyciski"><button type="button" class="glowny" data-akcja="start">Rozpocznij egzamin</button>' +
      '<button type="button" class="drugorzedny" data-akcja="menu">← Menu</button></div>';
    pokaz(html, {
      klawisze: { enter: rozpocznijEgzamin },
      akcje: { start: rozpocznijEgzamin }
    });
    document.getElementById('podpowiedzi').addEventListener('change', function (e) {
      stan.podpowiedzi = e.target.checked;
      zapisz();
    });
  }

  function rozpocznijEgzamin() {
    var ids = wymieszaj(pytania).slice(0, PYTAN_NA_EGZAMINIE).map(function (p) { return p.id; });
    var teraz = Date.now();
    stan.egzamin = { ids: ids, odp: {}, i: 0, start: teraz, koniec: teraz + CZAS_EGZAMINU_MS, podpowiedzi: !!stan.podpowiedzi };
    zapisz();
    ekranEgzamin();
  }

  function ekranEgzamin(bezPrzewijania) {
    var egz = stan.egzamin;
    if (!egz) { ekranStart(); return; }
    // Pytania mogły zniknąć z bazy (np. po podmianie pytania.js) – pomiń je.
    egz.ids = egz.ids.filter(function (id) { return poId[id]; });
    if (!egz.ids.length) { stan.egzamin = null; zapisz(); ekranStart(); return; }
    if (egz.i >= egz.ids.length) egz.i = egz.ids.length - 1;

    var p = poId[egz.ids[egz.i]];
    var n = egz.ids.length;
    var odpowiedziano = Object.keys(egz.odp).filter(function (id) { return poId[id]; }).length;
    var odp = egz.odp[p.id] || null;
    var zablokowane = !!(egz.podpowiedzi && odp);

    var html = '<div class="gora-egzaminu">' +
      '<span>Pytanie <strong>' + (egz.i + 1) + '</strong> z ' + n + '</span>' +
      '<span class="licznik" id="licznik" role="timer" aria-live="off">⏱ ' + fmtCzas(egz.koniec - Date.now()) + '</span>' +
      '</div>' +
      (n < PYTAN_NA_EGZAMINIE && egz.i === 0
        ? '<p class="uwaga">W bazie jest tylko ' + n + ' ' + odmiana(n, 'pytanie', 'pytania', 'pytań') + ', więc egzamin jest krótszy niż prawdziwy (40).</p>'
        : '') +
      htmlPytania(p, odp, !!egz.podpowiedzi) +
      (zablokowane ? htmlWyjasnienia(p, odp, '') : '') +
      '<div class="nawigacja">' +
        '<button type="button" class="drugorzedny" data-akcja="poprzednie"' + (egz.i === 0 ? ' disabled' : '') + '>← Wstecz</button>' +
        '<button type="button" class="glowny" data-akcja="nastepne"' + (egz.i === n - 1 ? ' disabled' : '') + '>Dalej →</button>' +
      '</div>' +
      '<p class="maly">Odpowiedziano: ' + odpowiedziano + ' z ' + n + '. Kliknij numer, aby przejść do pytania.</p>' +
      '<div class="siatka">';
    egz.ids.forEach(function (id, i) {
      var stanNr = !egz.odp[id] ? '' : !egz.podpowiedzi ? ' odpowiedziane' :
        (egz.odp[id] === poId[id].poprawna ? ' trafione' : ' chybione');
      html += '<button type="button" class="nr' + stanNr + (i === egz.i ? ' biezace' : '') +
        '" data-akcja="idz" data-arg="' + i + '" aria-label="Pytanie ' + (i + 1) + (egz.odp[id] ? ', odpowiedziano' : '') + '">' +
        (i + 1) + '</button>';
    });
    html += '</div>' +
      '<button type="button" class="zakoncz" data-akcja="zakoncz">Zakończ egzamin</button>' +
      (egz.podpowiedzi ? '<p class="maly">Egzamin z podpowiedziami – poprawne odpowiedzi są pokazywane od razu.</p>' : '') +
      '<p class="maly">Czas biegnie także po wyjściu do menu – egzamin możesz wznowić z ekranu startowego.</p>';

    function idz(i) {
      if (i < 0 || i >= n) return;
      egz.i = i;
      zapisz();
      ekranEgzamin();
    }
    function wybierz(litera) {
      if (zablokowane || p.litery.indexOf(litera) === -1) return;
      egz.odp[p.id] = litera;
      zapisz();
      ekranEgzamin(true);
    }

    pokaz(html, {
      bezPrzewijania: bezPrzewijania === true,
      klawisze: {
        litera: wybierz,
        enter: function () { if (egz.i < n - 1) idz(egz.i + 1); },
        lewo: function () { idz(egz.i - 1); },
        prawo: function () { idz(egz.i + 1); }
      },
      akcje: {
        odp: wybierz,
        poprzednie: function () { idz(egz.i - 1); },
        nastepne: function () { idz(egz.i + 1); },
        idz: function (arg) { idz(Number(arg)); },
        zakoncz: function () {
          var brak = n - odpowiedziano;
          var pytanie = brak
            ? 'Nie odpowiedziano na ' + brak + ' ' + odmiana(brak, 'pytanie', 'pytania', 'pytań') + '. Czy na pewno zakończyć egzamin?'
            : 'Czy na pewno zakończyć egzamin?';
          if (window.confirm(pytanie)) zakonczEgzamin(false);
        }
      }
    });

    var licznik = document.getElementById('licznik');
    function tik() {
      var zostalo = egz.koniec - Date.now();
      if (zostalo <= 0) { zakonczEgzamin(true); return; }
      licznik.textContent = '⏱ ' + fmtCzas(zostalo);
      licznik.classList.toggle('malo-czasu', zostalo < 5 * 60 * 1000);
    }
    tik();
    if (stan.egzamin) timer = setInterval(tik, 1000);
  }

  var ostatniWynik = null;

  function zakonczEgzamin(czasMinal) {
    var egz = stan.egzamin;
    if (!egz) return;
    var lista = egz.ids.filter(function (id) { return poId[id]; }).map(function (id) { return poId[id]; });
    var punkty = 0;
    var bledne = [];
    lista.forEach(function (p) {
      var o = egz.odp[p.id];
      if (o && zanotujOdpowiedz(p, o)) punkty++;
      else bledne.push({ p: p, wybrana: o || null });
    });
    var proc = procent(punkty, lista.length);
    var koniec = Math.min(Date.now(), egz.koniec);
    var wpis = {
      data: egz.start,
      punkty: punkty,
      liczba: lista.length,
      procent: Math.round(proc * 10) / 10,
      zdany: proc >= PROG_ZDANIA,
      czasMs: koniec - egz.start,
      podpowiedzi: !!egz.podpowiedzi
    };
    stan.egzaminy.push(wpis);
    if (stan.egzaminy.length > MAKS_HISTORIA) stan.egzaminy = stan.egzaminy.slice(-MAKS_HISTORIA);
    stan.egzamin = null;
    zapisz();
    ostatniWynik = { wpis: wpis, bledne: bledne, czasMinal: czasMinal };
    ekranWynikEgzaminu();
  }

  function ekranWynikEgzaminu() {
    var w = ostatniWynik.wpis;
    var html = '<section class="karta wynik ' + (w.zdany ? 'zdany' : 'niezdany') + '">' +
      (ostatniWynik.czasMinal ? '<p class="maly">Czas minął – egzamin zakończył się automatycznie.</p>' : '') +
      '<p class="werdykt-egzaminu">' + (w.zdany ? 'ZDANY' : 'NIEZDANY') + '</p>' +
      '<p class="duzy">' + w.punkty + ' / ' + w.liczba + ' pkt</p>' +
      '<p>' + fmtProcent(w.procent) + ' · próg zdania ' + PROG_ZDANIA + '% · czas ' + fmtCzas(w.czasMs) + '</p>' +
      '</section>' +
      '<div class="przyciski"><button type="button" class="glowny" data-akcja="nowy">Nowy egzamin</button>' +
      '<button type="button" class="drugorzedny" data-akcja="menu">Menu</button></div>';

    if (ostatniWynik.bledne.length) {
      html += '<h2>Błędne i pominięte odpowiedzi (' + ostatniWynik.bledne.length + ')</h2>' +
        '<p class="maly">Błędnie rozwiązane pytania trafiły do powtórki błędów.</p>';
      ostatniWynik.bledne.forEach(function (b) {
        var p = b.p;
        html += '<article class="karta przeglad">' +
          '<p class="dzial-etykieta">' + h(p.dzial) + '</p>' +
          '<h3>' + h(p.pytanie) + '</h3>' +
          '<p class="twoja">Twoja odpowiedź: ' + (b.wybrana
            ? '<strong>' + b.wybrana + '.</strong> ' + h(p.odpowiedzi[b.wybrana])
            : '<em>brak odpowiedzi</em>') + '</p>' +
          '<p class="poprawna-odp">Poprawna: <strong>' + p.poprawna + '.</strong> ' + h(p.odpowiedzi[p.poprawna]) + '</p>' +
          (p.wyjasnienie ? '<p>' + h(p.wyjasnienie) + '</p>' : '') +
          (p.zrodlo ? '<p class="zrodlo">Źródło: ' + h(p.zrodlo) + '</p>' : '') +
          '</article>';
      });
    } else {
      html += '<p class="karta">Wszystkie odpowiedzi poprawne – świetna robota!</p>';
    }

    pokaz(html, {
      klawisze: { enter: doMenu },
      akcje: { nowy: rozpocznijEgzamin }
    });
  }

  // ---------- Statystyki ----------

  function ekranStatystyki() {
    var s = podsumowanie(pytania);
    var html = '<h1>Statystyki</h1>' +
      '<section class="karta"><div class="liczby">' +
        '<div><strong>' + s.odpowiedzi + '</strong><span>odpowiedzi łącznie</span></div>' +
        '<div><strong>' + (s.odpowiedzi ? fmtProcent(procent(s.ok, s.odpowiedzi)) : '–') + '</strong><span>poprawnych</span></div>' +
        '<div><strong>' + idsDoPowtorki().length + '</strong><span>do powtórki</span></div>' +
      '</div></section>' +
      '<h2>Działy</h2><div class="karta">';

    dzialy.forEach(function (d) {
      var ds = podsumowanie(pytania.filter(function (p) { return p.dzial === d; }));
      var proc = procent(ds.ok, ds.odpowiedzi);
      html += '<div class="stat-dzial">' +
        '<div class="stat-naglowek"><span>' + h(d) + '</span><strong>' + (ds.odpowiedzi ? fmtProcent(proc) : '–') + '</strong></div>' +
        pasek(ds.odpowiedzi ? proc : 0, ds.odpowiedzi ? (proc >= PROG_ZDANIA ? 'ok' : 'slabo') : '') +
        '<p class="maly">' + (ds.odpowiedzi
          ? ds.ok + ' z ' + ds.odpowiedzi + ' odpowiedzi poprawnych · przerobione pytania: ' + ds.przerobione + ' z ' + ds.wszystkie
          : 'Brak odpowiedzi – ' + ds.wszystkie + ' ' + odmiana(ds.wszystkie, 'pytanie', 'pytania', 'pytań') + ' do przerobienia') +
        '</p></div>';
    });
    html += '</div><h2>Historia egzaminów próbnych</h2>';

    if (stan.egzaminy.length) {
      html += '<ol class="historia" reversed>';
      stan.egzaminy.slice().reverse().forEach(function (e) {
        html += '<li><span>' + h(fmtData(e.data)) + '</span>' +
          '<span>' + h(e.punkty) + '/' + h(e.liczba) + ' · ' + fmtProcent(Number(e.procent) || 0) + '</span>' +
          '<span class="odznaka ' + (e.zdany ? 'ok' : 'blad') + '">' + (e.zdany ? 'ZDANY' : 'NIEZDANY') + '</span>' +
          (e.podpowiedzi ? '<span class="maly">z podpowiedziami</span>' : '') + '</li>';
      });
      html += '</ol>';
    } else {
      html += '<p class="karta maly">Nie rozwiązano jeszcze żadnego egzaminu próbnego.</p>';
    }

    html += '<div class="przyciski"><button type="button" class="drugorzedny" data-akcja="menu">← Menu</button>' +
      '<button type="button" class="niebezpieczny" data-akcja="wyzeruj">Wyzeruj postępy</button></div>';

    pokaz(html, {
      akcje: {
        wyzeruj: function () {
          if (!window.confirm('Czy na pewno usunąć wszystkie postępy, błędy do powtórki i historię egzaminów? Tego nie da się cofnąć.')) return;
          stan = pustyStan();
          zapisz();
          ekranStatystyki();
        }
      }
    });
  }

  // ---------- Start ----------

  if (!pytania.length) {
    app.innerHTML = '<p class="uwaga">Nie znaleziono żadnych pytań. Sprawdź, czy obok index.html leży plik pytania-przyklad.js lub pytania.js.</p>';
    return;
  }
  ekranStart();
})();

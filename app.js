// =====================================================================
//  Instagram-Planer für den fiktiven Handwerksbetrieb "Holzwerk Berger"
//  TESTVERSION: Es wird NICHTS an Instagram gesendet.
// =====================================================================


// ---------------------------------------------------------------------
// 0. Einstellungen zum Betrieb
// ---------------------------------------------------------------------
const FIRMA = {
  name: "Holzwerk Berger",
  instagramName: "holzwerk_berger",
  ort: "Musterstadt",
  emoji: "🪚",
};

// Unter diesem Namen speichert der Browser unsere Beiträge.
const SPEICHER_SCHLUESSEL = "holzwerk-instagram-beitraege";

const STATUS_TEXTE = {
  entwurf: "Entwurf",
  geplant: "Geplant",
  veroeffentlicht: "Veröffentlicht (Test)",
};


// ---------------------------------------------------------------------
// 1. Hilfsfunktionen für Datum und Text
// ---------------------------------------------------------------------

// Wandelt ein Date-Objekt in "2026-10-14" um (so speichern wir Datumswerte).
function datumAlsText(datum) {
  const jahr = datum.getFullYear();
  const monat = String(datum.getMonth() + 1).padStart(2, "0");
  const tag = String(datum.getDate()).padStart(2, "0");
  return `${jahr}-${monat}-${tag}`;
}

// Gibt das Datum in "anzahl" Tagen zurück (negativ = Vergangenheit).
function tageAbHeute(anzahl) {
  const datum = new Date();
  datum.setDate(datum.getDate() + anzahl);
  return datumAlsText(datum);
}

// "2026-10-14" -> "14.10.2026"
function datumDeutsch(text) {
  const [jahr, monat, tag] = text.split("-");
  return `${tag}.${monat}.${jahr}`;
}

// Schützt vor kaputtem HTML, wenn jemand z. B. "<" in einen Text schreibt.
function sicher(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

// Zeitpunkt eines Beitrags als Date-Objekt (für Vergleiche).
function zeitpunkt(beitrag) {
  return new Date(`${beitrag.datum}T${beitrag.uhrzeit || "00:00"}`);
}


// ---------------------------------------------------------------------
// 2. Daten laden und speichern (im Browser, per localStorage)
// ---------------------------------------------------------------------

function beispielBeitraege() {
  return [
    {
      id: "b1",
      titel: "Küche Familie Schmidt",
      datum: tageAbHeute(-2),
      uhrzeit: "18:00",
      text: "Frisch aus der Werkstatt! 🔨\nDiese Einbauküche aus massiver Eiche haben wir für Familie Schmidt gebaut – vom ersten Entwurf bis zur Montage.",
      hashtags: "#handwerk #tischlerei #eiche #küche #musterstadt",
      status: "veroeffentlicht",
      bild: "",
    },
    {
      id: "b2",
      titel: "Tipp: Holz pflegen",
      datum: tageAbHeute(1),
      uhrzeit: "17:30",
      text: "Tipp vom Profi 💡\nGeölte Holzoberflächen freuen sich einmal im Jahr über eine Auffrischung. So bleibt dein Tisch lange schön!",
      hashtags: "#holzpflege #tischlerei #handwerkstipp",
      status: "geplant",
      bild: "",
    },
    {
      id: "b3",
      titel: "Azubi gesucht",
      datum: tageAbHeute(4),
      uhrzeit: "12:00",
      text: "Wir suchen Verstärkung! 🙌\nDu arbeitest gern mit den Händen und liebst Holz? Bewirb dich für eine Ausbildung zum Tischler (m/w/d).",
      hashtags: "#ausbildung #tischler #azubi #handwerk",
      status: "entwurf",
      bild: "",
    },
    {
      id: "b4",
      titel: "Herbstaktion Gartenmöbel",
      datum: tageAbHeute(8),
      uhrzeit: "19:00",
      text: "Herbstaktion 🍂\nLass deine Gartenmöbel jetzt bei uns aufarbeiten – im Frühjahr stehen sie wie neu auf der Terrasse.",
      hashtags: "#herbst #gartenmöbel #restaurierung #handwerk",
      status: "geplant",
      bild: "",
    },
  ];
}

function ladeBeitraege() {
  const gespeichert = localStorage.getItem(SPEICHER_SCHLUESSEL);
  if (gespeichert === null) {
    return beispielBeitraege(); // erster Start: Beispieldaten zeigen
  }
  try {
    return JSON.parse(gespeichert);
  } catch {
    return beispielBeitraege();
  }
}

function speichereBeitraege() {
  try {
    localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(beitraege));
  } catch {
    alert("Speichern hat nicht geklappt – vermutlich sind die Bilder zu groß für den Browser-Speicher.");
  }
}

// Unsere zentrale Liste aller Beiträge.
let beitraege = ladeBeitraege();


// ---------------------------------------------------------------------
// 3. Navigation zwischen den vier Bereichen (Tabs)
// ---------------------------------------------------------------------

function zeigeTab(name) {
  document.querySelectorAll(".tab").forEach((bereich) => {
    bereich.hidden = bereich.id !== name;
  });
  document.querySelectorAll("nav button").forEach((knopf) => {
    knopf.classList.toggle("aktiv", knopf.dataset.tab === name);
  });
  zeichneAlles();
}

document.querySelectorAll("nav button").forEach((knopf) => {
  knopf.addEventListener("click", () => zeigeTab(knopf.dataset.tab));
});

// Zeichnet alle Bereiche neu, nachdem sich Daten geändert haben.
function zeichneAlles() {
  zeichneListe();
  zeichneVorschauAuswahl();
  zeichneVorschau();
  zeichneKalender();
}


// ---------------------------------------------------------------------
// 4. Übersicht: Tabelle mit allen Beiträgen
// ---------------------------------------------------------------------

function sortierteBeitraege() {
  return [...beitraege].sort((a, b) => zeitpunkt(a) - zeitpunkt(b));
}

function zeichneListe() {
  const tbody = document.getElementById("beitrags-liste");
  const liste = sortierteBeitraege();

  document.getElementById("leer-hinweis").hidden = liste.length > 0;

  tbody.innerHTML = liste.map((b) => `
    <tr>
      <td>${datumDeutsch(b.datum)}</td>
      <td>${sicher(b.uhrzeit)}</td>
      <td>${sicher(b.titel)}</td>
      <td><span class="status ${b.status}">${STATUS_TEXTE[b.status]}</span></td>
      <td class="aktionen">
        <button class="klein zweitrangig" data-aktion="vorschau" data-id="${b.id}">👁 Vorschau</button>
        <button class="klein zweitrangig" data-aktion="bearbeiten" data-id="${b.id}">✏️</button>
        ${b.status !== "veroeffentlicht"
          ? `<button class="klein" data-aktion="veroeffentlichen" data-id="${b.id}">🚀 Test-Post</button>`
          : ""}
        <button class="klein gefahr" data-aktion="loeschen" data-id="${b.id}">🗑</button>
      </td>
    </tr>
  `).join("");
}

// Ein einziger Klick-Empfänger für alle Knöpfe in der Tabelle.
document.getElementById("beitrags-liste").addEventListener("click", (ereignis) => {
  const knopf = ereignis.target.closest("button");
  if (!knopf) return;

  const beitrag = beitraege.find((b) => b.id === knopf.dataset.id);
  if (!beitrag) return;

  switch (knopf.dataset.aktion) {
    case "vorschau":
      zeigeVorschauVon(beitrag.id);
      break;
    case "bearbeiten":
      oeffneFormular(beitrag);
      break;
    case "veroeffentlichen":
      simuliereVeroeffentlichung(beitrag, "manuell");
      break;
    case "loeschen":
      if (confirm(`Beitrag „${beitrag.titel}“ wirklich löschen?`)) {
        beitraege = beitraege.filter((b) => b.id !== beitrag.id);
        speichereBeitraege();
        zeichneAlles();
      }
      break;
  }
});

document.getElementById("btn-neuer-beitrag").addEventListener("click", () => {
  oeffneFormular({ datum: tageAbHeute(1), uhrzeit: "18:00", status: "entwurf" });
});

document.getElementById("btn-zuruecksetzen").addEventListener("click", () => {
  if (confirm("Alle eigenen Beiträge löschen und die Beispieldaten laden?")) {
    beitraege = beispielBeitraege();
    speichereBeitraege();
    zeichneAlles();
  }
});


// ---------------------------------------------------------------------
// 5. Formular (Pop-up) zum Anlegen und Bearbeiten
// ---------------------------------------------------------------------

const dialog = document.getElementById("beitrag-dialog");
const formular = document.getElementById("beitrag-formular");
const bildVorschau = document.getElementById("feld-bild-vorschau");
let aktuellesBild = ""; // Bild als Text (Data-URL), damit wir es speichern können

function oeffneFormular(beitrag) {
  formular.reset();
  document.getElementById("dialog-titel").textContent = beitrag.id ? "Beitrag bearbeiten" : "Neuer Beitrag";
  document.getElementById("feld-id").value = beitrag.id || "";
  document.getElementById("feld-titel").value = beitrag.titel || "";
  document.getElementById("feld-datum").value = beitrag.datum || tageAbHeute(1);
  document.getElementById("feld-uhrzeit").value = beitrag.uhrzeit || "18:00";
  document.getElementById("feld-text").value = beitrag.text || "";
  document.getElementById("feld-hashtags").value = beitrag.hashtags || "";
  document.getElementById("feld-status").value = beitrag.status || "entwurf";

  aktuellesBild = beitrag.bild || "";
  bildVorschau.src = aktuellesBild;
  bildVorschau.hidden = !aktuellesBild;

  dialog.showModal();
}

document.getElementById("btn-abbrechen").addEventListener("click", () => dialog.close());

// Bild auswählen -> verkleinern, damit der Browser-Speicher nicht voll läuft.
document.getElementById("feld-bild").addEventListener("change", (ereignis) => {
  const datei = ereignis.target.files[0];
  if (!datei) return;
  verkleinereBild(datei, (ergebnis) => {
    aktuellesBild = ergebnis;
    bildVorschau.src = ergebnis;
    bildVorschau.hidden = false;
  });
});

function verkleinereBild(datei, fertig) {
  const leser = new FileReader();
  leser.onload = () => {
    const bild = new Image();
    bild.onload = () => {
      const maxGroesse = 800; // Pixel
      const faktor = Math.min(1, maxGroesse / Math.max(bild.width, bild.height));
      const leinwand = document.createElement("canvas");
      leinwand.width = Math.round(bild.width * faktor);
      leinwand.height = Math.round(bild.height * faktor);
      leinwand.getContext("2d").drawImage(bild, 0, 0, leinwand.width, leinwand.height);
      fertig(leinwand.toDataURL("image/jpeg", 0.8));
    };
    bild.src = leser.result;
  };
  leser.readAsDataURL(datei);
}

formular.addEventListener("submit", (ereignis) => {
  ereignis.preventDefault(); // Seite nicht neu laden

  const daten = {
    id: document.getElementById("feld-id").value || String(Date.now()),
    titel: document.getElementById("feld-titel").value.trim(),
    datum: document.getElementById("feld-datum").value,
    uhrzeit: document.getElementById("feld-uhrzeit").value,
    text: document.getElementById("feld-text").value,
    hashtags: document.getElementById("feld-hashtags").value.trim(),
    status: document.getElementById("feld-status").value,
    bild: aktuellesBild,
  };

  const position = beitraege.findIndex((b) => b.id === daten.id);
  if (position >= 0) {
    beitraege[position] = daten; // vorhandenen Beitrag ersetzen
  } else {
    beitraege.push(daten); // neuen Beitrag hinzufügen
  }

  speichereBeitraege();
  dialog.close();
  zeichneAlles();
});


// ---------------------------------------------------------------------
// 6. Werbetexte erzeugen (aus Textbausteinen, ohne KI)
// ---------------------------------------------------------------------

function zufaellig(liste) {
  return liste[Math.floor(Math.random() * liste.length)];
}

const EINLEITUNGEN = {
  freundlich: ["Schön, dass du vorbeischaust! 😊", "Heute möchten wir dir etwas zeigen: ✨", "Wir freuen uns riesig! 🥰"],
  professionell: ["Qualität aus Meisterhand.", "Aus unserer Werkstatt:", "Handwerk, auf das Sie sich verlassen können."],
  locker: ["Na, schon gesehen? 👀", "Frisch aus der Werkstatt! 🔨", "Achtung, Holz-Alarm! 🪵"],
};

// Für jeden Anlass eine Funktion, die den Hauptteil des Textes baut.
const HAUPTTEILE = {
  projekt: (leistung, ort) => zufaellig([
    `Gerade fertig geworden: ${leistung} für Kunden in ${ort}. Vom ersten Entwurf bis zur Montage alles aus einer Hand.`,
    `Unser neuestes Projekt: ${leistung} – geplant, gefertigt und eingebaut von unserem Team in ${ort}.`,
  ]),
  angebot: (leistung, ort) => zufaellig([
    `Jetzt zugreifen: Unsere Aktion für ${leistung} in ${ort} und Umgebung.`,
    `Nur für kurze Zeit: ${leistung} zu besonderen Konditionen.`,
  ]),
  tipp: (leistung) => zufaellig([
    `Tipp vom Profi 💡 Damit du lange Freude an deiner ${leistung} hast, reinige sie nur mit einem leicht feuchten Tuch und ohne scharfe Mittel.`,
    `Wusstest du schon? Bei ${leistung} lohnt sich regelmäßige Pflege – einmal im Jahr nachölen wirkt Wunder.`,
  ]),
  team: (leistung, ort) => zufaellig([
    `Hinter jeder ${leistung} steckt unser starkes Team in ${ort}. Und wir suchen Verstärkung – auch Azubis (m/w/d)!`,
    `Das sind die Hände hinter unseren Projekten 🙌 Lust, Teil des Teams in ${ort} zu werden?`,
  ]),
  saison: (leistung) => zufaellig([
    `Die perfekte Jahreszeit für ${leistung}! Jetzt planen, bevor der Kalender voll ist. 🍂`,
    `Die Saison startet – und mit ihr die Nachfrage nach ${leistung}. Sichere dir rechtzeitig einen Termin.`,
  ]),
};

const AUFRUFE = {
  freundlich: ["Schreib uns gern eine Nachricht – wir beraten dich persönlich! 💬", "Wir freuen uns auf deine Anfrage! 📩"],
  professionell: ["Vereinbaren Sie jetzt einen unverbindlichen Beratungstermin.", "Kontaktieren Sie uns für ein individuelles Angebot."],
  locker: ["Schreib uns 'ne DM! 📲", "Link in der Bio – meld dich! 👆"],
};

const HASHTAGS_JE_ANLASS = {
  projekt: ["#projekt", "#maßanfertigung", "#vorhernachher"],
  angebot: ["#angebot", "#aktion", "#sparen"],
  tipp: ["#handwerkstipp", "#holzpflege", "#diy"],
  team: ["#ausbildung", "#azubi", "#teamwork"],
  saison: ["#saison", "#jetztplanen", "#zuhause"],
};

// Macht aus "Musterstadt Nord" den Hashtag "#musterstadtnord".
function alsHashtag(text) {
  return "#" + text.toLowerCase().replace(/[^a-z0-9äöüß]/g, "");
}

function erzeugeWerbetext() {
  const anlass = document.getElementById("gen-anlass").value;
  const leistung = document.getElementById("gen-leistung").value.trim() || "Maßarbeit aus Holz";
  const ort = document.getElementById("gen-ort").value.trim() || FIRMA.ort;
  const besonderheit = document.getElementById("gen-besonderheit").value.trim();
  const ton = document.getElementById("gen-ton").value;

  const teile = [
    zufaellig(EINLEITUNGEN[ton]),
    HAUPTTEILE[anlass](leistung, ort),
  ];
  if (besonderheit) teile.push(`👉 ${besonderheit}`);
  teile.push(zufaellig(AUFRUFE[ton]));
  teile.push(`${FIRMA.name} · ${ort}`);

  const hashtags = [
    "#handwerk", "#tischlerei", "#meisterbetrieb",
    alsHashtag(ort), alsHashtag(leistung.split(" ")[0]),
    ...HASHTAGS_JE_ANLASS[anlass],
  ];

  document.getElementById("gen-text").value = teile.join("\n\n");
  document.getElementById("gen-hashtags").value = [...new Set(hashtags)].join(" ");
  aktualisiereZaehler();
}

// Zeigt an, ob die Instagram-Grenzen eingehalten werden.
function aktualisiereZaehler() {
  const text = document.getElementById("gen-text").value;
  const hashtags = document.getElementById("gen-hashtags").value;
  const anzahlZeichen = text.length + (hashtags ? hashtags.length + 2 : 0);
  const anzahlHashtags = (hashtags.match(/#/g) || []).length;

  const zeichen = document.getElementById("gen-zeichen");
  zeichen.textContent = anzahlZeichen;
  zeichen.parentElement.classList.toggle("zu-viel", anzahlZeichen > 2200);

  const tags = document.getElementById("gen-hashtag-anzahl");
  tags.textContent = anzahlHashtags;
  tags.parentElement.classList.toggle("zu-viel", anzahlHashtags > 30);
}

document.getElementById("text-generator").addEventListener("submit", (ereignis) => {
  ereignis.preventDefault();
  erzeugeWerbetext();
});
document.getElementById("gen-text").addEventListener("input", aktualisiereZaehler);
document.getElementById("gen-hashtags").addEventListener("input", aktualisiereZaehler);

document.getElementById("btn-kopieren").addEventListener("click", async () => {
  const komplett = document.getElementById("gen-text").value + "\n\n" + document.getElementById("gen-hashtags").value;
  try {
    await navigator.clipboard.writeText(komplett);
    alert("Text wurde in die Zwischenablage kopiert.");
  } catch {
    alert("Kopieren hat nicht geklappt – markiere den Text bitte von Hand.");
  }
});

document.getElementById("btn-uebernehmen").addEventListener("click", () => {
  const anlassFeld = document.getElementById("gen-anlass");
  oeffneFormular({
    titel: anlassFeld.options[anlassFeld.selectedIndex].text,
    datum: tageAbHeute(1),
    uhrzeit: "18:00",
    text: document.getElementById("gen-text").value,
    hashtags: document.getElementById("gen-hashtags").value,
    status: "entwurf",
  });
});


// ---------------------------------------------------------------------
// 7. Vorschau im Instagram-Look
// ---------------------------------------------------------------------

let vorschauId = null; // welcher Beitrag gerade in der Vorschau ist

function zeichneVorschauAuswahl() {
  const auswahl = document.getElementById("vorschau-auswahl");
  const liste = sortierteBeitraege();

  if (!liste.some((b) => b.id === vorschauId)) {
    vorschauId = liste.length ? liste[0].id : null;
  }

  auswahl.innerHTML = liste.map((b) => `
    <option value="${b.id}" ${b.id === vorschauId ? "selected" : ""}>
      ${datumDeutsch(b.datum)} – ${sicher(b.titel)}
    </option>
  `).join("");
}

document.getElementById("vorschau-auswahl").addEventListener("change", (ereignis) => {
  vorschauId = ereignis.target.value;
  zeichneVorschau();
});

function zeigeVorschauVon(id) {
  vorschauId = id;
  zeigeTab("vorschau");
}

function zeichneVorschau() {
  const bereich = document.getElementById("vorschau-bereich");
  const b = beitraege.find((x) => x.id === vorschauId);

  if (!b) {
    bereich.innerHTML = `<p class="leer">Kein Beitrag vorhanden.</p>`;
    return;
  }

  const bildHtml = b.bild
    ? `<img class="insta-bild" src="${b.bild}" alt="">`
    : `<div class="insta-platzhalter">
         <div class="gross">${FIRMA.emoji}</div>
         <div class="titel">${sicher(b.titel)}</div>
         <small>(Platzhalter – lade im Formular ein Bild hoch)</small>
       </div>`;

  // Zeilenumbrüche im Text sollen auch in der Vorschau sichtbar sein.
  const textHtml = sicher(b.text).replace(/\n/g, "<br>");

  bereich.innerHTML = `
    <article class="insta">
      <div class="insta-kopf">
        <div class="insta-avatar"><span>${FIRMA.emoji}</span></div>
        <div>
          <div class="insta-name">${FIRMA.instagramName}</div>
          <div class="insta-ort">${FIRMA.ort}</div>
        </div>
        <div style="margin-left:auto">•••</div>
      </div>
      ${bildHtml}
      <div class="insta-symbole">
        <span>♡</span><span>💬</span><span>➤</span><span class="rechts">🔖</span>
      </div>
      <div class="insta-text"><strong>Gefällt 0 Mal</strong></div>
      <div class="insta-text">
        <strong>${FIRMA.instagramName}</strong> ${textHtml}
        <br><span class="insta-hashtags">${sicher(b.hashtags)}</span>
      </div>
      <div class="insta-datum">
        ${datumDeutsch(b.datum)} · ${sicher(b.uhrzeit)} Uhr ·
        <span class="status ${b.status}">${STATUS_TEXTE[b.status]}</span>
      </div>
    </article>
  `;
}


// ---------------------------------------------------------------------
// 8. Kalender (Monatsansicht)
// ---------------------------------------------------------------------

let kalenderMonat = new Date();
kalenderMonat.setDate(1);

const MONATSNAMEN = ["Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"];

function zeichneKalender() {
  const jahr = kalenderMonat.getFullYear();
  const monat = kalenderMonat.getMonth();
  document.getElementById("monat-titel").textContent = `${MONATSNAMEN[monat]} ${jahr}`;

  const raster = document.getElementById("kalender-raster");
  let html = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
    .map((t) => `<div class="wochentag">${t}</div>`).join("");

  // In JavaScript ist Sonntag = 0. Wir wollen, dass die Woche mit Montag beginnt.
  const ersterWochentag = (new Date(jahr, monat, 1).getDay() + 6) % 7;
  const tageImMonat = new Date(jahr, monat + 1, 0).getDate();
  const heute = datumAlsText(new Date());

  for (let i = 0; i < ersterWochentag; i++) {
    html += `<div class="tag leer-tag"></div>`;
  }

  for (let tag = 1; tag <= tageImMonat; tag++) {
    const datum = datumAlsText(new Date(jahr, monat, tag));
    const posts = sortierteBeitraege().filter((b) => b.datum === datum);

    html += `
      <div class="tag ${datum === heute ? "heute" : ""}" data-datum="${datum}">
        <div class="tag-nummer">${tag}</div>
        ${posts.map((b) => `
          <span class="chip ${b.status}" data-id="${b.id}" title="${sicher(b.titel)}">
            ${sicher(b.uhrzeit)} ${sicher(b.titel)}
          </span>`).join("")}
      </div>`;
  }

  raster.innerHTML = html;
}

document.getElementById("kalender-raster").addEventListener("click", (ereignis) => {
  const chip = ereignis.target.closest(".chip");
  if (chip) {
    zeigeVorschauVon(chip.dataset.id); // Klick auf Beitrag -> Vorschau
    return;
  }
  const tag = ereignis.target.closest(".tag[data-datum]");
  if (tag) {
    oeffneFormular({ datum: tag.dataset.datum, uhrzeit: "18:00", status: "entwurf" }); // Klick auf Tag -> neuer Beitrag
  }
});

document.getElementById("monat-zurueck").addEventListener("click", () => {
  kalenderMonat.setMonth(kalenderMonat.getMonth() - 1);
  zeichneKalender();
});
document.getElementById("monat-vor").addEventListener("click", () => {
  kalenderMonat.setMonth(kalenderMonat.getMonth() + 1);
  zeichneKalender();
});


// ---------------------------------------------------------------------
// 9. SIMULIERTE Veröffentlichung + Automatisierung
//    Später ersetzt du simuliereVeroeffentlichung() durch einen echten
//    Aufruf der offiziellen Instagram-API (siehe README.md).
// ---------------------------------------------------------------------

function protokolliere(nachricht) {
  const eintrag = document.createElement("li");
  eintrag.textContent = `[${new Date().toLocaleTimeString("de-DE")}] ${nachricht}`;
  document.getElementById("protokoll").prepend(eintrag);
  console.log(nachricht); // auch in der Browser-Konsole (F12) sichtbar
}

function simuliereVeroeffentlichung(beitrag, ausloeser) {
  // HIER würde später der echte API-Aufruf stehen.
  // Jetzt ändern wir nur den Status – es wird NICHTS an Instagram gesendet.
  beitrag.status = "veroeffentlicht";
  speichereBeitraege();
  protokolliere(`TEST: „${beitrag.titel}“ wäre jetzt veröffentlicht worden (${ausloeser}).`);
  zeichneAlles();
}

// Prüft, ob geplante Beiträge "fällig" sind – das ist der Kern der Automatisierung.
function pruefeFaelligeBeitraege() {
  const jetzt = new Date();
  beitraege
    .filter((b) => b.status === "geplant" && zeitpunkt(b) <= jetzt)
    .forEach((b) => simuliereVeroeffentlichung(b, "automatisch"));
}


// ---------------------------------------------------------------------
// 10. Start
// ---------------------------------------------------------------------
speichereBeitraege();
zeichneAlles();
erzeugeWerbetext();
protokolliere("Planer gestartet. Prüfe alle 30 Sekunden auf fällige Beiträge.");
pruefeFaelligeBeitraege();
setInterval(pruefeFaelligeBeitraege, 30 * 1000);

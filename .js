// ===== Récupération des éléments de la page =====
const montant = document.getElementById("montant");
const de = document.getElementById("de");
const vers = document.getElementById("vers");
const resultat = document.getElementById("resultat");
const unitaire = document.getElementById("unitaire");
const info = document.getElementById("info");
const inverser = document.getElementById("inverser");
const copier = document.getElementById("copier");
const historique = document.getElementById("historique");
const liste = document.getElementById("liste");
const paire = document.getElementById("paire");
const prix = document.getElementById("prix");
const variation = document.getElementById("variation");
const canvas = document.getElementById("graphique");
const ctx = canvas.getContext("2d");
const infoGraphique = document.getElementById("info-graphique");
const choixMonnaies = document.getElementById("choix-monnaies");
const boutonsPeriode = document.querySelectorAll(".periodes button");
const boutonsMode = document.querySelectorAll(".modes button");
const types = document.getElementById("types");
const boutonsType = document.querySelectorAll(".types button");
const boutonsRapides = document.querySelectorAll(".rapides button");
const frais = document.getElementById("frais");
const apresFrais = document.getElementById("apres-frais");
const defilement = document.getElementById("defilement");

// Couleurs du graphique (les mêmes que dans style.css)
const VERT = "#00f5d4";
const ROUGE = "#ff4d6d";
const GRILLE = "#2a2e39";
const TEXTE = "#787b86";

// Les devises proposées : drapeau, nom, couleur de sa courbe, et un taux de secours (pour 1 €)
// utilisé si internet ne marche pas. Les taux de secours datent du 19/11/2026 : ils sont approximatifs.
// bce: false = la Banque centrale européenne ne la suit pas, donc pas de graphique pour elle.
const DEVISES = {
  EUR: { drapeau: "🇪🇺", nom: "Euro", couleur: "#3d8bff", secours: 1, bce: true },
  USD: { drapeau: "🇺🇸", nom: "Dollar américain", couleur: "#00f5d4", secours: 1.0974, bce: true },
  GBP: { drapeau: "🇬🇧", nom: "Livre sterling", couleur: "#c77dff", secours: 0.834, bce: true },
  CHF: { drapeau: "🇨🇭", nom: "Franc suisse", couleur: "#ff4d6d", secours: 0.9249, bce: true },
  JPY: { drapeau: "🇯🇵", nom: "Yen", couleur: "#ffbe0b", secours: 174.89, bce: true },
  CAD: { drapeau: "🇨🇦", nom: "Dollar canadien", couleur: "#ff006e", secours: 1.5717, bce: true },
  AUD: { drapeau: "🇦🇺", nom: "Dollar australien", couleur: "#00bbf9", secours: 1.6329, bce: true },
  CNY: { drapeau: "🇨🇳", nom: "Yuan", couleur: "#fee440", secours: 7.3281, bce: true },
  SEK: { drapeau: "🇸🇪", nom: "Couronne suédoise", couleur: "#9ef01a", secours: 11.154, bce: true },
  NOK: { drapeau: "🇳🇴", nom: "Couronne norvégienne", couleur: "#ff9e00", secours: 10.633, bce: true },
  PLN: { drapeau: "🇵🇱", nom: "Zloty", couleur: "#e0aaff", secours: 4.412, bce: true },
  TRY: { drapeau: "🇹🇷", nom: "Livre turque", couleur: "#ff5400", secours: 55.39, bce: true },
  INR: { drapeau: "🇮🇳", nom: "Roupie indienne", couleur: "#fb5607", secours: 102.5, bce: true },
  BRL: { drapeau: "🇧🇷", nom: "Réal brésilien", couleur: "#38b000", secours: 6.3634, bce: true },
  MXN: { drapeau: "🇲🇽", nom: "Peso mexicain", couleur: "#06d6a0", secours: 20.546, bce: true },
  KRW: { drapeau: "🇰🇷", nom: "Won", couleur: "#4361ee", secours: 1461.5, bce: true },
  MAD: { drapeau: "🇲🇦", nom: "Dirham marocain", couleur: "#c62828", secours: 10.934, bce: false },
  TND: { drapeau: "🇹🇳", nom: "Dinar tunisien", couleur: "#d32f2f", secours: 3.3506, bce: false },
  DZD: { drapeau: "🇩🇿", nom: "Dinar algérien", couleur: "#388e3c", secours: 150.54, bce: false },
  XOF: { drapeau: "🌍", nom: "Franc CFA", couleur: "#fbc02d", secours: 655.957, bce: false },
};

// Au départ on utilise les taux de secours, ils seront remplacés par les vrais dès qu'ils arrivent
const taux = {};
for (const code in DEVISES) taux[code] = DEVISES[code].secours;

const conversions = []; // historique en mémoire seulement : il disparaît quand on ferme la page
let jours = 30;         // période affichée sur le graphique
let mode = "paire";     // "paire" = une courbe De/Vers ; "monnaies" = plusieurs monnaies en %
let typeGraphique = "ligne"; // "ligne" ou "bougies" (mode "paire" seulement)
let progression = 1;    // animation d'apparition du graphique : de 0 (rien) à 1 (tout)
const choisies = new Set(["USD", "GBP", "JPY", "CHF"]); // monnaies affichées en mode "monnaies"

// Ce que le graphique dessine :
let dates = [];   // ex : ["2026-10-20", "2026-10-21", ...]
let courbes = []; // ex : [{ nom: "USD", couleur: "#00f5d4", valeurs: [1.12, 1.13, ...] }]

// Remplit les deux listes déroulantes, ex : "🇪🇺 EUR — Euro"
for (const code in DEVISES) {
  const texte = DEVISES[code].drapeau + " " + code + " — " + DEVISES[code].nom;
  de.add(new Option(texte, code));
  vers.add(new Option(texte, code));
}
de.value = "EUR";
vers.value = "USD";

// ===== Petits outils =====

// Le calcul : on passe par l'euro (montant → EUR → devise cible)
function calculer(valeur, tauxDe, tauxVers) {
  return (valeur / tauxDe) * tauxVers;
}
console.assert(calculer(100, 2, 4) === 200, "le calcul de conversion est faux");

// Relance une animation CSS sur un élément (enlever puis remettre la classe ne suffit pas :
// il faut forcer le navigateur à recalculer la page entre les deux, c'est le rôle de offsetWidth)
function rejouer(element, classe) {
  element.classList.remove(classe);
  void element.offsetWidth;
  element.classList.add(classe);
}

// "100,00 €"
function formater(n, devise) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: devise });
}

// "1,0974"
function nombre(n) {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 4 });
}

// "+0,52 %"
function signe(p) {
  return (p >= 0 ? "+" : "") + p.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " %";
}

// La variation en pourcentage entre deux valeurs, ex : pourcentage(100, 105) → "+5 %"
function pourcentage(avant, apres) {
  return signe(((apres - avant) / avant) * 100);
}

// Date d'il y a N jours au format "2026-10-20" (celui que demande l'API)
function ilYa(n) {
  return new Date(Date.now() - n * 24 * 3600 * 1000).toISOString().slice(0, 10);
}

// Demande des taux historiques à la BCE (via Frankfurter). Renvoie { "2026-10-20": { USD: 1.12, ... }, ... }
async function historiqueBCE(depuis, base, cible) {
  let url = "https://api.frankfurter.dev/v1/" + depuis + "..?from=" + base;
  if (cible) url += "&to=" + cible;
  const reponse = await fetch(url, { referrerPolicy: "no-referrer" });
  if (!reponse.ok) throw new Error("devise non suivie par la BCE");
  const donnees = await reponse.json();
  return donnees.rates;
}

// ===== Taux du jour =====

async function chargerTaux() {
  try {
    const reponse = await fetch("https://open.er-api.com/v6/latest/EUR", { referrerPolicy: "no-referrer" });
    const donnees = await reponse.json();
    if (donnees.result !== "success") throw new Error("réponse invalide");

    // Sécurité : on ne garde que nos devises, et seulement si le taux est un vrai nombre positif
    for (const code in DEVISES) {
      const t = donnees.rates[code];
      if (typeof t === "number" && t > 0) taux[code] = t;
    }
    info.textContent = "Taux du " + new Date(donnees.time_last_update_utc).toLocaleString("fr-FR");
  } catch (erreur) {
    info.textContent = "Hors ligne : taux approximatifs du 19/11/2026.";
  }
  convertir();
  chargerListe();
}

// ===== Convertisseur =====

function convertir() {
  const tauxUnitaire = calculer(1, taux[de.value], taux[vers.value]);
  unitaire.textContent = "1 " + de.value + " = " + nombre(tauxUnitaire) + " " + vers.value;
  if (mode === "paire") {
    paire.textContent = de.value + "/" + vers.value;
    prix.textContent = nombre(tauxUnitaire);
  }

  const valeur = Number(montant.value);
  if (!Number.isFinite(valeur) || valeur < 0 || valeur > 1e12) {
    resultat.textContent = "Entrez un montant valide.";
    apresFrais.textContent = "";
    return;
  }
  // textContent (et pas innerHTML) : rien ne peut être interprété comme du code
  const converti = valeur * tauxUnitaire;
  const texte = formater(valeur, de.value) + " = " + formater(converti, vers.value);
  if (resultat.textContent !== texte) {
    resultat.textContent = texte;
    rejouer(resultat, "pulse"); // petit effet visuel pour montrer que le résultat a changé
  }

  // Frais de la banque : ce qu'on reçoit vraiment
  const pourcentFrais = Number(frais.value);
  if (!Number.isFinite(pourcentFrais) || pourcentFrais < 0 || pourcentFrais > 20) {
    apresFrais.textContent = "Frais invalides (entre 0 et 20 %).";
  } else if (pourcentFrais > 0) {
    apresFrais.textContent =
      "Après " + nombre(pourcentFrais) + " % de frais : " + formater(converti * (1 - pourcentFrais / 100), vers.value);
  } else {
    apresFrais.textContent = "";
  }
}

// Garde les 5 dernières conversions et les affiche
function ajouterHistorique() {
  const texte = resultat.textContent;
  if (!texte.includes("=") || conversions[0] === texte) return; // pas d'erreur ni de doublon

  conversions.unshift(texte);
  if (conversions.length > 5) conversions.pop();

  historique.replaceChildren(); // vide la liste
  for (const ligne of conversions) {
    const li = document.createElement("li");
    li.textContent = ligne;
    historique.append(li);
  }
}

// ===== Liste de surveillance : chaque devise face à "De", avec sa variation du jour =====
let numeroListe = 0; // sert à ignorer une ancienne réponse si on change vite de devise

async function chargerListe() {
  const demande = ++numeroListe;

  // Variation du jour : on compare les 2 derniers jours connus de la BCE (on prend 10 jours à cause des week-ends)
  let veille = {}, dernier = {};
  try {
    const joursConnus = Object.values(await historiqueBCE(ilYa(10), de.value));
    veille = joursConnus[joursConnus.length - 2] || {};
    dernier = joursConnus[joursConnus.length - 1] || {};
  } catch (erreur) {
    // devise non suivie par la BCE : on affichera juste le taux, sans variation
  }
  if (demande !== numeroListe) return;

  liste.replaceChildren();
  const morceaux = []; // les morceaux du bandeau qui défile
  for (const code in DEVISES) {
    if (code === de.value) continue;

    const bouton = document.createElement("button");
    bouton.type = "button";
    if (code === vers.value) bouton.classList.add("actif");

    const nom = document.createElement("span");
    nom.textContent = DEVISES[code].drapeau + " " + de.value + "/" + code;

    const valeur = document.createElement("span");
    valeur.textContent = nombre(calculer(1, taux[de.value], taux[code]));

    const evolution = document.createElement("span");
    evolution.className = "evolution";
    if (veille[code] > 0 && dernier[code] > 0) {
      evolution.textContent = pourcentage(veille[code], dernier[code]);
      evolution.classList.add(dernier[code] >= veille[code] ? "hausse" : "baisse");
    } else {
      evolution.textContent = "—";
    }

    bouton.append(nom, valeur, evolution);
    // Cliquer sur une ligne l'affiche dans le convertisseur et le graphique
    bouton.addEventListener("click", () => {
      vers.value = code;
      changement();
    });

    const li = document.createElement("li");
    li.append(bouton);
    liste.append(li);

    // Le même taux pour le bandeau, ex : "EUR/USD 1,0974 -0,19 %"
    const morceau = document.createElement("span");
    morceau.className = "morceau";
    morceau.append(de.value + "/" + code + " " + valeur.textContent + " ", evolution.cloneNode(true));
    morceaux.push(morceau);
  }

  // On met le contenu 2 fois de suite : quand la 1re moitié est sortie, la 2e prend sa place sans saut
  defilement.replaceChildren(...morceaux, ...morceaux.map((m) => m.cloneNode(true)));
}

// ===== Pastilles pour choisir les monnaies du mode "Monnaies" =====

function afficherChoix() {
  choixMonnaies.replaceChildren();
  for (const code in DEVISES) {
    if (!DEVISES[code].bce || code === de.value) continue;

    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.textContent = code;
    bouton.style.color = DEVISES[code].couleur; // la bordure et le halo reprennent cette couleur (currentColor)
    bouton.classList.toggle("actif", choisies.has(code));
    bouton.setAttribute("aria-pressed", choisies.has(code));
    bouton.addEventListener("click", () => {
      if (choisies.has(code)) choisies.delete(code);
      else choisies.add(code);
      afficherChoix();
      chargerGraphique();
    });
    choixMonnaies.append(bouton);
  }
}

// ===== Graphique : chargement des données =====
let numeroGraphique = 0;

async function chargerGraphique() {
  const demande = ++numeroGraphique;
  dates = [];
  courbes = [];
  variation.textContent = "";
  infoGraphique.textContent = "Chargement...";

  let donnees = { dates: [], courbes: [] };
  let message;
  try {
    donnees = mode === "paire" ? await chargerPaire() : await chargerMonnaies();
  } catch (erreur) {
    message = erreur.message;
  }
  if (demande !== numeroGraphique) return; // une demande plus récente est en cours : on ignore celle-ci
  if (message) infoGraphique.textContent = message;
  dates = donnees.dates;
  courbes = donnees.courbes;
  animer();
}

// Mode "Paire" : une seule courbe, ex : combien vaut 1 EUR en USD chaque jour
async function chargerPaire() {
  if (de.value === vers.value) throw new Error("Choisissez deux devises différentes.");
  if (!DEVISES[de.value].bce || !DEVISES[vers.value].bce) {
    throw new Error("Historique indisponible : la BCE ne suit pas cette devise.");
  }

  const donnees = await historiqueBCE(ilYa(jours), de.value, vers.value);
  const listeDates = [];
  const valeurs = [];
  for (const date in donnees) {
    const v = donnees[date][vers.value];
    if (typeof v === "number" && v > 0) {
      listeDates.push(date);
      valeurs.push(v);
    }
  }
  if (valeurs.length < 2) throw new Error("Pas assez de données pour cette période.");

  const premier = valeurs[0];
  const dernier = valeurs[valeurs.length - 1];
  variation.textContent = pourcentage(premier, dernier) + " sur la période";
  variation.className = dernier >= premier ? "hausse" : "baisse";
  infoGraphique.textContent = "Source : Banque centrale européenne. Survolez le graphique pour voir chaque jour.";

  return {
    dates: listeDates,
    courbes: [{ nom: de.value + "/" + vers.value, couleur: dernier >= premier ? VERT : ROUGE, valeurs }],
  };
}

// Mode "Monnaies" : la force de chaque monnaie face à "De", en % depuis le début de la période.
// Ex : si la courbe du dollar monte à +2 %, 1 dollar vaut 2 % d'euros de plus qu'au début.
async function chargerMonnaies() {
  paire.textContent = "Monnaies face à " + de.value;
  prix.textContent = "";
  if (!DEVISES[de.value].bce) throw new Error("Historique indisponible : la BCE ne suit pas " + de.value + ".");
  if (choisies.size === 0) throw new Error("Choisissez au moins une monnaie ci-dessus.");

  const donnees = await historiqueBCE(ilYa(jours), de.value);
  const listeDates = Object.keys(donnees);
  const listeCourbes = [];

  for (const code of choisies) {
    if (code === de.value) continue;
    // donnees[date][code] = combien de "code" pour 1 "De". La force de "code" est donc l'inverse.
    const debut = donnees[listeDates[0]][code];
    const valeurs = listeDates.map((date) => {
      const t = donnees[date][code];
      return typeof t === "number" && t > 0 && debut > 0 ? (debut / t - 1) * 100 : null;
    });
    listeCourbes.push({ nom: code, couleur: DEVISES[code].couleur, valeurs });
  }
  if (listeDates.length < 2 || listeCourbes.length === 0) throw new Error("Pas assez de données pour cette période.");

  infoGraphique.textContent =
    "Une courbe qui monte = la monnaie se renforce face à " + de.value + ". Source : Banque centrale européenne.";
  return { dates: listeDates, courbes: listeCourbes };
}

// ===== Graphique : dessin =====

// Dessine tout le graphique. "survol" = numéro du jour sous la souris (ou null)
function dessiner(survol = null) {
  // Adapte la taille du dessin à la taille réelle du canvas (net sur les écrans haute résolution)
  const ratio = window.devicePixelRatio || 1;
  const largeurTotale = canvas.clientWidth;
  const hauteurTotale = canvas.clientHeight;
  canvas.width = largeurTotale * ratio;
  canvas.height = hauteurTotale * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, largeurTotale, hauteurTotale);
  if (dates.length < 2 || courbes.length === 0) return;

  const enPourcent = mode === "monnaies";
  const format = enPourcent ? signe : nombre;

  // Zone des courbes : on laisse 70 px à droite pour les valeurs et 24 px en bas pour les dates
  const largeur = largeurTotale - 70;
  const hauteur = hauteurTotale - 24;
  const toutes = courbes.flatMap((c) => c.valeurs).filter((v) => v !== null);
  const min = Math.min(...toutes);
  const max = Math.max(...toutes);
  const ecart = max - min || 1;

  // Convertit un numéro de jour en x, et une valeur en y
  const x = (i) => (i / (dates.length - 1)) * largeur;
  const y = (v) => 30 + ((max - v) / ecart) * (hauteur - 50);

  ctx.font = "11px Helvetica, Arial, sans-serif";
  ctx.lineWidth = 1;

  // Grille horizontale + valeurs à droite
  ctx.textBaseline = "middle";
  for (let k = 0; k <= 4; k++) {
    const v = min + (ecart * k) / 4;
    ctx.strokeStyle = GRILLE;
    ctx.beginPath();
    ctx.moveTo(0, y(v));
    ctx.lineTo(largeur, y(v));
    ctx.stroke();
    ctx.fillStyle = TEXTE;
    ctx.fillText(format(v), largeur + 8, y(v));
  }

  // Grille verticale + dates en bas
  ctx.textBaseline = "alphabetic";
  for (let k = 0; k <= 4; k++) {
    const i = Math.round(((dates.length - 1) * k) / 4);
    ctx.strokeStyle = GRILLE;
    ctx.beginPath();
    ctx.moveTo(x(i), 0);
    ctx.lineTo(x(i), hauteur);
    ctx.stroke();
    ctx.fillStyle = TEXTE;
    ctx.textAlign = k === 0 ? "left" : k === 4 ? "right" : "center";
    ctx.fillText(dateCourte(dates[i]), x(i), hauteurTotale - 6);
  }
  ctx.textAlign = "left";

  // En mode "Monnaies", une ligne plus visible marque 0 % (la valeur de départ)
  if (enPourcent && min < 0 && max > 0) {
    ctx.strokeStyle = TEXTE;
    ctx.beginPath();
    ctx.moveTo(0, y(0));
    ctx.lineTo(largeur, y(0));
    ctx.stroke();
  }

  // Animation : on ne montre que la partie gauche du graphique, de plus en plus large
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, largeurTotale * progression, hauteurTotale);
  ctx.clip();

  for (const courbe of courbes) {
    if (!enPourcent && typeGraphique === "bougies") {
      dessinerBougies(courbe.valeurs, x, y);
      const derniere = courbe.valeurs[courbe.valeurs.length - 1];
      etiquette(largeur, y(derniere), format(derniere), courbe.couleur);
      continue; // pas de ligne en mode bougies
    }

    // Le tracé de la courbe (on saute les jours sans valeur)
    ctx.beginPath();
    courbe.valeurs.forEach((v, i) => {
      if (v !== null) ctx.lineTo(x(i), y(v));
    });

    // Mode "Paire" : zone colorée sous la courbe (dégradé qui s'efface vers le bas)
    if (!enPourcent) {
      ctx.lineTo(largeur, hauteur);
      ctx.lineTo(0, hauteur);
      const degrade = ctx.createLinearGradient(0, 0, 0, hauteur);
      degrade.addColorStop(0, courbe.couleur + "55");
      degrade.addColorStop(1, courbe.couleur + "00");
      ctx.fillStyle = degrade;
      ctx.fill();
      ctx.beginPath();
      courbe.valeurs.forEach((v, i) => ctx.lineTo(x(i), y(v)));
    }

    // Effet néon : un halo flou de la même couleur autour de la ligne
    ctx.strokeStyle = courbe.couleur;
    ctx.lineWidth = 2;
    ctx.shadowColor = courbe.couleur;
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Étiquette de la dernière valeur sur l'axe de droite
    const derniere = courbe.valeurs[courbe.valeurs.length - 1];
    if (derniere !== null) etiquette(largeur, y(derniere), format(derniere), courbe.couleur);
  }
  ctx.restore(); // fin de la zone d'animation

  // Légende en haut à gauche : le jour sous la souris (sinon le dernier) et la valeur de chaque courbe
  const jour = survol ?? dates.length - 1;
  let xTexte = 8;
  ctx.font = "13px Helvetica, Arial, sans-serif";
  ctx.fillStyle = "#d1d4dc";
  ctx.fillText(dateLongue(dates[jour]), xTexte, 16);
  xTexte += ctx.measureText(dateLongue(dates[jour])).width + 16;
  for (const courbe of courbes) {
    const v = courbe.valeurs[jour];
    const texte = (enPourcent ? courbe.nom + " " : "") + (v === null ? "—" : format(v));
    ctx.fillStyle = enPourcent ? courbe.couleur : "#d1d4dc";
    ctx.fillText(texte, xTexte, 16);
    xTexte += ctx.measureText(texte).width + 14;
  }

  // Réticule (lignes en pointillés) sous la souris
  if (survol !== null) {
    const px = x(survol);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = TEXTE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, hauteur);
    ctx.stroke();
    ctx.setLineDash([]);

    // Un point sur chaque courbe
    for (const courbe of courbes) {
      const v = courbe.valeurs[survol];
      if (v === null) continue;
      ctx.beginPath();
      ctx.arc(px, y(v), 4, 0, 2 * Math.PI);
      ctx.fillStyle = courbe.couleur;
      ctx.shadowColor = courbe.couleur;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

// Bougies : on regroupe les jours par paquets (environ 40 bougies au maximum).
// Chaque bougie montre le taux au début du paquet (ouverture), à la fin (clôture), le plus haut et le plus bas.
// Verte si le taux a monté pendant le paquet, rouge s'il a baissé.
function dessinerBougies(valeurs, x, y) {
  const taille = Math.max(2, Math.ceil(valeurs.length / 40));
  for (let a = 0; a < valeurs.length - 1; a += taille) {
    const b = Math.min(a + taille, valeurs.length - 1); // le dernier jour d'un paquet est le premier du suivant
    const paquet = valeurs.slice(a, b + 1);
    const ouverture = paquet[0];
    const cloture = paquet[paquet.length - 1];
    const couleur = cloture >= ouverture ? VERT : ROUGE;
    const centre = x((a + b) / 2);
    const largeurBougie = Math.max(3, (x(b) - x(a)) * 0.7);

    ctx.strokeStyle = couleur;
    ctx.fillStyle = couleur;
    ctx.lineWidth = 1;
    ctx.shadowColor = couleur;
    ctx.shadowBlur = 8;

    // La mèche : un trait fin du plus bas au plus haut
    ctx.beginPath();
    ctx.moveTo(centre, y(Math.max(...paquet)));
    ctx.lineTo(centre, y(Math.min(...paquet)));
    ctx.stroke();

    // Le corps : un rectangle de l'ouverture à la clôture
    const haut = y(Math.max(ouverture, cloture));
    const hauteurCorps = Math.max(1, Math.abs(y(ouverture) - y(cloture)));
    ctx.fillRect(centre - largeurBougie / 2, haut, largeurBougie, hauteurCorps);
  }
  ctx.shadowBlur = 0;
}

// Lance l'animation : le graphique se dessine de gauche à droite en 0,8 seconde
function animer() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    progression = 1; // l'utilisateur a demandé moins d'animations dans les réglages de son ordinateur
    dessiner();
    return;
  }
  const debut = performance.now();
  function etape(maintenant) {
    progression = Math.min((maintenant - debut) / 800, 1);
    dessiner();
    if (progression < 1) requestAnimationFrame(etape);
  }
  requestAnimationFrame(etape);
}

// Petite case colorée avec une valeur, posée sur l'axe de droite
function etiquette(xAxe, yAxe, texte, fond) {
  ctx.font = "11px Helvetica, Arial, sans-serif";
  ctx.fillStyle = fond;
  ctx.fillRect(xAxe + 2, yAxe - 9, 66, 18);
  ctx.fillStyle = "#0b0e17"; // texte foncé : lisible sur les fonds fluo
  ctx.textBaseline = "middle";
  ctx.fillText(texte, xAxe + 8, yAxe);
  ctx.textBaseline = "alphabetic";
}

// "2026-10-20" → "20 oct." (ou "oct. 2026" sur les longues périodes)
function dateCourte(date) {
  const options = jours > 365 ? { month: "short", year: "numeric" } : { day: "numeric", month: "short" };
  return new Date(date).toLocaleDateString("fr-FR", options);
}

// "2026-10-20" → "20 oct. 2026"
function dateLongue(date) {
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

// Trouve le jour le plus proche de la souris et redessine
canvas.addEventListener("mousemove", (e) => {
  if (dates.length < 2) return;
  const largeur = canvas.clientWidth - 70;
  const i = Math.round((e.offsetX / largeur) * (dates.length - 1));
  dessiner(Math.min(Math.max(i, 0), dates.length - 1));
});
canvas.addEventListener("mouseleave", () => dessiner());
window.addEventListener("resize", () => dessiner());

// ===== Événements =====

// Appelé dès qu'une devise change
function changement() {
  convertir();
  ajouterHistorique();
  afficherChoix();
  chargerGraphique();
  chargerListe();
}

// Boutons de période (1M, 3M, 1A, 5A)
for (const bouton of boutonsPeriode) {
  bouton.addEventListener("click", () => {
    for (const b of boutonsPeriode) b.classList.remove("actif");
    bouton.classList.add("actif");
    jours = Number(bouton.dataset.jours);
    chargerGraphique();
  });
}

// Boutons Paire / Monnaies
for (const bouton of boutonsMode) {
  bouton.addEventListener("click", () => {
    for (const b of boutonsMode) b.classList.remove("actif");
    bouton.classList.add("actif");
    mode = bouton.dataset.mode;
    choixMonnaies.hidden = mode !== "monnaies";
    types.hidden = mode !== "paire";
    convertir(); // remet le titre de la barre du haut
    chargerGraphique();
  });
}

// Boutons Ligne / Bougies
for (const bouton of boutonsType) {
  bouton.addEventListener("click", () => {
    for (const b of boutonsType) b.classList.remove("actif");
    bouton.classList.add("actif");
    typeGraphique = bouton.dataset.type;
    animer();
  });
}

// Montants rapides (10, 50, 100, 1 000)
for (const bouton of boutonsRapides) {
  bouton.addEventListener("click", () => {
    montant.value = bouton.dataset.montant;
    convertir();
    ajouterHistorique();
  });
}

frais.addEventListener("input", convertir);

// Copie le résultat dans le presse-papiers
copier.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(resultat.textContent);
    copier.textContent = "Copié ✓";
    copier.classList.add("succes");
  } catch (erreur) {
    copier.textContent = "Copie impossible";
  }
  setTimeout(() => {
    copier.textContent = "Copier le résultat";
    copier.classList.remove("succes");
  }, 1500);
});

// Échange les deux devises
inverser.addEventListener("click", () => {
  [de.value, vers.value] = [vers.value, de.value];
  inverser.classList.toggle("tourne"); // le bouton fait un demi-tour
  changement();
});

// "input" = à chaque frappe ; "change" = quand on valide le montant (Entrée ou clic ailleurs)
montant.addEventListener("input", convertir);
montant.addEventListener("change", ajouterHistorique);
de.addEventListener("change", changement);
vers.addEventListener("change", changement);

// ===== Navigation entre les vues (Accueil, Convertisseur, Courbes) =====
const liensMenu = document.querySelectorAll(".menu a");

function afficherVue() {
  // Sécurité : on n'accepte que les 3 vues connues, tout le reste renvoie à l'accueil
  const demandee = location.hash.slice(1); // "#courbes" → "courbes"
  const vue = ["convertisseur", "courbes"].includes(demandee) ? demandee : "accueil";

  document.body.dataset.vue = vue; // le CSS cache ou montre les blocs selon cette valeur
  for (const lien of liensMenu) {
    if (lien.hash === "#" + vue) lien.setAttribute("aria-current", "page");
    else lien.removeAttribute("aria-current");
  }
  // Le graphique était caché (taille 0) : on le redessine à sa vraie taille
  if (vue === "courbes") animer();
}
window.addEventListener("hashchange", afficherVue);

// ===== Démarrage =====
afficherVue();
convertir();
afficherChoix();
chargerTaux();
chargerGraphique();

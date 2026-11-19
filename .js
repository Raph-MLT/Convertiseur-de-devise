// Récupération des éléments de la page
const montant = document.getElementById("montant");
const de = document.getElementById("de");
const vers = document.getElementById("vers");
const resultat = document.getElementById("resultat");
const unitaire = document.getElementById("unitaire");
const info = document.getElementById("info");
const inverser = document.getElementById("inverser");
const copier = document.getElementById("copier");
const courbe = document.getElementById("courbe");
const infoGraphique = document.getElementById("info-graphique");
const historique = document.getElementById("historique");

// Les devises proposées : drapeau, nom, et un taux de secours (pour 1 €) utilisé si internet ne marche pas.
// Les taux de secours datent du 19/11/2026 : ils sont approximatifs.
const DEVISES = {
  EUR: { drapeau: "🇪🇺", nom: "Euro", secours: 1 },
  USD: { drapeau: "🇺🇸", nom: "Dollar américain", secours: 1.0974 },
  GBP: { drapeau: "🇬🇧", nom: "Livre sterling", secours: 0.834 },
  CHF: { drapeau: "🇨🇭", nom: "Franc suisse", secours: 0.9249 },
  JPY: { drapeau: "🇯🇵", nom: "Yen", secours: 174.89 },
  CAD: { drapeau: "🇨🇦", nom: "Dollar canadien", secours: 1.5717 },
  AUD: { drapeau: "🇦🇺", nom: "Dollar australien", secours: 1.6329 },
  CNY: { drapeau: "🇨🇳", nom: "Yuan", secours: 7.3281 },
  SEK: { drapeau: "🇸🇪", nom: "Couronne suédoise", secours: 11.154 },
  NOK: { drapeau: "🇳🇴", nom: "Couronne norvégienne", secours: 10.633 },
  PLN: { drapeau: "🇵🇱", nom: "Zloty", secours: 4.412 },
  TRY: { drapeau: "🇹🇷", nom: "Livre turque", secours: 55.39 },
  INR: { drapeau: "🇮🇳", nom: "Roupie indienne", secours: 102.5 },
  BRL: { drapeau: "🇧🇷", nom: "Réal brésilien", secours: 6.3634 },
  MXN: { drapeau: "🇲🇽", nom: "Peso mexicain", secours: 20.546 },
  KRW: { drapeau: "🇰🇷", nom: "Won", secours: 1461.5 },
  MAD: { drapeau: "🇲🇦", nom: "Dirham marocain", secours: 10.934 },
  TND: { drapeau: "🇹🇳", nom: "Dinar tunisien", secours: 3.3506 },
  DZD: { drapeau: "🇩🇿", nom: "Dinar algérien", secours: 150.54 },
  XOF: { drapeau: "🌍", nom: "Franc CFA", secours: 655.957 },
};

// Au départ on utilise les taux de secours, ils seront remplacés par les vrais dès qu'ils arrivent
const taux = {};
for (const code in DEVISES) taux[code] = DEVISES[code].secours;

const conversions = []; // historique en mémoire seulement : il disparaît quand on ferme la page

// Remplit les deux listes déroulantes, ex : "🇪🇺 EUR — Euro"
for (const code in DEVISES) {
  const texte = DEVISES[code].drapeau + " " + code + " — " + DEVISES[code].nom;
  de.add(new Option(texte, code));
  vers.add(new Option(texte, code));
}
de.value = "EUR";
vers.value = "USD";

// Le calcul : on passe par l'euro (montant → EUR → devise cible)
function calculer(valeur, tauxDe, tauxVers) {
  return (valeur / tauxDe) * tauxVers;
}
console.assert(calculer(100, 2, 4) === 200, "le calcul de conversion est faux");

// Affiche un montant avec son symbole, ex : "100,00 €"
function formater(n, devise) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: devise });
}

// Télécharge les taux du jour (base EUR)
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
}

// Fait le calcul et affiche le résultat
function convertir() {
  const valeur = Number(montant.value);

  if (!Number.isFinite(valeur) || valeur < 0 || valeur > 1e12) {
    resultat.textContent = "Entrez un montant valide.";
    unitaire.textContent = "";
    return;
  }

  const converti = calculer(valeur, taux[de.value], taux[vers.value]);
  const tauxUnitaire = calculer(1, taux[de.value], taux[vers.value]);

  // textContent (et pas innerHTML) : rien ne peut être interprété comme du code
  resultat.textContent = formater(valeur, de.value) + " = " + formater(converti, vers.value);
  unitaire.textContent = "1 " + de.value + " = " + tauxUnitaire.toLocaleString("fr-FR", { maximumFractionDigits: 4 }) + " " + vers.value;
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

// Dessine la courbe du taux sur les 30 derniers jours
let numeroGraphique = 0; // sert à ignorer une ancienne réponse si on change vite de devise

async function chargerGraphique() {
  const demande = ++numeroGraphique;
  courbe.setAttribute("points", "");

  if (de.value === vers.value) {
    infoGraphique.textContent = "Choisissez deux devises différentes.";
    return;
  }

  infoGraphique.textContent = "Chargement...";
  const debut = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10); // ex : "2026-10-20"

  try {
    const url = "https://api.frankfurter.dev/v1/" + debut + "..?from=" + de.value + "&to=" + vers.value;
    const reponse = await fetch(url, { referrerPolicy: "no-referrer" });
    if (!reponse.ok) throw new Error("devise non suivie");
    const donnees = await reponse.json();
    if (demande !== numeroGraphique) return;

    // Liste des taux jour par jour, en gardant seulement les vrais nombres
    const valeurs = Object.values(donnees.rates)
      .map((jour) => jour[vers.value])
      .filter((v) => typeof v === "number" && v > 0);
    if (valeurs.length < 2) throw new Error("pas assez de données");

    // Transforme chaque taux en point (x, y) dans un cadre de 300 × 100
    const min = Math.min(...valeurs);
    const max = Math.max(...valeurs);
    const points = valeurs.map((v, i) => {
      const x = (i / (valeurs.length - 1)) * 300;
      const y = max === min ? 50 : 95 - ((v - min) / (max - min)) * 90;
      return x + "," + y;
    });
    courbe.setAttribute("points", points.join(" "));

    const f = (n) => n.toLocaleString("fr-FR", { maximumFractionDigits: 4 });
    infoGraphique.textContent = "Min " + f(min) + " · Max " + f(max) + " (source : BCE)";
  } catch (erreur) {
    if (demande !== numeroGraphique) return;
    infoGraphique.textContent = "Historique indisponible pour cette paire de devises.";
  }
}

// Copie le résultat dans le presse-papiers
copier.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(resultat.textContent);
    copier.textContent = "Copié ✓";
  } catch (erreur) {
    copier.textContent = "Copie impossible";
  }
  setTimeout(() => (copier.textContent = "Copier le résultat"), 1500);
});

// Échange les deux devises
inverser.addEventListener("click", () => {
  [de.value, vers.value] = [vers.value, de.value];
  convertir();
  ajouterHistorique();
  chargerGraphique();
});

// "input" = à chaque frappe ; "change" = quand on valide le montant (Entrée ou clic ailleurs)
montant.addEventListener("input", convertir);
montant.addEventListener("change", ajouterHistorique);

for (const liste of [de, vers]) {
  liste.addEventListener("change", () => {
    convertir();
    ajouterHistorique();
    chargerGraphique();
  });
}

chargerTaux();
chargerGraphique();

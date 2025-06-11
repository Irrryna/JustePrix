// Dépendances 
const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const path = require('path');

const app = express();
const PORT = 8090;

// Configuration EJS 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));   // views

//  Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public'))); // public

app.use(cookieSession({
    name: 'session',
    keys: ['maSuperClef'],          // remplace par une vraie clé secrète
    maxAge: 24 * 60 * 60 * 1000     // 24 h
}));

// Routes 
// page d’accueil : joueur 1 choisit l’objet et le prix secret
app.get('/', (req, res) => {
    res.render('accueil', { data: req.session.data });
});

app.post('/', (req, res) => {
    const { prenom, objet, prix } = req.body;

    if (!prenom || !objet || !prix) {
        return res.render('accueil', { erreur: 'Tous les champs sont obligatoires.', data: null });
    }

    // On stocke toutes les données dans la session
    req.session.data = {
        prenom,
        objet,
        prix: Number(prix),
        essais: 0
    };
    res.redirect('/game');
});

// Page du jeu : Joueur 2 devine le prix
app.get('/game', (req, res) => {
    if (!req.session.data) { 
        return res.redirect('/');
      }  // pas de session - retour accueil
    res.render('game', { 
        essais: req.session.data.essais,
        prenom: req.session.data.prenom,
        objet: req.session.data.objet,
        proposition: '', //doit être toujours définit !!
        msg: null, 
        gagne: false,
    });

});

// POST – traitement d'une proposition
app.post('/game', (req, res) => {
    if (!req.session.data) return res.redirect('/');
  
    const propStr     = req.body.proposition;      // la saisie brute
    const proposition = Number(propStr);           // en nombre
    const secret      = req.session.data.prix;
  
    // On compte l’essai quoi qu’il arrive
    req.session.data.essais += 1;
  
    let msg  = '';
    let gagne = false;
  
    if (propStr.trim() === '') {
      msg = 'Valeur vide : essaie encore !';
    } else if (isNaN(proposition)) {
      msg = 'Entrez un nombre valide !';
    } else if (proposition < secret) {
      msg = 'C’est plus cher !';
    } else if (proposition > secret) {
      msg = 'C’est moins cher!';
    } else {
      msg   = `Bravo ! Tu as trouvé 🎉`;
      gagne = true;
    }
  
    // ENVOYER ces variables à la vue !!
    res.render('game', {
      prenom      : req.session.data.prenom,
      objet       : req.session.data.objet,
      essais      : req.session.data.essais,
      proposition : propStr,   // pas "req.session.data.propStr"
      msg,
      gagne
    });
  });

// Route GET /replay → réinitialise et renvoie à /
app.get('/replay', (req, res) => {
    req.session = null;
    res.redirect('/');
  });

// page 404 
app.use((req, res) => {
    res.status(404).render('404');
});

// Démarrage serveur 
app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
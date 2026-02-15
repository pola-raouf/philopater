const express = require('express');
const router = express.Router();

// شركات ثابتة مع اللوجو (أو مجرد اسم)
const companies = [
  { id: 1, name: 'HEINZ', logo: '/image/heinz.png' },
  { id: 2, name: 'LITALY', logo: '/image/litaly.png' },
  { id: 3, name: 'MOTHER', logo: '/image/mother.png' },
  { id: 4, name: 'Spiga', logo: '/image/spiga.png' },
  { id: 5, name: 'Aachi', logo: '/image/aachi.png' },
  { id: 6, name: 'AROY-D', logo: '/image/aroy-d.png' },
  { id: 7, name: 'diamound', logo: '/image/diamound.png' },
  { id: 8, name: 'diari', logo: '/image/diari.png' },
  { id: 9, name: 'La cravella', logo: '/image/la-cravela.png' },
  { id: 10, name: 'LA PEDRIZA', logo: '/image/la-pedriza.png' },
  { id: 11, name: 'MA.KIN', logo: '/image/makin.png' },
  { id: 12, name: 'OTTIMA', logo: '/image/ottima.png' },
  { id: 13, name: 'QUEEN', logo: '/image/queen.png' },
  { id: 14, name: 'Red Leaf', logo: '/image/red-leaf.png' },
  { id: 15, name: 'riso', logo: '/image/riso.png' },
  { id: 16, name: 'SHERRY', logo: '/image/sherry.png' },
  { id: 17, name: 'Sofia', logo: '/image/sofia.png' },
  { id: 18, name: 'KODANMAL', logo: '/image/kodanmal.png' },
];

router.get('/', (req, res) => {
  res.render('partners', { companies }); // هنا بنمرر الـ companies للـ view
});

module.exports = router;

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('pages/contact', { title: 'Página de Contacto' });
});

module.exports = router;

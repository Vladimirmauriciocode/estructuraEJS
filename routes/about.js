const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('pages/about', { title: 'Acerca de Nosotros' });
});

module.exports = router;

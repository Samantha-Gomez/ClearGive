const express = require('express');
const {
  getProvinces,
  getCities,
  getBarangays,
} = require('../controllers/locationController');

const router = express.Router();

router.get('/provinces', getProvinces);
router.get('/cities', getCities);
router.get('/barangays', getBarangays);

module.exports = router;

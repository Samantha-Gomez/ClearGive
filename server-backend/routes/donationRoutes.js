const express = require('express')
const {
  getMyDonations,
  getAllDonations,
} = require('../controllers/donationController')
const { authenticate, authorize } = require('../middleware/authMiddleware')

const router = express.Router()

router.get(
  '/my',
  authenticate,
  authorize('donor'),
  getMyDonations,
)

router.get(
  '/admin',
  authenticate,
  authorize('admin'),
  getAllDonations,
)

module.exports = router
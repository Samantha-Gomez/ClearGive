const express = require('express')
const { getAllDistributions } = require('../controllers/distributionController')
const { authenticate, authorize } = require('../middleware/authMiddleware')

const router = express.Router()

router.get(
  '/admin',
  authenticate,
  authorize('admin'),
  getAllDistributions,
)

module.exports = router
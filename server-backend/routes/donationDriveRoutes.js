
const express = require('express')

const {
  listPublicActiveDrives,
  getPublicActiveDrive,
} = require('../controllers/donationDriveController')

const {
  validateObjectId,
  validatePublicDriveQuery,
} = require('../middleware/validation')
const {
  authenticate,
  authorize,
} = require('../middleware/authMiddleware')

const router = express.Router()

router.use(authenticate, authorize('donor'))

router.get(
  '/',
  validatePublicDriveQuery,
  listPublicActiveDrives,
)

router.get(
  '/:id',
  validateObjectId,
  getPublicActiveDrive,
)

module.exports = router
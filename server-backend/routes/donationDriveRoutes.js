
const express = require('express')

const {
  listPublicActiveDrives,
  getPublicActiveDrive,
} = require('../controllers/donationDriveController')

const {
  validateObjectId,
  validatePublicDriveQuery,
} = require('../middleware/validation')

const router = express.Router()

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
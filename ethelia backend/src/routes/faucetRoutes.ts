import express from 'express'
import { claimTokens, getFaucetStatus } from '../controllers/faucetController'
import { authMiddleware } from '../middleware/authMiddleware'

const router = express.Router()

router.post('/claim', authMiddleware, claimTokens)
router.get('/status/:address', authMiddleware, getFaucetStatus)

export default router

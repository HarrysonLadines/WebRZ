import express from 'express'
import { getMessage, signIn } from '../controllers/authController'

const router = express.Router()

router.post('/message', getMessage)
router.post('/signin', signIn)

export default router

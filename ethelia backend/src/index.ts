import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'

import authRoutes from './routes/authRoutes'
import faucetRoutes from './routes/faucetRoutes'

dotenv.config()

const app = express()

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true,
}))

app.use(bodyParser.json())

app.use('/auth', authRoutes)
app.use('/faucet', faucetRoutes)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`)
})

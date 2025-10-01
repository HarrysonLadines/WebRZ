import { ethers } from 'ethers'
import { faucetAbi } from '../abi/faucetAbi'
import dotenv from 'dotenv'

dotenv.config()

// Proveedor usando la URL RPC de Sepolia desde .env
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)

// Wallet firmador con la PRIVATE_KEY y lo conecta al proveedor
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider)

// Se exporta la instancia del contrato faucet usando el ABI y la dirección
export const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS!,
  faucetAbi,
  wallet
)

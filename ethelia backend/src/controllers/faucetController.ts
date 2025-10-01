import { Response } from 'express'
import { contract } from '../config/contract'
import { AuthRequest } from '../middleware/authMiddleware'

export const claimTokens = async (req: AuthRequest, res: Response) => {
  const address = req.user!.address

  try {
    const hasClaimed = await contract.hasAddressClaimed(address)
    if (hasClaimed) {
      return res.status(400).json({ error: 'Tokens ya reclamados' })
    }

    const tx = await contract.claimTokens({ gasLimit: 100000 })
    const receipt = await tx.wait()

    res.json({ success: true, txHash: receipt.hash })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al reclamar tokens' })
  }
}

export const getFaucetStatus = async (req: AuthRequest, res: Response) => {
  const { address } = req.params

  try {
    const [hasClaimed, balance, users] = await Promise.all([
      contract.hasAddressClaimed(address),
      contract.balanceOf(address),
      contract.getFaucetUsers(),
    ])

    res.json({
      hasClaimed,
      balance: balance.toString(),
      users,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener estado del faucet' })
  }
}

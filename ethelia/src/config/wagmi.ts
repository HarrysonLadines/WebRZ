import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { createWeb3Modal } from '@web3modal/wagmi/react'

const projectId = 'f5444657e6f5103b125d2a0e726eb424'

const chains = [sepolia] as const

const metadata = {
  name: 'Ethelia Faucet dApp',
  description: 'Ethelia dApp para reclamar tokens de faucet',
  url: 'http://localhost:5173',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

export const config = createConfig({
  chains,
  transports: {
    [sepolia.id]: http()
  },
  ssr: false,
})

export const web3modal = createWeb3Modal({
  wagmiConfig: config,
  projectId,
  metadata
})

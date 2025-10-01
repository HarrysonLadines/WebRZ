import React from 'react'
import { WalletConnect } from './components/WalletConnect'
import { Faucet } from './components/Faucet'

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Ethelia Faucet App</h1>

      {/* Conexión de wallet */}
      <WalletConnect />

      {/* Faucet */}
      <Faucet />
    </div>
  )
}

export default App

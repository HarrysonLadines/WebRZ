
import { useAccount, useDisconnect } from 'wagmi'
import { web3modal } from '../config/wagmi'

export const WalletConnect = () => {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  return (
    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
      {isConnected ? (
        <div>
          <p>Conectado: {address}</p>
          <button
            onClick={() => disconnect()}
            style={{
              cursor: 'pointer',
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
            }}
          >
            Desconectar
          </button>
        </div>
      ) : (
        <button
          onClick={async () => {
            web3modal.open()
          }}
          style={{
            cursor: 'pointer',
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
          }}
        >
          Conectar Wallet
        </button>
      )}
    </div>
  )
}

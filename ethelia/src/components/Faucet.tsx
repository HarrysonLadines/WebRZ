import { useState, useEffect } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const API_URL = 'http://localhost:4000'

export const Faucet = () => {
  // Info de la wallet conectada
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()

  // Estados del componente
  const [jwt, setJwt] = useState<string | null>(null)
  const [claimed, setClaimed] = useState(false)
  const [balance, setBalance] = useState('0')
  const [faucetAmount, setFaucetAmount] = useState('0')
  const [users, setUsers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Cargar JWT almacenado si existe
  useEffect(() => {
    const token = localStorage.getItem('jwt')
    if (token) setJwt(token)
  }, [])

  // Consulto estado del faucet cuando hay dirección y JWT
  useEffect(() => {
    if (!address || !jwt) return

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/faucet/status/${address}`, {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        })

        if (!res.ok) throw new Error('Error al obtener estado del faucet')

        const data = await res.json()

        setClaimed(data.hasClaimed)
        setBalance(data.balance)
        setUsers(data.users)
        setFaucetAmount(data.faucetAmount || '???')
      } catch (e) {
        console.error('[STATUS] Error:', e)
        toast.error('Error al obtener estado, inicia sesión nuevamente')
        setJwt(null)
        localStorage.removeItem('jwt')
      }
    }

    fetchStatus()
  }, [address, jwt])

  // Iniciar sesión con Ethereum (SIWE)
  const handleLogin = async () => {
    if (!address) {
      toast.error('Conecta tu wallet primero')
      return
    }

    try {
      // Obtener mensaje para firmar
      const resMessage = await fetch(`${API_URL}/auth/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })

      if (!resMessage.ok) throw new Error('No se pudo obtener el mensaje de autenticación')

      const data = await resMessage.json()

      // Firmar el mensaje usando la wallet
      const signature = await signMessageAsync({ message: data.message })

      // Enviar firma al backend para obtener el JWT
      const resSignin = await fetch(`${API_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: data.message, signature }),
      })

      if (!resSignin.ok) {
        if (resSignin.status === 401) toast.error('Firma inválida')
        else toast.error('Error al autenticar')
        return
      }

      const { token } = await resSignin.json()

      // Guardar token
      setJwt(token)
      localStorage.setItem('jwt', token)
      toast.success('Autenticado correctamente')
    } catch (e) {
      console.error('[SIWE] Error:', e)
      toast.error('Error durante el inicio de sesión')
    }
  }

  //  Reclamar tokens del faucet
  const handleClaim = async () => {
    if (!jwt) return toast.error('No estás autenticado')

    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/faucet/claim`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      })

      if (!res.ok) throw new Error('Error al reclamar tokens')

      await res.json()
      toast.success('Tokens reclamados con éxito 🎉')
      setClaimed(true)
    } catch (e) {
      console.error('[CLAIM] Error:', e)
      toast.error('No se pudieron reclamar los tokens')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: '700px',
        margin: '30px auto',
        padding: '25px',
        fontFamily: 'Arial, sans-serif',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        backgroundColor: '#f0f2f5',
        color: '#111',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Ethelia Faucet App</h2>

      {isConnected ? (
        <div style={{ textAlign: 'center' }}>
          <p><strong>Wallet conectada:</strong> {address}</p>

          {!jwt ? (
            <button
              onClick={handleLogin}
              style={btnStyle('#4CAF50')}
            >
              Iniciar sesión con Ethereum
            </button>
          ) : (
            <>
              <p><strong>Balance:</strong> {balance} FaucetToken</p>

              <button
                onClick={handleClaim}
                disabled={claimed || loading}
                style={btnStyle(claimed ? '#ccc' : '#4CAF50', claimed || loading)}
              >
                {loading ? 'Procesando...' : claimed ? 'Ya reclamaste' : 'Reclamar Tokens'}
              </button>

              <h3 style={{ marginTop: '25px', textAlign: 'left' }}>
                Usuarios que interactuaron con el faucet:
              </h3>

              <div
                style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  background: '#fff',
                  borderRadius: '8px',
                  padding: '10px',
                  border: '1px solid #ddd',
                  color: '#000',
                }}
              >
                {users.length > 0 ? (
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {users.map((u) => (
                      <li
                        key={u}
                        style={{
                          padding: '5px 0',
                          borderBottom: '1px solid #eee',
                          fontFamily: 'monospace',
                        }}
                      >
                        {u}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No hay usuarios aún</p>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <p style={{ textAlign: 'center' }}>
          Conecta tu wallet para interactuar con el faucet
        </p>
      )}

      <ToastContainer />
    </div>
  )
}

const btnStyle = (bg: string, disabled: boolean = false) => ({
  padding: '12px 30px',
  margin: '15px 0',
  cursor: disabled ? 'not-allowed' : 'pointer',
  backgroundColor: bg,
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontWeight: 'bold',
  minWidth: '200px',
})

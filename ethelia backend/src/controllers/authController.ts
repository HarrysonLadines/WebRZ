import { Request, Response } from 'express'
import { SiweMessage } from 'siwe'
import { signToken } from '../utils/jwt'
import crypto from 'crypto'

function generateNonce() {
  return crypto.randomBytes(8).toString('hex')
}

/**
 * Endpoint para generar el mensaje SIWE que el usuario debe firmar
 */
export const getMessage = (req: Request, res: Response) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    const domain = 'localhost';
    const uri = 'http://localhost:5173';
    const version = '1';
    const chainId = 11155111;
    const nonce = generateNonce();
    const issuedAt = new Date().toISOString();
    const statement = 'Sign in to the app.';

    const message = `${domain} wants you to sign in with your Ethereum account:
${address}

${statement}

URI: ${uri}
Version: ${version}
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}`;

    const siweMessage = new SiweMessage(message);

    res.json({ message, nonce, address });
  } catch (error) {
    console.error('[getMessage] Error creando mensaje SIWE:', error);
    res.status(500).json({
      error: 'Error creando mensaje de autenticación',
      details: error instanceof Error ? error.message : error,
    });
  }
};

/**
 * Endpoint para verificar la firma SIWE enviada por el frontend
 */
export const signIn = async (req: Request, res: Response) => {
  const { message, signature } = req.body

  if (!message || !signature) {
    console.log('[signIn] ❌ Faltan el mensaje o la firma')
    return res.status(400).json({ error: 'Mensaje y firma requerido' })
  }

  try {

    console.log('Firma recibida:')
    console.log(signature)

    const siweMessage = new SiweMessage(message)

    console.log('Verificando firma...')
    const result = await siweMessage.verify({ signature })


    if (!result.success) {
      console.log('[signIn] ❌ Firma inválida')
      return res.status(401).json({ error: 'Firma inválida' })
    }

    // Crear JWT para el usuario autenticado
    const token = signToken(siweMessage.address)

    console.log('[signIn] ✅ Token JWT generado:')
    console.log(token)

    // Devolver token y dirección
    res.json({ token, address: siweMessage.address })
  } catch (error) {
    console.error('[signIn] ❌ Error en verificación SIWE:', error)
    res.status(401).json({ error: 'Autenticación fallida', details: error instanceof Error ? error.message : error })
  }
}

import jwt from 'jsonwebtoken'

interface JwtPayload {
  address: string
  iat: number
  exp: number
}

export const signToken = (address: string): string => {
  return jwt.sign({ address }, process.env.JWT_SECRET!, { expiresIn: '1h' })
}

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
  } catch {
    return null
  }
}

import { verifyAccessToken } from '../jwt/verifyToken.js'

export default async function jwtAuth(c, req, res) {

  const token = req.cookies?.accessToken

  if (!token) {
    c.securityError = 'MISSING_TOKEN'
    return false
  }

  const result = await verifyAccessToken(token)

  if (!result.valid) {
    c.securityError = 'INVALID_TOKEN'
    return false
  }
  
  req.user = result.payload

  return true
}
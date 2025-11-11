import { verifyRefreshToken } from '../jwt/verifyToken.js'

export default async function refreshAuth(c, req, res) {

  const refreshToken = req.cookies?.refreshToken

  if (!refreshToken) {
    c.securityError = 'MISSING_TOKEN'
    return false
  }

  const result = await verifyRefreshToken(refreshToken)

  if (!result.valid) {
    c.securityError = 'INVALID_TOKEN'
    return false
  }

  req.user = result.payload

  return true
}
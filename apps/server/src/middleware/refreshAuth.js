import { verifyRefreshToken } from '../jwt/verifyToken.js'

export default async function refreshAuth(c, req, res) {

  const token = req.cookies?.refreshToken

  if (!token) {
    return false
  }

  const result = await verifyRefreshToken(token)

  if (!result.valid) {
    return false
  }

  req.user = result.payload

  return true
}
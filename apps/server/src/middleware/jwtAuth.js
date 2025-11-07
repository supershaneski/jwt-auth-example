import { verifyAccessToken } from '../jwt/verifyToken.js'

export default async function jwtAuth(c, req, res) {

  const token = req.cookies?.accessToken

  if (!token) {
    return false
  }

  const result = await verifyAccessToken(token)

  if (!result.valid) {
    return false
  }
  
  req.user = result.payload

  return true
}
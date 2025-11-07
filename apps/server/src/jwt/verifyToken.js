import { jwtVerify } from 'jose'

export const verifyAccessToken = (token) => verify(token, 'access')
export const verifyRefreshToken = (token) => verify(token, 'refresh')

const verify = async (token, key) => {

  const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET

  if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
    throw new Error('JWT secrets not configured in .env')
  }

  const accessSecret = new TextEncoder().encode(JWT_ACCESS_SECRET)
  const refreshSecret = new TextEncoder().encode(JWT_REFRESH_SECRET)

  const secret = key === 'access' ? accessSecret : refreshSecret

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    })
    return { valid: true, payload }
  } catch (err) {
    return { valid: false, error: mapError(err) }
  }
}

const mapError = (err) => {
  if (err.code === 'ERR_JWT_EXPIRED') return 'TOKEN_EXPIRED'
  if (err.code?.startsWith('ERR_JWS') || err.code?.startsWith('ERR_JWT')) return 'INVALID_TOKEN'
  return 'TOKEN_ERROR'
}
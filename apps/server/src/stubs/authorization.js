import { createTokens } from '../jwt/createToken.js'

const users = {
  alice: { id: 'u1', username: 'alice', password: 'secret123', role: 'user' },
}

const ACCESS_TOKEN_EXPIRY = Number(process.env.ACCESS_TOKEN_EXPIRY || 120)
const REFRESH_TOKEN_EXPIRY = Number(process.env.REFRESH_TOKEN_EXPIRY || 300)

export const loginHandler = async (c, req, res) => {
  const { username, password } = req.body

  const user = users[username]
  if (!user || user.password !== password) {
    return res.status(401).json({
      status: 'error',
      created: Date.now(),
      error: 'UNAUTHORIZED',
      message: 'Invalid credentials',
    })
  }

  const { accessToken, refreshToken } = await createTokens(user)

  const ACCESS_COOKIE_EXPIRY = ACCESS_TOKEN_EXPIRY * 1000
  const REFRESH_COOKIE_EXPIRY = REFRESH_TOKEN_EXPIRY * 1000

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: ACCESS_COOKIE_EXPIRY,
  })

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/refresh',
    maxAge: REFRESH_COOKIE_EXPIRY,
  })

  return res.status(200).json({
    status: 'success',
    created: Date.now(),
  })

}

export const logoutHandler = async (c, req, res) => {
  
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  })

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/refresh',
  })

  return res.status(200).json({
    status: 'success',
    created: Date.now(),
  })

}

export const refreshHandler = async (c, req, res) => {
  const user = req.user

  const { accessToken, refreshToken } = await createTokens(user)

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: ACCESS_TOKEN_EXPIRY,
  })

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/refresh',
    maxAge: REFRESH_TOKEN_EXPIRY,
  })

  return res.status(200).json({
    status: 'success',
    created: Date.now(),
  })
}
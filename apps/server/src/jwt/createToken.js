import { SignJWT } from 'jose'

export const createTokens = async (user) => {
    const now = Math.floor(Date.now() / 1000)

    const payload = {
        sub: user.id,
        username: user.username,
        role: user.role || 'user',
        iat: now,
    }

    const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET
    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET

    if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
        throw new Error('JWT secrets not configured in .env')
    }

    const accessSecret = new TextEncoder().encode(JWT_ACCESS_SECRET)
    const refreshSecret = new TextEncoder().encode(JWT_REFRESH_SECRET)

    const ACCESS_TOKEN_EXPIRY = Number(process.env.ACCESS_TOKEN_EXPIRY || 120)
    const REFRESH_TOKEN_EXPIRY = Number(process.env.REFRESH_TOKEN_EXPIRY || 300)

    const accessToken = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(now + ACCESS_TOKEN_EXPIRY)
        .sign(accessSecret)

    const refreshToken = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(now + REFRESH_TOKEN_EXPIRY)
        .sign(refreshSecret)
        
    return { accessToken, refreshToken }
}
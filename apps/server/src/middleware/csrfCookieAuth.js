export default async function csrfCookieAuth(c, req, res) {
    const csrfCookie = req.cookies?.csrfToken
    if (!csrfCookie) {
        c.securityError = 'CSRF_COOKIE_MISSING'
        return false
    }
    c.csrfCookie = csrfCookie
    return true
}
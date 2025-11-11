export default async function csrfHeaderAuth(c, req, res) {
    const csrfHeader = req.get('x-csrf-token')
    const csrfCookie = c.csrfCookie

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        c.securityError = 'CSRF_MISMATCH'
        return false
    }

    return true
}
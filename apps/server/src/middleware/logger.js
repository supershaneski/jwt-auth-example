export default function loggerMiddleware(req, res, next) {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const userAgent = req.get('User-Agent') || 'unknown'
    console.log(
      `[${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - ${userAgent}`
    )
  })

  next()
}
export default function errorLoggerMiddleware(err, req, res, next) {
    console.log(
        `\x1b[31m%s\x1b[0m`,
        `[${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}] ${req.method} ${req.url} ${err.message}`
    )
    next(err)
}

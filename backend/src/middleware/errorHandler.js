export default function errorHandler(err, req, res, _next) {
  console.error(err)
  const status = err.status || 500
  const message = err.message || 'server error'
  res.status(status).json({ message })
}

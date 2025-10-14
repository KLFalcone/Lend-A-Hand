import jwt from 'jsonwebtoken'
import User from '../models/user.js'

export default async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : null
    const token = req.cookies?.token || bearer
    if (!token) return res.status(401).json({ message: 'auth required' })

    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub).select('-password')
    if (!user) return res.status(401).json({ message: 'user not found' })

    req.user = user
    next()
  } catch (_err) {  // <— rename err -> _err
    return res.status(401).json({ message: 'invalid token' })
  }
}

import jwt from 'jsonwebtoken'
import User from '../models/user.js' // if your file is User.js, use '../models/User.js'

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
}

function makeToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export async function register(req, res, next) {
  try {
    const { email, password, name } = req.body
    if (!email || !password) return res.status(400).json({ message: 'email and password required' })

    const exists = await User.findOne({ email })
    if (exists) return res.status(400).json({ message: 'email already registered' })

    const user = await User.create({ email, password, name })
    const token = makeToken(user)
    res.cookie('token', token, cookieOpts)
    res.status(201).json({ user: { _id: user._id, email: user.email, name: user.name, role: user.role } })
  } catch (e) { next(e) }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'email and password required' })

    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword?.(password))) {
      // if you didn’t implement comparePassword in your model, do the check manually:
      // const ok = await bcrypt.compare(password, user.password)
      return res.status(401).json({ message: 'invalid credentials' })
    }
    const token = makeToken(user)
    res.cookie('token', token, cookieOpts)
    res.json({ user: { _id: user._id, email: user.email, name: user.name, role: user.role } })
  } catch (e) { next(e) }
}

export async function logout(req, res, next) {
  try {
    res.clearCookie('token', { ...cookieOpts, maxAge: 0 })
    res.status(204).end()
  } catch (e) { next(e) }
}

export async function me(req, res, next) {
  try {
    res.json({ user: req.user })
  } catch (e) { next(e) }
}

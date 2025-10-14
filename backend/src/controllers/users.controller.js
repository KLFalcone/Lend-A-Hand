import User from '../models/user.js'

export async function list(req, res, next) {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.json(users)
  } catch (e) { next(e) }
}

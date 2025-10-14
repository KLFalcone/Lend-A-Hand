import { Router } from 'express'
import { register, login, logout, me } from '../controllers/auth.controller.js'
import auth from '../middleware/auth.js'

const r = Router()
r.post('/register', register)
r.post('/login', login)
r.post('/logout', logout)
r.get('/me', auth, me)
export default r

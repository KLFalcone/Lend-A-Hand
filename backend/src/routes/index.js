// src/routes/index.js
import { Router } from 'express'
import health from './health.routes.js'
import requests from './requests.routes.js'
import users from './user.routes.js' 
import auth from './auth.routes.js'

const r = Router()
r.use('/health', health)
r.use('/auth', auth)
r.use('/requests', requests)
r.use('/users', users)

export default r

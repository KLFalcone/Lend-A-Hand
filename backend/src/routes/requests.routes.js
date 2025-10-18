import { Router } from 'express'
import * as ctrl from '../controllers/requests.controller.js'
import auth from '../middleware/auth.js'

const r = Router()
r.get('/', ctrl.list)
r.post('/', auth, ctrl.create)
r.get('/:id', ctrl.getOne)
r.patch('/:id', auth, ctrl.update)
r.patch('/:id/accept', auth, ctrl.acceptRequest)
r.delete('/:id', auth, ctrl.remove)
export default r

import { Router } from 'express'
import * as ctrl from '../controllers/requests.controller.js'
import auth from '../middleware/auth.js'

const r = Router()
r.get('/near', ctrl.getNearbyRequests)
r.get('/', ctrl.list)
r.post('/', auth, ctrl.create)
r.get('/:id', ctrl.getOne)
r.patch('/:id', auth, ctrl.update)
r.patch('/:id/accept', auth, ctrl.acceptRequest)
r.patch('/:id/complete', auth, ctrl.markComplete);      // volunteer marks complete
r.patch('/:id/confirm', auth, ctrl.confirmCompletion);  // requester confirms completion
r.patch('/:id/cancel', auth, ctrl.cancelAcceptance);    // volunteer marks as cancelled
r.delete('/:id', auth, ctrl.remove)
export default r

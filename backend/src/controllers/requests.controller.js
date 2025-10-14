import Request from '../models/request.js'

export async function list(req, res, next) {
  try {
    // simple filters example: ?status=open&tag=yard
    const { status, tag } = req.query
    const query = {}
    if (status) query.status = status
    if (tag) query.tags = tag
    const docs = await Request.find(query).sort({ createdAt: -1 })
    res.json(docs)
  } catch (e) { next(e) }
}

export async function create(req, res, next) {
  try {
    const doc = await Request.create({ ...req.body, createdBy: req.user?._id })
    res.status(201).json(doc)
  } catch (e) { next(e) }
}

export async function getOne(req, res, next) {
  try {
    const doc = await Request.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: 'not found' })
    res.json(doc)
  } catch (e) { next(e) }
}

export async function update(req, res, next) {
  try {
    const doc = await Request.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!doc) return res.status(404).json({ message: 'not found' })
    res.json(doc)
  } catch (e) { next(e) }
}

export async function remove(req, res, next) {
  try {
    const doc = await Request.findByIdAndDelete(req.params.id)
    if (!doc) return res.status(404).json({ message: 'not found' })
    res.status(204).end()
  } catch (e) { next(e) }
}

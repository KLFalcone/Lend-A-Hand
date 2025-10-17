import Request from "../models/request.js";

// GET /api/v1/requests
// Supports simple filters: ?status=open&tag=yard
export async function list(req, res, next) {
  try {
    const { status, tag } = req.query;

    const query = {};
    if (status) query.status = status;
    if (tag) query.tags = tag;

    const items = await Request.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "displayName email"); // << show names

    res.json(items);
  } catch (e) {
    next(e);
  }
}

// POST /api/v1/requests (auth required)
// Creates a request owned by the logged-in user
export async function create(req, res, next) {
  try {
    const doc = await Request.create({
      ...req.body,
      createdBy: req.user?._id, // << set owner
    });
    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
}

// GET /api/v1/requests/:id
export async function getOne(req, res, next) {
  try {
    const doc = await Request.findById(req.params.id)
      .populate("createdBy", "displayName email"); // << show names
    if (!doc) return res.status(404).json({ message: "not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
}

// PATCH /api/v1/requests/:id (auth required)
export async function update(req, res, next) {
  try {
    // never allow changing ownership via API
    if ("createdBy" in req.body) delete req.body.createdBy;

    const doc = await Request.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("createdBy", "displayName email"); // keep populated on return

    if (!doc) return res.status(404).json({ message: "not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
}

// DELETE /api/v1/requests/:id (auth required)
export async function remove(req, res, next) {
  try {
    const doc = await Request.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "not found" });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

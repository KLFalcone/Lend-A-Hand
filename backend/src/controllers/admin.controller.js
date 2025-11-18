import User from "../models/user.js";
import Request from "../models/request.js";

// GET /api/v1/admin/users - Get all users
export async function getAllUsers(req, res, next) {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({ users, count: users.length });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/v1/admin/users/:id - Update user (approve, suspend, change role)
export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role if provided
    if (role && !["user", "admin"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Invalid role. Must be 'user' or 'admin'" });
    }

    const updates = {};
    if (role) updates.role = role;

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user, message: "User updated successfully" });
  } catch (e) {
    next(e);
  }
}

// DELETE /api/v1/admin/users/:id - Delete user account
export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Also delete all requests created by this user
    await Request.deleteMany({ createdBy: id });

    res
      .status(200)
      .json({ message: "User and associated requests deleted successfully" });
  } catch (e) {
    next(e);
  }
}

// GET /api/v1/admin/requests - Get all requests (optionally filter by flagged)
export async function getAllRequests(req, res, next) {
  try {
    const { flagged } = req.query;

    const filter = {};
    if (flagged === "true") {
      filter.flagged = true;
    }

    const requests = await Request.find(filter)
      .populate("createdBy", "displayName email")
      .populate("acceptedBy", "displayName email")
      .sort({ createdAt: -1 });

    res.status(200).json({ requests, count: requests.length });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/v1/admin/requests/:id - Update request (flag/unflag, change status)
export async function updateRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { flagged, status } = req.body;

    const updates = {};
    if (typeof flagged === "boolean") updates.flagged = flagged;
    if (status) updates.status = status;

    const request = await Request.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("createdBy", "displayName email")
      .populate("acceptedBy", "displayName email");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    res
      .status(200)
      .json({ request, message: "Request updated successfully" });
  } catch (e) {
    next(e);
  }
}

// DELETE /api/v1/admin/requests/:id - Delete a request
export async function deleteRequest(req, res, next) {
  try {
    const { id } = req.params;

    const request = await Request.findByIdAndDelete(id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.status(200).json({ message: "Request deleted successfully" });
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/v1/admin/feedback
 * Returns a flattened list of all feedback entries across all requests.
 * Each row includes helper, requester, rating, comment, and request info.
 */
export async function getAllFeedback(req, res, next) {
  try {
    const requests = await Request.find({ "feedback.0": { $exists: true } })
      .populate("createdBy", "displayName email")
      .populate("acceptedBy", "displayName email")
      .populate("completedBy", "displayName email")
      .populate("feedback.from", "displayName email")
      .sort({ createdAt: -1 })
      .lean();

    const rows = [];

    for (const r of requests) {
      const helperUser = r.completedBy || r.acceptedBy || null;
      const requesterUser = r.createdBy || null;

      if (!Array.isArray(r.feedback)) continue;

      for (const fb of r.feedback) {
        if (!fb || !fb.from) continue;

        rows.push({
          requestId: r._id,
          requestTitle: r.title,
          requestStatus: r.status,
          rating: fb.rating,
          comment: fb.comment || "",
          createdAt: fb.createdAt || r.createdAt,
          reviewer: {
            _id: fb.from._id,
            displayName: fb.from.displayName || fb.from.email,
            email: fb.from.email,
          },
          helper: helperUser
            ? {
                _id: helperUser._id,
                displayName: helperUser.displayName || helperUser.email,
                email: helperUser.email,
              }
            : null,
          requester: requesterUser
            ? {
                _id: requesterUser._id,
                displayName: requesterUser.displayName || requesterUser.email,
                email: requesterUser.email,
              }
            : null,
        });
      }
    }

    res.status(200).json({ feedback: rows, count: rows.length });
  } catch (e) {
    next(e);
  }
}

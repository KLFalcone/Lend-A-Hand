import User from "../models/user.js";

// GET /api/v1/users/me
export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user._id)
      .select("_id email displayName role address phone availability profilePic");
    if (!user) return res.status(401).json({ message: "Unauthenticated" });
    res.json({ user });
  } catch (e) { next(e); }
}

// PATCH /api/v1/users/me
export async function updateMe(req, res, next) {
  try {
    const updates = {};
    const take = (k) => {
      const v = req.body?.[k];
      if (typeof v === "string") updates[k] = v.trim();
    };
    ["displayName", "address", "phone", "availability", "profilePic"].forEach(take);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      {
        new: true,
        runValidators: true,
        fields: "_id email displayName role address phone availability profilePic",
      }
    );

    if (!user) return res.status(401).json({ message: "Unauthenticated" });
    res.json({ user });
  } catch (e) { next(e); }
}

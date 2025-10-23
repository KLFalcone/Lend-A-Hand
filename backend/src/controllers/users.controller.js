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

// DELETE /api/v1/users/me
export async function deleteMe(req, res, next) {
    try {
        const userId = req.user?._id || req.user?.id || req.user?.sub;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthenticated' });
        }

        const Request = (await import('../models/request.js')).default;

        // Delete all requests created by this user
        await Request.deleteMany({ createdBy: userId });

        // Delete the user
        await User.findByIdAndDelete(userId);

        // Clear the auth cookie
        res.clearCookie('token', {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 0,
        });

        return res.status(200).json({ message: 'Account deleted successfully' });
    } catch (e) {
        next(e);
    }
}

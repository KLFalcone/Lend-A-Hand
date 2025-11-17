import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
};

function makeToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/v1/auth/register
export async function register(req, res, next) {
  try {
    const { email, password, displayName: dn, name, address = '' } = req.body;
    // accept either displayName or legacy "name"
    const displayName = (dn ?? name ?? '').trim();

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password required' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'email already registered' });

    const user = await User.create({ email, password, displayName, address });
    const token = makeToken(user);
    res.cookie('token', token, cookieOpts);

    return res.status(201).json({
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        address: user.address ?? '',
        profilePic: user.profilePic ?? '',
      },
    });
  } catch (e) {
    next(e);
  }
}

// POST /api/v1/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'invalid credentials' });

    const ok = await user.comparePassword?.(password);
    if (!ok) return res.status(401).json({ message: 'invalid credentials' });

    const token = makeToken(user);
    res.cookie('token', token, cookieOpts);

    return res.json({
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        address: user.address ?? '',
        phone: user.phone ?? '',
        availability: user.availability ?? '',
        profilePic: user.profilePic ?? '',
      },
    });
  } catch (e) {
    next(e);
  }
}

// POST /api/v1/auth/logout
export async function logout(req, res, next) {
  try {
    res.clearCookie('token', { ...cookieOpts, maxAge: 0 });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

// GET /api/v1/auth/me
export async function me(req, res, next) {
  try {
    // support either a full user on req.user or just a token payload
    const id = req.user?._id || req.user?.id || req.user?.sub;
    if (!id) return res.status(401).json({ message: 'Unauthenticated' });

    // IMPORTANT: reload from DB so we return the latest profile fields
    const user = await User.findById(id)
      .select('_id email displayName role address phone availability profilePic');

    if (!user) return res.status(401).json({ message: 'Unauthenticated' });

    return res.json({ user });
  } catch (e) {
    next(e);
  }
}

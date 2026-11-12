const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/token');

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, picture: u.picture, role: u.role, createdAt: u.createdAt });

// Sign-up AND sign-in in one step. The frontend sends the Google ID token ("credential")
// obtained from Google Identity Services; we verify its signature, audience and expiry.
exports.googleLogin = asyncHandler(async (req, res) => {
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: env.GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(401, 'Invalid Google credential');
  }
  if (!payload || !payload.sub || !payload.email || !payload.email_verified) {
    throw new ApiError(401, 'Your Google account email is not verified');
  }

  const email = payload.email.toLowerCase();
  const shouldBeAdmin = env.adminEmails.includes(email);
  const existing = await prisma.user.findUnique({ where: { googleId: payload.sub }, select: { id: true } });

  const user = await prisma.user.upsert({
    where: { googleId: payload.sub },
    create: {
      googleId: payload.sub,
      email,
      name: payload.name || email.split('@')[0],
      picture: payload.picture || null,
      role: shouldBeAdmin ? 'ADMIN' : 'STUDENT',
    },
    update: {
      email,
      name: payload.name || undefined,
      picture: payload.picture || null,
      ...(shouldBeAdmin ? { role: 'ADMIN' } : {}),
    },
  });

  res.status(existing ? 200 : 201).json({ token: signToken(user), user: publicUser(user), isNewUser: !existing });
});

exports.me = (req, res) => res.json({ user: publicUser(req.user) });

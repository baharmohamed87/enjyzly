import 'dotenv/config';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { prisma } from '../lib/prisma.js';

export default (passport) => {
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: Number(id) },
      });
      done(null, user ?? undefined);
    } catch (err) {
      done(err);
    }
  });

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }

  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: secret,
      },
      async (payload, done) => {
        try {
          if (typeof payload.id !== 'number') {
            return done(null, false);
          }

          const user = await prisma.user.findUnique({
            where: { id: payload.id },
          });
          if (user) {
            return done(null, user);
          }
          return done(null, false);
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );
};

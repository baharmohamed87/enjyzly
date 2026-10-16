import 'dotenv/config';
import express from 'express';
import passport from 'passport';
import configurePassport from './config/passport.js';
import { publicUser } from './lib/auth.js';
import { requireAuth } from './middleware/requireAuth.js';
import authRouter from './routes/auth.js';
import serviceRouter from './routes/services.js';
import providerRouter from './routes/providers.js';
import requestRouter from './routes/requests.js';
import offerRouter from './routes/offers.js';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

configurePassport(passport);

const app = express();
app.use(express.json());
app.use(passport.initialize());

app.use('/auth', authRouter);
app.use('/services', serviceRouter);
app.use('/providers', providerRouter);
app.use('/requests', requestRouter);
app.use('/offers', offerRouter);

app.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Listening on ${port}`);
});

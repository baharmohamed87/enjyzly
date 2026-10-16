import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import * as providerController from '../controllers/providerController.js';

const router = Router();

// Register as a provider (any authenticated user)
router.post('/', requireAuth, providerController.register);

// View provider profile (public)
router.get('/:id', providerController.getProfile);

// Provider manages their offered services
router.post('/:id/services', requireAuth, requireRole('SERVICEPROV'), providerController.addService);
router.delete('/:id/services/:serviceId', requireAuth, requireRole('SERVICEPROV'), providerController.removeService);

// Provider views their own offers — must be before /:id to avoid conflict
router.get('/me/offers', requireAuth, requireRole('SERVICEPROV'), providerController.listMyOffers);

export default router;

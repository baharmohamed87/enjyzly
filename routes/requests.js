import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import * as requestController from '../controllers/requestController.js';
import * as offerController from '../controllers/offerController.js';

const router = Router();

// Customer creates a request
router.post('/', requireAuth, requestController.create);

// Customer lists their own requests — must be before /:id
router.get('/me', requireAuth, requestController.listMine);

// View a single request (owner / offering provider / admin)
router.get('/:id', requireAuth, requestController.getById);

// Customer cancels their request
router.patch('/:id/cancel', requireAuth, requestController.cancel);

// Provider submits an offer on a request
router.post('/:requestId/offers', requireAuth, requireRole('SERVICEPROV'), offerController.create);

export default router;

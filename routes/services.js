import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import * as serviceController from '../controllers/serviceController.js';

const router = Router();

// Public
router.get('/', serviceController.list);
router.get('/:id', serviceController.getById);

// Admin only
router.post('/', requireAuth, requireRole('ADMIN'), serviceController.create);
router.put('/:id', requireAuth, requireRole('ADMIN'), serviceController.update);
router.delete('/:id', requireAuth, requireRole('ADMIN'), serviceController.remove);

export default router;

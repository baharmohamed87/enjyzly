import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import * as offerController from '../controllers/offerController.js';

const router = Router();

// Request owner accepts or rejects an offer
router.patch('/:id/accept', requireAuth, offerController.accept);
router.patch('/:id/reject', requireAuth, offerController.reject);

export default router;

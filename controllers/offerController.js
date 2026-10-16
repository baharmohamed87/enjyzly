import { prisma } from '../lib/prisma.js';

/**
 * POST /requests/:requestId/offers — provider submits an offer on a request
 */
export async function create(req, res) {
  const requestId = Number(req.params.requestId);
  const price = typeof req.body?.price === 'number' ? req.body.price : Number(req.body?.price);

  if (!price || isNaN(price) || price <= 0) {
    return res.status(400).json({ error: 'a valid price is required' });
  }

  // Look up the provider profile for the logged-in user
  const provider = await prisma.provider.findUnique({
    where: { userId: req.user.id },
    include: { providerServices: true },
  });

  if (!provider) {
    return res.status(403).json({ error: 'you must be a registered provider to make offers' });
  }

  // Verify the request exists and is still open
  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request) {
    return res.status(404).json({ error: 'request not found' });
  }

  if (request.status !== 'PENDING') {
    return res.status(400).json({ error: 'can only make offers on pending requests' });
  }

  // Verify the provider actually offers this service
  const offersService = provider.providerServices.some((ps) => ps.serviceId === request.serviceId);
  if (!offersService) {
    return res.status(403).json({ error: 'you do not offer the service this request is for' });
  }

  // Prevent duplicate offers
  const existingOffer = await prisma.offer.findFirst({
    where: { providerId: provider.id, requestId },
  });
  if (existingOffer) {
    return res.status(409).json({ error: 'you have already made an offer on this request' });
  }

  const offer = await prisma.offer.create({
    data: { providerId: provider.id, requestId, price },
    include: { provider: { include: { user: { select: { id: true, name: true } } } } },
  });

  return res.status(201).json({ offer });
}

/**
 * PATCH /offers/:id/accept — request owner accepts an offer
 */
export async function accept(req, res) {
  const id = Number(req.params.id);

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { request: true },
  });

  if (!offer) {
    return res.status(404).json({ error: 'offer not found' });
  }

  // Only the request owner can accept
  if (offer.request.userId !== req.user.id) {
    return res.status(403).json({ error: 'only the request owner can accept offers' });
  }

  if (offer.request.status !== 'PENDING') {
    return res.status(400).json({ error: 'this request is no longer pending' });
  }

  // Accept: update request status to ACCEPTED
  const updated = await prisma.request.update({
    where: { id: offer.requestId },
    data: { status: 'ACCEPTED' },
    include: {
      service: true,
      offer: {
        include: { provider: { include: { user: { select: { id: true, name: true } } } } },
      },
    },
  });

  return res.json({ request: updated });
}

/**
 * PATCH /offers/:id/reject — request owner rejects an offer
 */
export async function reject(req, res) {
  const id = Number(req.params.id);

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { request: true },
  });

  if (!offer) {
    return res.status(404).json({ error: 'offer not found' });
  }

  if (offer.request.userId !== req.user.id) {
    return res.status(403).json({ error: 'only the request owner can reject offers' });
  }

  // Delete the rejected offer
  await prisma.offer.delete({ where: { id } });

  return res.json({ message: 'offer rejected' });
}

import { prisma } from '../lib/prisma.js';

/**
 * POST /requests — customer creates a new service request
 */
export async function create(req, res) {
  const serviceId = typeof req.body?.serviceId === 'number' ? req.body.serviceId : Number(req.body?.serviceId);
  const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';

  if (!serviceId || isNaN(serviceId)) {
    return res.status(400).json({ error: 'serviceId is required' });
  }

  if (!description) {
    return res.status(400).json({ error: 'description is required' });
  }

  // Verify the service exists
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    return res.status(404).json({ error: 'service not found' });
  }

  const request = await prisma.request.create({
    data: {
      userId: req.user.id,
      serviceId,
      description,
    },
    include: { service: true },
  });

  return res.status(201).json({ request });
}

/**
 * GET /requests/me — customer lists their own requests
 */
export async function listMine(req, res) {
  const requests = await prisma.request.findMany({
    where: { userId: req.user.id },
    include: {
      service: true,
      offer: {
        include: {
          provider: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ requests });
}

/**
 * GET /requests/:id — get a single request (owner or provider who offered)
 */
export async function getById(req, res) {
  const id = Number(req.params.id);

  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      service: true,
      user: { select: { id: true, name: true, email: true } },
      offer: {
        include: {
          provider: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      },
    },
  });

  if (!request) {
    return res.status(404).json({ error: 'request not found' });
  }

  // Allow access if: owner, admin, or a provider who has an offer on this request
  const isOwner = request.userId === req.user.id;
  const isAdmin = req.user.role === 'ADMIN';
  const isOfferingProvider = request.offer.some((o) => o.provider.userId === req.user.id);

  if (!isOwner && !isAdmin && !isOfferingProvider) {
    return res.status(403).json({ error: 'access denied' });
  }

  return res.json({ request });
}

/**
 * PATCH /requests/:id/cancel — customer cancels their own request
 */
export async function cancel(req, res) {
  const id = Number(req.params.id);

  const request = await prisma.request.findUnique({ where: { id } });
  if (!request) {
    return res.status(404).json({ error: 'request not found' });
  }

  if (request.userId !== req.user.id) {
    return res.status(403).json({ error: 'you can only cancel your own requests' });
  }

  if (request.status === 'CANCELLED' || request.status === 'DONE') {
    return res.status(400).json({ error: `cannot cancel a request that is ${request.status.toLowerCase()}` });
  }

  const updated = await prisma.request.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: { service: true },
  });

  return res.json({ request: updated });
}

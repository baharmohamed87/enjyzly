import { prisma } from '../lib/prisma.js';

/**
 * POST /providers — authenticated user registers as a service provider
 */
export async function register(req, res) {
  const userId = req.user.id;

  // Check if already a provider
  const existing = await prisma.provider.findUnique({ where: { userId } });
  if (existing) {
    return res.status(409).json({ error: 'you are already registered as a provider' });
  }

  const provider = await prisma.provider.create({ data: { userId } });

  // Upgrade the user's role to SERVICEPROV
  await prisma.user.update({
    where: { id: userId },
    data: { role: 'SERVICEPROV' },
  });

  return res.status(201).json({ provider });
}

/**
 * GET /providers/:id — get a provider profile with their services
 */
export async function getProfile(req, res) {
  const provider = await prisma.provider.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      user: { select: { id: true, name: true, email: true } },
      providerServices: {
        include: { service: true },
      },
    },
  });

  if (!provider) {
    return res.status(404).json({ error: 'provider not found' });
  }

  return res.json({ provider });
}

/**
 * POST /providers/:id/services — provider adds a service they offer
 */
export async function addService(req, res) {
  const providerId = Number(req.params.id);
  const serviceId = typeof req.body?.serviceId === 'number' ? req.body.serviceId : Number(req.body?.serviceId);

  // Verify the logged-in user owns this provider profile
  const provider = await prisma.provider.findUnique({ where: { id: providerId } });
  if (!provider || provider.userId !== req.user.id) {
    return res.status(403).json({ error: 'you can only manage your own provider profile' });
  }

  if (!serviceId || isNaN(serviceId)) {
    return res.status(400).json({ error: 'serviceId is required' });
  }

  try {
    const ps = await prisma.providerServices.create({
      data: { providerId, serviceId },
      include: { service: true },
    });
    return res.status(201).json({ providerService: ps });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'you already offer this service' });
    }
    if (err.code === 'P2003') {
      return res.status(404).json({ error: 'service not found' });
    }
    throw err;
  }
}

/**
 * DELETE /providers/:id/services/:serviceId — provider removes a service they offer
 */
export async function removeService(req, res) {
  const providerId = Number(req.params.id);
  const serviceId = Number(req.params.serviceId);

  // Verify ownership
  const provider = await prisma.provider.findUnique({ where: { id: providerId } });
  if (!provider || provider.userId !== req.user.id) {
    return res.status(403).json({ error: 'you can only manage your own provider profile' });
  }

  try {
    await prisma.providerServices.delete({
      where: { providerId_serviceId: { providerId, serviceId } },
    });
    return res.json({ message: 'service removed from your profile' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'service not found in your profile' });
    }
    throw err;
  }
}

/**
 * GET /providers/me/offers — provider sees all offers they've made
 */
export async function listMyOffers(req, res) {
  const provider = await prisma.provider.findUnique({
    where: { userId: req.user.id },
  });

  if (!provider) {
    return res.status(404).json({ error: 'you are not registered as a provider' });
  }

  const offers = await prisma.offer.findMany({
    where: { providerId: provider.id },
    include: {
      request: {
        include: {
          service: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ offers });
}

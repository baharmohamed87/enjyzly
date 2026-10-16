import { prisma } from '../lib/prisma.js';

/**
 * GET /services — list all services, optionally filter by category
 */
export async function list(req, res) {
  const where = {};
  if (req.query.category) {
    where.category = req.query.category;
  }

  const services = await prisma.service.findMany({ where, orderBy: { name: 'asc' } });
  return res.json({ services });
}

/**
 * GET /services/:id — get a single service with its providers
 */
export async function getById(req, res) {
  const service = await prisma.service.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      providerServices: {
        include: { provider: { include: { user: { select: { id: true, name: true, email: true } } } } },
      },
    },
  });

  if (!service) {
    return res.status(404).json({ error: 'service not found' });
  }

  return res.json({ service });
}

/**
 * POST /services — admin creates a new service
 */
export async function create(req, res) {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const category = typeof req.body?.category === 'string' ? req.body.category : '';

  if (!name || !category) {
    return res.status(400).json({ error: 'name and category are required' });
  }

  const service = await prisma.service.create({ data: { name, category } });
  return res.status(201).json({ service });
}

/**
 * PUT /services/:id — admin updates a service
 */
export async function update(req, res) {
  const id = Number(req.params.id);
  const data = {};

  if (typeof req.body?.name === 'string') data.name = req.body.name.trim();
  if (typeof req.body?.category === 'string') data.category = req.body.category;

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'nothing to update' });
  }

  try {
    const service = await prisma.service.update({ where: { id }, data });
    return res.json({ service });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'service not found' });
    }
    throw err;
  }
}

/**
 * DELETE /services/:id — admin removes a service
 */
export async function remove(req, res) {
  const id = Number(req.params.id);

  try {
    await prisma.service.delete({ where: { id } });
    return res.json({ message: 'service deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'service not found' });
    }
    throw err;
  }
}

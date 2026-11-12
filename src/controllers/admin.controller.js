const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Generic CRUD for an admin-managed Prisma model. Admins see the full record (incl. answer keys).
module.exports = (delegate) => ({
  list: asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const [data, total] = await Promise.all([
      prisma[delegate].findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma[delegate].count(),
    ]);
    res.json({ data, meta: { page, limit, total } });
  }),
  get: asyncHandler(async (req, res) => {
    const item = await prisma[delegate].findUnique({ where: { id: req.params.id } });
    if (!item) throw new ApiError(404, 'Not found');
    res.json({ data: item });
  }),
  create: asyncHandler(async (req, res) => {
    const item = await prisma[delegate].create({ data: req.body });
    res.status(201).json({ data: item });
  }),
  update: asyncHandler(async (req, res) => {
    const item = await prisma[delegate].update({ where: { id: req.params.id }, data: req.body }); // P2025 -> 404
    res.json({ data: item });
  }),
  remove: asyncHandler(async (req, res) => {
    await prisma[delegate].delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
});

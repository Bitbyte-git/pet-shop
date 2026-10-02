const Client = require('../models/Client');
const Pet = require('../models/Pet');
const ProductBilling = require('../models/ProductBilling');
const ClinicBilling = require('../models/ClinicBilling');

const getClients = async (query = {}) => {
  const { search, status, page = 1, limit = 20 } = query;
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
      { clientId: { $regex: search, $options: 'i' } },
    ];
  }
  const skip = (page - 1) * limit;
  const [clients, total] = await Promise.all([
    Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Client.countDocuments(filter),
  ]);
  // Attach pet count
  const clientsWithPets = await Promise.all(
    clients.map(async (c) => {
      const petCount = await Pet.countDocuments({ owner: c._id, status: 'ACTIVE' });
      return { ...c.toObject(), petCount };
    })
  );
  return { clients: clientsWithPets, total, page: Number(page), limit: Number(limit) };
};

const getClientById = async (id) => {
  const client = await Client.findById(id);
  if (!client) throw { statusCode: 404, message: 'Client not found.' };
  const [pets, productBills, clinicBills] = await Promise.all([
    Pet.find({ owner: id, status: { $ne: 'DECEASED' } }),
    ProductBilling.find({ client: id }).sort({ createdAt: -1 }),
    ClinicBilling.find({ client: id }).sort({ createdAt: -1 }),
  ]);
  return { ...client.toObject(), pets, productBills, clinicBills };
};

const createClient = async (data, userId) => {
  const existing = await Client.findOne({ mobile: data.mobile });
  if (existing) throw { statusCode: 400, message: 'A client with this mobile number already exists.' };
  const client = await Client.create({ ...data, createdBy: userId });
  return client;
};

const updateClient = async (id, data, userId) => {
  if (data.mobile) {
    const existing = await Client.findOne({ mobile: data.mobile, _id: { $ne: id } });
    if (existing) throw { statusCode: 400, message: 'Mobile number already in use by another client.' };
  }
  const client = await Client.findByIdAndUpdate(
    id,
    { ...data, updatedBy: userId },
    { new: true, runValidators: true }
  );
  if (!client) throw { statusCode: 404, message: 'Client not found.' };
  return client;
};

const searchClients = async (search) => {
  const filter = { status: 'ACTIVE' };
  if (search && search.trim().length > 0) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
      { clientId: { $regex: search, $options: 'i' } },
    ];
  }
  return Client.find(filter).sort({ createdAt: -1 }).limit(15);
};

module.exports = { getClients, getClientById, createClient, updateClient, searchClients };

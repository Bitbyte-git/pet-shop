const clientService = require('../services/client.service');

const getClients = async (req, res) => {
  const result = await clientService.getClients(req.query);
  res.json({ success: true, ...result });
};

const getClientById = async (req, res) => {
  const result = await clientService.getClientById(req.params.id);
  res.json({ success: true, client: result });
};

const createClient = async (req, res) => {
  const client = await clientService.createClient(req.body, req.user._id);
  res.status(201).json({ success: true, message: 'Client created successfully.', client });
};

const updateClient = async (req, res) => {
  const client = await clientService.updateClient(req.params.id, req.body, req.user._id);
  res.json({ success: true, message: 'Client updated successfully.', client });
};

const searchClients = async (req, res) => {
  const clients = await clientService.searchClients(req.query.q);
  res.json({ success: true, clients });
};

module.exports = { getClients, getClientById, createClient, updateClient, searchClients };

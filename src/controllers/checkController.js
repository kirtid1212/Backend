const Address = require('../models/Address');

class CheckController {
  static async getCapabilities(req, res) {
    res.json({
      can_create: true,
      can_update: true,
      can_delete: true,
      can_set_default: true,
      rate_limit_enabled: true,
      authenticated: true
    });
  }

  static async getAction(req, res) {
    res.json({
      action: 'GET_ADDRESSES',
      allowed: true,
      authenticated: true
    });
  }

  static async createAction(req, res) {
    res.json({
      action: 'CREATE_ADDRESS',
      allowed: true,
      rate_limit_enabled: true,
      authenticated: true
    });
  }

  static async updateAction(req, res) {
    res.json({
      action: 'UPDATE_ADDRESS',
      allowed: true,
      requires_address_id: true,
      authenticated: true
    });
  }

  static async deleteAction(req, res) {
    res.json({
      action: 'DELETE_ADDRESS',
      allowed: true,
      requires_address_id: true,
      authenticated: true
    });
  }

  static async setDefaultAction(req, res) {
    res.json({
      action: 'SET_DEFAULT_ADDRESS',
      allowed: true,
      requires_address_id: true,
      authenticated: true
    });
  }

  static async dbCheck(req, res) {
    try {
      const count = await Address.countDocuments({ user_id: req.user.id });
      res.json({
        service: 'Address Database',
        status: 'OK',
        total_addresses: count,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        service: 'Address Database',
        status: 'FAILED',
        error: 'Database not reachable'
      });
    }
  }
}

module.exports = CheckController;
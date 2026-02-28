import { Router } from 'express';
import { OrganizationService } from '../services/organization.service';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const orgService = new OrganizationService();

// All routes require authentication
router.use(authenticateToken);

// Create organization (system_admin only)
router.post(
  '/',
  requireRole('system_admin'),
  async (req: AuthRequest, res) => {
    try {
      const { name, type } = req.body;

      if (!name || !type) {
        return res.status(400).json({ error: 'Name and type are required' });
      }

      if (!['police', 'medical'].includes(type)) {
        return res.status(400).json({ error: 'Type must be police or medical' });
      }

      const org = await orgService.createOrganization(name, type);
      res.status(201).json(org);
    } catch (error) {
      console.error('Create organization error:', error);
      res.status(500).json({ error: 'Failed to create organization' });
    }
  }
);

// List all organizations (system_admin only)
router.get(
  '/',
  requireRole('system_admin'),
  async (req: AuthRequest, res) => {
    try {
      const orgs = await orgService.listOrganizations();
      res.json(orgs);
    } catch (error) {
      console.error('List organizations error:', error);
      res.status(500).json({ error: 'Failed to list organizations' });
    }
  }
);

// Get organization by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userOrgId = req.user?.['custom:org_id'];

    // Users can only view their own organization unless they're system_admin
    if (userOrgId !== id && req.user?.['custom:role'] !== 'system_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const org = await orgService.getOrganization(id);
    
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(org);
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: 'Failed to get organization' });
  }
});

// Update organization (system_admin only)
router.patch(
  '/:id',
  requireRole('system_admin'),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const org = await orgService.updateOrganization(id, updates);
      
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      res.json(org);
    } catch (error) {
      console.error('Update organization error:', error);
      res.status(500).json({ error: 'Failed to update organization' });
    }
  }
);

// Delete organization (system_admin only)
router.delete(
  '/:id',
  requireRole('system_admin'),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await orgService.deleteOrganization(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Delete organization error:', error);
      res.status(500).json({ error: 'Failed to delete organization' });
    }
  }
);

export default router;

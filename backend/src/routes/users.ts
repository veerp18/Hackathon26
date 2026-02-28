import { Router } from 'express';
import { UserService } from '../services/user.service';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const userService = new UserService();

router.use(authenticateToken);

// Create user (system_admin only)
router.post(
  '/',
  requireRole('system_admin'),
  async (req: AuthRequest, res) => {
    try {
      const { cognitoSub, orgId, email, role, supervisorId } = req.body;

      if (!cognitoSub || !orgId || !email || !role) {
        return res.status(400).json({ 
          error: 'cognitoSub, orgId, email, and role are required' 
        });
      }

      const user = await userService.createUser(
        cognitoSub,
        orgId,
        email,
        role,
        supervisorId
      );
      
      res.status(201).json(user);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

// Get current user profile
router.get('/me', async (req: AuthRequest, res) => {
  try {
    const cognitoSub = req.user?.sub;
    
    if (!cognitoSub) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await userService.getUserByCognitoSub(cognitoSub);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// List users in organization
router.get('/organization/:orgId', async (req: AuthRequest, res) => {
  try {
    const { orgId } = req.params;
    const userOrgId = req.user?.['custom:org_id'];

    // Users can only list users in their own organization
    if (userOrgId !== orgId && req.user?.['custom:role'] !== 'system_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await userService.listUsersByOrganization(orgId);
    res.json(users);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// Get user by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userOrgId = req.user?.['custom:org_id'];
    
    // Users can only view users in their own organization
    if (user.org_id !== userOrgId && req.user?.['custom:role'] !== 'system_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;

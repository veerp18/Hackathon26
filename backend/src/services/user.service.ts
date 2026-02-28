import { query } from '../db/client';
import { User, UserRole } from '../types';

export class UserService {
  async createUser(
    cognitoSub: string,
    orgId: string,
    email: string,
    role: UserRole,
    supervisorId?: string
  ): Promise<User> {
    const result = await query(
      `INSERT INTO users (cognito_sub, org_id, email, role, supervisor_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [cognitoSub, orgId, email, role, supervisorId || null]
    );
    return result.rows[0];
  }

  async getUserByCognitoSub(cognitoSub: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE cognito_sub = $1',
      [cognitoSub]
    );
    return result.rows[0] || null;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async listUsersByOrganization(orgId: string): Promise<User[]> {
    const result = await query(
      'SELECT * FROM users WHERE org_id = $1 ORDER BY created_at DESC',
      [orgId]
    );
    return result.rows;
  }

  async getSubordinates(supervisorId: string): Promise<User[]> {
    const result = await query(
      'SELECT * FROM users WHERE supervisor_id = $1',
      [supervisorId]
    );
    return result.rows;
  }

  async updateUser(
    id: string,
    updates: Partial<Pick<User, 'email' | 'role' | 'supervisor_id'>>
  ): Promise<User | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.email) {
      fields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }
    if (updates.role) {
      fields.push(`role = $${paramCount++}`);
      values.push(updates.role);
    }
    if (updates.supervisor_id !== undefined) {
      fields.push(`supervisor_id = $${paramCount++}`);
      values.push(updates.supervisor_id);
    }

    if (fields.length === 0) {
      return this.getUserById(id);
    }

    values.push(id);
    const result = await query(
      `UPDATE users 
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}

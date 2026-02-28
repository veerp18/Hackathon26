import { query } from '../db/client';
import { Organization } from '../types';

export class OrganizationService {
  async createOrganization(
    name: string,
    type: 'police' | 'medical'
  ): Promise<Organization> {
    const result = await query(
      `INSERT INTO organizations (name, type)
       VALUES ($1, $2)
       RETURNING *`,
      [name, type]
    );
    return result.rows[0];
  }

  async getOrganization(id: string): Promise<Organization | null> {
    const result = await query(
      'SELECT * FROM organizations WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async listOrganizations(): Promise<Organization[]> {
    const result = await query('SELECT * FROM organizations ORDER BY created_at DESC');
    return result.rows;
  }

  async updateOrganization(
    id: string,
    updates: Partial<Pick<Organization, 'name' | 'type'>>
  ): Promise<Organization | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.type) {
      fields.push(`type = $${paramCount++}`);
      values.push(updates.type);
    }

    if (fields.length === 0) {
      return this.getOrganization(id);
    }

    values.push(id);
    const result = await query(
      `UPDATE organizations 
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async deleteOrganization(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM organizations WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}

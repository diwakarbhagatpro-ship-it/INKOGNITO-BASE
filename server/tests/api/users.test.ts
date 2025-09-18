import { describe, it, expect, beforeEach } from 'vitest';
import { supabaseStorage } from '../../supabaseStorage';
import { createTestUser, cleanupTestData } from '../setup';

describe('Users API', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('getUser', () => {
    it('should return user when found', async () => {
      const testUser = await createTestUser({
        email: 'test@example.com',
        name: 'Test User',
        role: 'blind_user',
        is_active: true
      });

      const user = await supabaseStorage.getUser(testUser.id);
      
      expect(user).toBeDefined();
      expect(user?.id).toBe(testUser.id);
      expect(user?.email).toBe('test@example.com');
    });

    it('should return undefined when user not found', async () => {
      const user = await supabaseStorage.getUser('non-existent-id');
      expect(user).toBeUndefined();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      const testUser = await createTestUser({
        email: 'test@example.com',
        name: 'Test User',
        role: 'blind_user',
        is_active: true
      });

      const user = await supabaseStorage.getUserByEmail('test@example.com');
      
      expect(user).toBeDefined();
      expect(user?.id).toBe(testUser.id);
      expect(user?.email).toBe('test@example.com');
    });

    it('should return undefined when email not found', async () => {
      const user = await supabaseStorage.getUserByEmail('nonexistent@example.com');
      expect(user).toBeUndefined();
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        name: 'New User',
        role: 'volunteer' as const,
        phone_number: '+1234567890',
        location: { lat: 40.7128, lng: -74.0060, address: 'New York, NY' },
        languages: ['English', 'Spanish'],
        preferences: { ttsEnabled: true }
      };

      const user = await supabaseStorage.createUser(userData);
      
      expect(user).toBeDefined();
      expect(user.email).toBe('newuser@example.com');
      expect(user.name).toBe('New User');
      expect(user.role).toBe('volunteer');
    });

    it('should throw error for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        name: '',
        role: 'invalid_role' as any
      };

      await expect(supabaseStorage.createUser(invalidData)).rejects.toThrow();
    });
  });

  describe('updateUser', () => {
    it('should update user data', async () => {
      const testUser = await createTestUser({
        email: 'test@example.com',
        name: 'Test User',
        role: 'blind_user',
        is_active: true
      });

      const updates = {
        name: 'Updated Name',
        phone_number: '+1234567890'
      };

      const updatedUser = await supabaseStorage.updateUser(testUser.id, updates);
      
      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.phone_number).toBe('+1234567890');
    });

    it('should throw error when updating non-existent user', async () => {
      await expect(supabaseStorage.updateUser('non-existent-id', { name: 'Test' })).rejects.toThrow();
    });
  });

  describe('getUsersByRole', () => {
    it('should return users by role', async () => {
      await createTestUser({
        email: 'volunteer1@example.com',
        name: 'Volunteer 1',
        role: 'volunteer',
        is_active: true
      });

      await createTestUser({
        email: 'volunteer2@example.com',
        name: 'Volunteer 2',
        role: 'volunteer',
        is_active: true
      });

      await createTestUser({
        email: 'user@example.com',
        name: 'User',
        role: 'blind_user',
        is_active: true
      });

      const volunteers = await supabaseStorage.getUsersByRole('volunteer');
      
      expect(volunteers).toHaveLength(2);
      expect(volunteers.every(u => u.role === 'volunteer')).toBe(true);
    });
  });

  describe('getAvailableVolunteers', () => {
    it('should return only active volunteers', async () => {
      await createTestUser({
        email: 'active@example.com',
        name: 'Active Volunteer',
        role: 'volunteer',
        is_active: true
      });

      await createTestUser({
        email: 'inactive@example.com',
        name: 'Inactive Volunteer',
        role: 'volunteer',
        is_active: false
      });

      const volunteers = await supabaseStorage.getAvailableVolunteers();
      
      expect(volunteers).toHaveLength(1);
      expect(volunteers[0].is_active).toBe(true);
    });
  });
});
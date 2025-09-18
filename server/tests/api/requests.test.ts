import { describe, it, expect, beforeEach } from 'vitest';
import { supabaseStorage } from '../../supabaseStorage';
import { createTestUser, createTestRequest, cleanupTestData } from '../setup';

describe('Scribe Requests API', () => {
  let testUser: any;

  beforeEach(async () => {
    await cleanupTestData();
    testUser = await createTestUser({
      email: 'test@example.com',
      name: 'Test User',
      role: 'blind_user',
      is_active: true
    });
  });

  describe('createScribeRequest', () => {
    it('should create a new scribe request', async () => {
      const requestData = {
        user_id: testUser.id,
        title: 'Math Final Exam',
        description: 'Need help with mathematics final exam',
        exam_type: 'final',
        subject: 'Mathematics',
        scheduled_date: new Date().toISOString(),
        duration: 120,
        location: { lat: 40.7128, lng: -74.0060, address: 'New York, NY' },
        urgency: 'normal',
        special_requirements: 'Large print materials',
        estimated_difficulty: 3,
        status: 'pending'
      };

      const request = await supabaseStorage.createScribeRequest(requestData);
      
      expect(request).toBeDefined();
      expect(request.title).toBe('Math Final Exam');
      expect(request.user_id).toBe(testUser.id);
      expect(request.status).toBe('pending');
    });

    it('should throw error for invalid data', async () => {
      const invalidData = {
        user_id: testUser.id,
        title: '', // Empty title should fail
        scheduled_date: 'invalid-date'
      };

      await expect(supabaseStorage.createScribeRequest(invalidData)).rejects.toThrow();
    });
  });

  describe('getScribeRequest', () => {
    it('should return request with user data', async () => {
      const testRequest = await createTestRequest({
        user_id: testUser.id,
        title: 'Test Request',
        scheduled_date: new Date().toISOString(),
        duration: 60,
        location: { lat: 40.7128, lng: -74.0060, address: 'Test Location' },
        status: 'pending'
      });

      const request = await supabaseStorage.getScribeRequest(testRequest.id);
      
      expect(request).toBeDefined();
      expect(request?.id).toBe(testRequest.id);
      expect(request?.user).toBeDefined();
      expect(request?.user.id).toBe(testUser.id);
    });

    it('should return undefined when request not found', async () => {
      const request = await supabaseStorage.getScribeRequest('non-existent-id');
      expect(request).toBeUndefined();
    });
  });

  describe('getScribeRequestsByUser', () => {
    it('should return requests for specific user', async () => {
      await createTestRequest({
        user_id: testUser.id,
        title: 'Request 1',
        scheduled_date: new Date().toISOString(),
        duration: 60,
        location: { lat: 40.7128, lng: -74.0060, address: 'Location 1' },
        status: 'pending'
      });

      await createTestRequest({
        user_id: testUser.id,
        title: 'Request 2',
        scheduled_date: new Date().toISOString(),
        duration: 90,
        location: { lat: 40.7128, lng: -74.0060, address: 'Location 2' },
        status: 'completed'
      });

      const requests = await supabaseStorage.getScribeRequestsByUser(testUser.id);
      
      expect(requests).toHaveLength(2);
      expect(requests.every(r => r.user_id === testUser.id)).toBe(true);
    });
  });

  describe('getScribeRequestsByStatus', () => {
    it('should return requests by status', async () => {
      await createTestRequest({
        user_id: testUser.id,
        title: 'Pending Request',
        scheduled_date: new Date().toISOString(),
        duration: 60,
        location: { lat: 40.7128, lng: -74.0060, address: 'Location' },
        status: 'pending'
      });

      await createTestRequest({
        user_id: testUser.id,
        title: 'Completed Request',
        scheduled_date: new Date().toISOString(),
        duration: 90,
        location: { lat: 40.7128, lng: -74.0060, address: 'Location' },
        status: 'completed'
      });

      const pendingRequests = await supabaseStorage.getScribeRequestsByStatus('pending');
      
      expect(pendingRequests).toHaveLength(1);
      expect(pendingRequests[0].status).toBe('pending');
    });
  });

  describe('updateScribeRequest', () => {
    it('should update request data', async () => {
      const testRequest = await createTestRequest({
        user_id: testUser.id,
        title: 'Original Title',
        scheduled_date: new Date().toISOString(),
        duration: 60,
        location: { lat: 40.7128, lng: -74.0060, address: 'Location' },
        status: 'pending'
      });

      const updates = {
        title: 'Updated Title',
        status: 'matched' as const
      };

      const updatedRequest = await supabaseStorage.updateScribeRequest(testRequest.id, updates);
      
      expect(updatedRequest.title).toBe('Updated Title');
      expect(updatedRequest.status).toBe('matched');
    });
  });

  describe('deleteScribeRequest', () => {
    it('should delete request', async () => {
      const testRequest = await createTestRequest({
        user_id: testUser.id,
        title: 'To Delete',
        scheduled_date: new Date().toISOString(),
        duration: 60,
        location: { lat: 40.7128, lng: -74.0060, address: 'Location' },
        status: 'pending'
      });

      await supabaseStorage.deleteScribeRequest(testRequest.id);
      
      const deletedRequest = await supabaseStorage.getScribeRequest(testRequest.id);
      expect(deletedRequest).toBeUndefined();
    });
  });
});
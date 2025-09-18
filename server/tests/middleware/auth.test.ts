import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole, requireResourceOwnership } from '../../middleware/supabaseAuth';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn()
    }
  }))
}));

describe('Authentication Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      params: {},
      query: {}
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    mockNext = vi.fn();
  });

  describe('requireAuth', () => {
    it('should call next() when valid token provided', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = createClient as any;
      
      mockSupabase.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: 'test-user-id',
                email: 'test@example.com',
                user_metadata: { role: 'blind_user' }
              }
            },
            error: null
          })
        }
      });

      mockReq.headers = {
        authorization: 'Bearer valid-token'
      };

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.id).toBe('test-user-id');
    });

    it('should return 401 when no token provided', async () => {
      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        details: 'Bearer token must be provided in Authorization header'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when invalid token provided', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = createClient as any;
      
      mockSupabase.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Invalid token' }
          })
        }
      });

      mockReq.headers = {
        authorization: 'Bearer invalid-token'
      };

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid token',
        details: 'Invalid token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      mockReq.user = {
        id: 'test-user-id',
        role: 'volunteer',
        email: 'test@example.com'
      };
    });

    it('should call next() when user has required role', () => {
      const middleware = requireRole('volunteer');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 when user lacks required role', () => {
      const middleware = requireRole('admin');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        details: 'Required roles: admin, your role: volunteer'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user not authenticated', () => {
      mockReq.user = undefined;
      const middleware = requireRole('volunteer');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireResourceOwnership', () => {
    beforeEach(() => {
      mockReq.user = {
        id: 'test-user-id',
        role: 'blind_user',
        email: 'test@example.com'
      };
    });

    it('should call next() when user owns resource', () => {
      mockReq.params = { userId: 'test-user-id' };
      
      requireResourceOwnership(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next() when user is admin', () => {
      mockReq.user!.role = 'admin';
      mockReq.params = { userId: 'different-user-id' };
      
      requireResourceOwnership(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 when user tries to access others resource', () => {
      mockReq.params = { userId: 'different-user-id' };
      
      requireResourceOwnership(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Access denied',
        details: 'You can only access your own resources'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user not authenticated', () => {
      mockReq.user = undefined;
      mockReq.params = { userId: 'test-user-id' };
      
      requireResourceOwnership(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
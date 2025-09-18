import { beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test database setup
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aqvpvtqywojhybhjogiv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key';

export const testSupabase = createClient(supabaseUrl, supabaseKey);

// Test data cleanup
export const cleanupTestData = async () => {
  try {
    // Clean up test data in reverse order of dependencies
    await testSupabase.from('audit_logs').delete().like('user_id', 'test-%');
    await testSupabase.from('chat_history').delete().like('user_id', 'test-%');
    await testSupabase.from('volunteer_applications').delete().like('volunteer_id', 'test-%');
    await testSupabase.from('scribe_sessions').delete().like('user_id', 'test-%');
    await testSupabase.from('matches').delete().like('volunteer_id', 'test-%');
    await testSupabase.from('scribe_requests').delete().like('user_id', 'test-%');
    await testSupabase.from('users').delete().like('id', 'test-%');
  } catch (error) {
    console.warn('Error cleaning up test data:', error);
  }
};

// Test user creation
export const createTestUser = async (userData: any) => {
  const { data, error } = await testSupabase
    .from('users')
    .insert({
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...userData
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Test request creation
export const createTestRequest = async (requestData: any) => {
  const { data, error } = await testSupabase
    .from('scribe_requests')
    .insert({
      id: `test-request-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...requestData
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

beforeAll(async () => {
  // Setup test environment
  await cleanupTestData();
});

afterAll(async () => {
  // Cleanup after all tests
  await cleanupTestData();
});

beforeEach(async () => {
  // Cleanup before each test
  await cleanupTestData();
});
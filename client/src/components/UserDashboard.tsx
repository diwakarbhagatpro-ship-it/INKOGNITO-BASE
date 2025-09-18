import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, User, Calendar, CheckCircle, AlertCircle, Users, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type UserRole = 'blind_user' | 'volunteer' | 'admin';

type Request = {
  id: string;
  title: string;
  scheduled_date: string;
  location: { address: string };
  status: 'pending' | 'matched' | 'in_progress' | 'completed' | 'cancelled';
  volunteer?: {
    name: string;
  };
  user?: {
    name: string;
  };
};

type UserDashboardProps = {
  userRole: UserRole;
  userName: string;
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'matched':
    case 'in_progress':
      return <User className="h-4 w-4 text-blue-500" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'cancelled':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'matched':
    case 'in_progress':
      return 'secondary';
    case 'pending':
      return 'outline';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
};

export function UserDashboard({ userRole, userName }: UserDashboardProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [analytics, setAnalytics] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    completedSessions: 0,
    activeVolunteers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isBlindUser = userRole === 'blind_user';
  const isVolunteer = userRole === 'volunteer';
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    loadData();
  }, [userRole]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load requests based on user role
      let requestsData: Request[] = [];
      if (isBlindUser || isAdmin) {
        requestsData = await api.getScribeRequests(user?.id);
      } else if (isVolunteer) {
        requestsData = await api.getScribeRequests(undefined, 'pending');
      }

      // Load analytics
      const analyticsData = await api.getAnalytics();

      setRequests(requestsData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: string) => {
    try {
      if (action === 'cancel') {
        await api.updateScribeRequest(requestId, { status: 'cancelled' });
        await loadData(); // Refresh data
      } else if (action === 'apply' && isVolunteer) {
        await api.createVolunteerApplication({
          request_id: requestId,
          message: 'I would like to help with this request.',
          status: 'pending'
        });
        await loadData(); // Refresh data
      }
    } catch (err) {
      console.error('Error performing request action:', err);
      setError('Failed to perform action. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadData}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {userName}!
        </h1>
        <p className="text-blue-100">
          {isBlindUser && "Manage your scribe requests and track your sessions."}
          {isVolunteer && "View available requests and manage your volunteer sessions."}
          {isAdmin && "Monitor the platform and manage users and requests."}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              {isBlindUser && "Your scribe requests"}
              {isVolunteer && "Requests you've applied to"}
              {isAdmin && "All platform requests"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completedSessions}</div>
            <p className="text-xs text-muted-foreground">
              Successfully completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Volunteers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeVolunteers}</div>
            <p className="text-xs text-muted-foreground">
              Currently available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isBlindUser && "Your Recent Requests"}
            {isVolunteer && "Available Requests"}
            {isAdmin && "All Recent Requests"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(request.status)}
                    <div>
                      <h3 className="font-medium">{request.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(request.scheduled_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(request.scheduled_date).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{request.location?.address || 'Location not specified'}</span>
                        </div>
                      </div>
                      {request.volunteer && (
                        <div className="flex items-center space-x-1 text-sm text-blue-600 mt-1">
                          <User className="h-3 w-3" />
                          <span>Volunteer: {request.volunteer.name}</span>
                        </div>
                      )}
                      {request.user && isVolunteer && (
                        <div className="flex items-center space-x-1 text-sm text-green-600 mt-1">
                          <User className="h-3 w-3" />
                          <span>Student: {request.user.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusVariant(request.status)}>
                      {request.status}
                    </Badge>
                    {isBlindUser && request.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleRequestAction(request.id, 'cancel')}
                      >
                        Cancel
                      </Button>
                    )}
                    {isVolunteer && request.status === 'pending' && (
                      <Button 
                        size="sm"
                        onClick={() => handleRequestAction(request.id, 'apply')}
                      >
                        Apply
                      </Button>
                    )}
                    {isAdmin && (
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
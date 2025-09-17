import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, User, Calendar, CheckCircle, AlertCircle, Users } from 'lucide-react';

type UserRole = 'blind_user' | 'volunteer' | 'admin';

type Request = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: 'pending' | 'matched' | 'completed' | 'cancelled';
  volunteer?: string;
};

type UserDashboardProps = {
  userRole: UserRole;
  userName: string;
};

// TODO: Replace with real data from API
const mockRequests: Request[] = [
  {
    id: '1',
    title: 'Mathematics Final Exam',
    date: '2024-01-20',
    time: '09:00',
    location: 'University Campus, Room 301',
    status: 'matched',
    volunteer: 'Sarah Johnson',
  },
  {
    id: '2',
    title: 'Physics Mid-term',
    date: '2024-01-18',
    time: '14:00',
    location: 'Science Building, Lab 204',
    status: 'completed',
    volunteer: 'Michael Chen',
  },
  {
    id: '3',
    title: 'Chemistry Assignment Review',
    date: '2024-01-25',
    time: '10:30',
    location: 'Library Study Room 5',
    status: 'pending',
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'matched':
      return <User className="h-4 w-4 text-blue-500" />;
    case 'pending':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'matched':
      return 'secondary';
    case 'pending':
      return 'outline';
    default:
      return 'outline';
  }
};

export function UserDashboard({ userRole, userName }: UserDashboardProps) {
  const stats = {
    totalRequests: mockRequests.length,
    completedSessions: mockRequests.filter(r => r.status === 'completed').length,
    upcomingSessions: mockRequests.filter(r => r.status === 'matched').length,
    pendingRequests: mockRequests.filter(r => r.status === 'pending').length,
  };

  const handleRequestAction = (requestId: string, action: string) => {
    console.log(`${action} request:`, requestId);
    // TODO: Implement actual request actions
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="dashboard-welcome">
          Welcome back, {userName}
        </h1>
        <p className="text-muted-foreground">
          {userRole === 'blind_user' && 'Manage your scribe requests and upcoming sessions'}
          {userRole === 'volunteer' && 'View available requests and manage your volunteer schedule'}
          {userRole === 'admin' && 'Monitor system activity and manage users'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-total">{stats.totalRequests}</p>
                <p className="text-xs text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-completed">{stats.completedSessions}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-upcoming">{stats.upcomingSessions}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-pending">{stats.pendingRequests}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                data-testid={`request-card-${request.id}`}
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(request.status)}
                  <div>
                    <h4 className="font-medium">{request.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {request.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {request.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {request.location}
                      </span>
                    </div>
                    {request.volunteer && (
                      <p className="text-sm text-primary mt-1">
                        Volunteer: {request.volunteer}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant={getStatusVariant(request.status)}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                  {request.status === 'matched' && (
                    <Button
                      size="sm"
                      onClick={() => handleRequestAction(request.id, 'contact')}
                      data-testid={`button-contact-${request.id}`}
                    >
                      Contact Volunteer
                    </Button>
                  )}
                  {request.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequestAction(request.id, 'edit')}
                      data-testid={`button-edit-${request.id}`}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
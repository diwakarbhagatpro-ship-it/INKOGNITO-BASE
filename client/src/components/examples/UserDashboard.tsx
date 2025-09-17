import { UserDashboard } from '../UserDashboard';

export default function UserDashboardExample() {
  return (
    <div className="p-6">
      <UserDashboard userRole="blind_user" userName="Alex Chen" />
    </div>
  );
}
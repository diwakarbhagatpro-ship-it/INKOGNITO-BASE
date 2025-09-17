// Notification service for InscribeMate
export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.requestPermission();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async requestPermission(): Promise<void> {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
    }
  }

  public async showNotification(
    title: string,
    options: NotificationOptions = {}
  ): Promise<void> {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const notification = new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      ...options
    });

    // Auto-close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);

    // Handle click
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  public async showMatchNotification(matchData: {
    volunteerName: string;
    distance: number;
    requestTitle: string;
    matchId: string;
  }): Promise<void> {
    await this.showNotification(
      `🎉 Volunteer Found: ${matchData.volunteerName}`,
      {
        body: `${matchData.requestTitle} - ${matchData.distance}km away`,
        tag: `match-${matchData.matchId}`,
        data: { matchId: matchData.matchId, type: 'match' }
      }
    );
  }

  public async showRequestNotification(requestData: {
    title: string;
    distance: number;
    urgency: string;
    requestId: string;
  }): Promise<void> {
    const urgencyEmoji = requestData.urgency === 'high' ? '🚨' : '📋';
    
    await this.showNotification(
      `${urgencyEmoji} New Request: ${requestData.title}`,
      {
        body: `${requestData.distance}km away - ${requestData.urgency} priority`,
        tag: `request-${requestData.requestId}`,
        data: { requestId: requestData.requestId, type: 'request' }
      }
    );
  }

  public async showStatusUpdateNotification(
    status: string,
    details: string
  ): Promise<void> {
    const statusEmoji = {
      accepted: '✅',
      declined: '❌',
      completed: '🎉',
      cancelled: '⚠️'
    }[status] || '📝';

    await this.showNotification(
      `${statusEmoji} Request ${status}`,
      {
        body: details,
        tag: `status-${status}`,
        data: { type: 'status', status }
      }
    );
  }

  public async showNoVolunteersNotification(): Promise<void> {
    await this.showNotification(
      '⏳ Looking for Volunteers',
      {
        body: 'We\'re actively searching for a volunteer to help you. You\'ll be notified as soon as someone is available.',
        tag: 'no-volunteers',
        data: { type: 'no-volunteers' }
      }
    );
  }

  public async showReassignmentNotification(volunteerName: string): Promise<void> {
    await this.showNotification(
      '🔄 New Volunteer Assigned',
      {
        body: `A new volunteer (${volunteerName}) has been assigned to your request.`,
        tag: 'reassignment',
        data: { type: 'reassignment' }
      }
    );
  }
}

// Export singleton instance
export const notifications = NotificationService.getInstance();

// React hook for notifications
export const useNotifications = () => {
  return {
    showNotification: (title: string, options?: NotificationOptions) => 
      notifications.showNotification(title, options),
    showMatchNotification: (matchData: any) => 
      notifications.showMatchNotification(matchData),
    showRequestNotification: (requestData: any) => 
      notifications.showRequestNotification(requestData),
    showStatusUpdateNotification: (status: string, details: string) => 
      notifications.showStatusUpdateNotification(status, details),
    showNoVolunteersNotification: () => 
      notifications.showNoVolunteersNotification(),
    showReassignmentNotification: (volunteerName: string) => 
      notifications.showReassignmentNotification(volunteerName)
  };
};

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface EmailLog {
  id: string;
  messageId: string;
  from: string;
  subject: string;
  status: 'success' | 'failed' | 'pending';
  jiraTaskKey?: string | null;
  processedAt?: Date;
  errorMessage?: string | null;
}

interface RecentActivityProps {
  logs: EmailLog[];
}

export default function RecentActivity({ logs }: RecentActivityProps) {
  const [, setLocation] = useLocation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTaskDisplay = (log: EmailLog) => {
    if (log.status === 'success' && log.jiraTaskKey) {
      return `→ ${log.jiraTaskKey}`;
    } else if (log.status === 'failed') {
      return '→ Failed';
    } else {
      return '→ Pending';
    }
  };

  const getTaskDisplayColor = (log: EmailLog) => {
    if (log.status === 'success') {
      return 'text-primary';
    } else if (log.status === 'failed') {
      return 'text-red-600';
    } else {
      return 'text-yellow-600';
    }
  };

  return (
    <Card data-testid="card-recent-activity">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-card-foreground">Recent Activity</CardTitle>
            <p className="text-sm text-muted-foreground">Latest processed emails and created tasks</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation("/logs")}
            data-testid="button-view-all"
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {logs.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No recent activity to display
            </div>
          ) : (
            logs.slice(0, 5).map((log) => (
              <div key={log.id} className="p-6 flex items-center space-x-4" data-testid={`activity-${log.id}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(log.status)}`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-card-foreground truncate" data-testid={`text-subject-${log.id}`}>
                      {log.subject}
                    </p>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-4" data-testid={`text-timestamp-${log.id}`}>
                      {log.processedAt ? formatDistanceToNow(new Date(log.processedAt), { addSuffix: true }) : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <p className="text-xs text-muted-foreground" data-testid={`text-from-${log.id}`}>
                      From: {log.from}
                    </p>
                    <span className={`text-xs font-medium ${getTaskDisplayColor(log)}`} data-testid={`text-task-${log.id}`}>
                      {getTaskDisplay(log)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

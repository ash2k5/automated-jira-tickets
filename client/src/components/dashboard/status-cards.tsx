import { CheckCircle, Mail, ListTodo, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SystemStatus {
  isRunning: boolean;
  emailsProcessed: number;
  tasksCreated: number;
  successRate: number;
  lastRun?: string;
}

interface StatusCardsProps {
  status: SystemStatus;
}

export default function StatusCards({ status }: StatusCardsProps) {
  const timeUntilNext = status.isRunning ? "8 minutes" : "Stopped";
  const statusColor = status.isRunning ? "text-green-600" : "text-red-600";
  const statusBg = status.isRunning ? "bg-green-100" : "bg-red-100";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card data-testid="card-system-status">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">System Status</p>
              <div className="flex items-center space-x-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${status.isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <p className="text-2xl font-bold text-card-foreground">
                  {status.isRunning ? "Running" : "Stopped"}
                </p>
              </div>
            </div>
            <div className={`w-12 h-12 ${statusBg} rounded-lg flex items-center justify-center`}>
              <CheckCircle className={`${statusColor} text-xl`} />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card data-testid="card-emails-processed">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Emails Processed</p>
              <p className="text-2xl font-bold text-card-foreground mt-2" data-testid="text-emails-processed">
                {status.emailsProcessed}
              </p>
              <p className="text-xs text-green-600 mt-1">All time</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Mail className="text-blue-600 text-xl" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card data-testid="card-tasks-created">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tasks Created</p>
              <p className="text-2xl font-bold text-card-foreground mt-2" data-testid="text-tasks-created">
                {status.tasksCreated}
              </p>
              <p className="text-xs text-green-600 mt-1">{status.successRate}% success rate</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ListTodo className="text-purple-600 text-xl" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card data-testid="card-last-run">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Run</p>
              <p className="text-2xl font-bold text-card-foreground mt-2" data-testid="text-last-run">
                {status.lastRun || "Never"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Next in {timeUntilNext}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="text-amber-600 text-xl" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

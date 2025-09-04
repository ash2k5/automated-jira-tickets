import { Play, Link, FileText, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface QuickActionsProps {
  onRunManualSync: () => void;
  onTestConnection: () => void;
  isLoading?: boolean;
}

export default function QuickActions({ 
  onRunManualSync, 
  onTestConnection, 
  isLoading 
}: QuickActionsProps) {
  const [, setLocation] = useLocation();

  return (
    <Card data-testid="card-quick-actions">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-card-foreground">Quick Actions</CardTitle>
        <p className="text-sm text-muted-foreground">Manage your automation system</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full justify-between h-auto p-4"
          onClick={onRunManualSync}
          disabled={isLoading}
          data-testid="button-manual-sync"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Play className="text-primary w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="font-medium text-card-foreground">Run Manual Sync</p>
              <p className="text-sm text-muted-foreground">Process emails immediately</p>
            </div>
          </div>
          <ChevronRight className="text-muted-foreground w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          className="w-full justify-between h-auto p-4"
          onClick={onTestConnection}
          disabled={isLoading}
          data-testid="button-test-connection"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Link className="text-green-600 w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="font-medium text-card-foreground">Test Connections</p>
              <p className="text-sm text-muted-foreground">Verify Jira & email setup</p>
            </div>
          </div>
          <ChevronRight className="text-muted-foreground w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          className="w-full justify-between h-auto p-4"
          onClick={() => setLocation("/logs")}
          data-testid="button-view-logs"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="text-blue-600 w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="font-medium text-card-foreground">View Logs</p>
              <p className="text-sm text-muted-foreground">Check processing history</p>
            </div>
          </div>
          <ChevronRight className="text-muted-foreground w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

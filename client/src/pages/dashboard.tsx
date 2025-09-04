import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import StatusCards from "@/components/dashboard/status-cards";
import QuickActions from "@/components/dashboard/quick-actions";
import SystemConfig from "@/components/dashboard/system-config";
import RecentActivity from "@/components/dashboard/recent-activity";
import TestModal from "@/components/modals/test-modal";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const { toast } = useToast();

  // Fetch system status
  const { data: systemData, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/system/status"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch recent logs
  const { data: logs = [] } = useQuery({
    queryKey: ["/api/logs"],
    refetchInterval: 30000,
  });

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/process-emails"),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email processing completed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/test/jira"),
    onSuccess: async (response) => {
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Connection Test Successful",
          description: `Connected as: ${data.user?.displayName || 'Unknown user'}`,
        });
      } else {
        toast({
          title: "Connection Test Failed",
          description: data.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test processing mutation
  const testProcessingMutation = useMutation({
    mutationFn: ({ subject, body }: { subject: string; body: string }) =>
      apiRequest("POST", "/api/test/process", { subject, body }),
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Test Processing Successful",
        description: data.jiraTaskKey ? `Created task: ${data.jiraTaskKey}` : "Test completed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Test Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/system/status"] });
    queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
  };

  const handleRunTest = async (subject: string, body: string) => {
    await testProcessingMutation.mutateAsync({ subject, body });
  };

  const isLoading = statusLoading || syncMutation.isPending || testConnectionMutation.isPending;
  
  const lastUpdate = systemData?.stats?.lastUpdated 
    ? formatDistanceToNow(new Date(systemData.stats.lastUpdated), { addSuffix: true })
    : undefined;

  const systemStatus = {
    isRunning: systemData?.config?.isRunning || false,
    emailsProcessed: systemData?.stats?.emailsProcessed || 0,
    tasksCreated: systemData?.stats?.tasksCreated || 0,
    successRate: systemData?.stats?.successRate || 0,
    lastRun: systemData?.config?.lastRunAt 
      ? formatDistanceToNow(new Date(systemData.config.lastRunAt), { addSuffix: true })
      : undefined,
  };

  return (
    <>
      <Header
        title="Dashboard"
        description="Monitor your email automation system"
        lastUpdate={lastUpdate}
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
      />
      
      <div className="p-6 space-y-6">
        <StatusCards status={systemStatus} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions
            onRunManualSync={() => syncMutation.mutate()}
            onTestConnection={() => testConnectionMutation.mutate()}
            isLoading={isLoading}
          />
          
          <SystemConfig config={systemData?.config || { jiraUrl: '', jiraProjectKey: '', emailCheckInterval: 10, notificationEmail: '' }} />
        </div>
        
        <RecentActivity logs={Array.isArray(logs) ? logs : []} />
        
        {/* Processing Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg border border-border">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-card-foreground">Processing Statistics</h3>
              <p className="text-sm text-muted-foreground">Email processing over the last 24 hours</p>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-border">
                <div className="text-center">
                  <div className="text-muted-foreground text-2xl mb-2">📊</div>
                  <p className="text-muted-foreground font-medium">Processing Chart</p>
                  <p className="text-sm text-muted-foreground mt-1">Chart implementation coming soon</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg border border-border">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-card-foreground">Success Rate</h3>
              <p className="text-sm text-muted-foreground">Task creation success rate over time</p>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-border">
                <div className="text-center">
                  <div className="text-muted-foreground text-2xl mb-2">📈</div>
                  <p className="text-muted-foreground font-medium">Success Rate Chart</p>
                  <p className="text-sm text-muted-foreground mt-1">{systemStatus.successRate}% Success Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onRunTest={handleRunTest}
        isLoading={testProcessingMutation.isPending}
      />
    </>
  );
}

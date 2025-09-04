import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Search, Filter } from "lucide-react";

interface EmailLog {
  id: string;
  messageId: string;
  from: string;
  subject: string;
  body: string;
  status: 'success' | 'failed' | 'pending';
  jiraTaskKey?: string | null;
  processedAt?: Date;
  errorMessage?: string | null;
}

export default function Logs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch logs
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["/api/logs"],
    refetchInterval: 30000,
  });

  // Filter logs based on search and status
  const filteredLogs = (Array.isArray(logs) ? logs : []).filter((log: EmailLog) => {
    const matchesSearch = !searchTerm || 
      log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.jiraTaskKey && log.jiraTaskKey.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800" data-testid={`badge-success`}>Success</Badge>;
      case 'failed':
        return <Badge variant="destructive" data-testid={`badge-failed`}>Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary" data-testid={`badge-pending`}>Pending</Badge>;
      default:
        return <Badge variant="outline" data-testid={`badge-unknown`}>Unknown</Badge>;
    }
  };

  const getJiraLink = (taskKey: string) => {
    // You might want to fetch the Jira URL from config
    return `https://nrinstitute.atlassian.net/browse/${taskKey}`;
  };

  return (
    <>
      <Header
        title="Processing Logs"
        description="View detailed logs of email processing and task creation"
      />
      
      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card data-testid="card-filters">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by subject, sender, or task key..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                  data-testid="filter-all"
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "success" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("success")}
                  data-testid="filter-success"
                >
                  Success
                </Button>
                <Button
                  variant={statusFilter === "failed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("failed")}
                  data-testid="filter-failed"
                >
                  Failed
                </Button>
                <Button
                  variant={statusFilter === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("pending")}
                  data-testid="filter-pending"
                >
                  Pending
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Card data-testid="card-logs">
          <CardHeader>
            <CardTitle>Processing History ({filteredLogs.length} entries)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">
                Loading logs...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No logs found matching your criteria
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredLogs.map((log: EmailLog) => (
                  <div key={log.id} className="p-6" data-testid={`log-entry-${log.id}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusBadge(log.status)}
                          <span className="text-xs text-muted-foreground" data-testid={`text-timestamp-${log.id}`}>
                            {log.processedAt 
                              ? format(new Date(log.processedAt), "MMM d, yyyy 'at' h:mm a")
                              : 'Unknown time'
                            }
                          </span>
                        </div>
                        
                        <h3 className="font-medium text-card-foreground mb-1" data-testid={`text-subject-${log.id}`}>
                          {log.subject}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground mb-2" data-testid={`text-from-${log.id}`}>
                          From: {log.from}
                        </p>
                        
                        {log.body && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2" data-testid={`text-body-${log.id}`}>
                            {log.body.substring(0, 200)}
                            {log.body.length > 200 && "..."}
                          </p>
                        )}
                        
                        {log.status === 'success' && log.jiraTaskKey && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-primary" data-testid={`text-task-key-${log.id}`}>
                              {log.jiraTaskKey}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              data-testid={`button-view-task-${log.id}`}
                            >
                              <a 
                                href={getJiraLink(log.jiraTaskKey)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View in Jira
                              </a>
                            </Button>
                          </div>
                        )}
                        
                        {log.status === 'failed' && log.errorMessage && (
                          <div className="mt-2 p-2 bg-destructive/10 rounded border-l-2 border-destructive">
                            <p className="text-sm text-destructive" data-testid={`text-error-${log.id}`}>
                              Error: {log.errorMessage}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

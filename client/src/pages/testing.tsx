import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TestTube, Mail, Link, Play } from "lucide-react";

export default function Testing() {
  const [testEmail, setTestEmail] = useState("bwilson@nationalreview.com");
  const [testSubject, setTestSubject] = useState("Test: Printer issue in Conference Room B");
  const [testBody, setTestBody] = useState("The printer in Conference Room B is showing an error message and won't print. Please help!");
  const { toast } = useToast();

  // Test Jira connection
  const testJiraMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/test/jira"),
    onSuccess: async (response) => {
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Jira Connection Successful",
          description: `Connected as: ${data.user?.displayName || 'Unknown user'}`,
        });
      } else {
        toast({
          title: "Jira Connection Failed",
          description: data.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Jira Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test email notification
  const testEmailMutation = useMutation({
    mutationFn: (email: string) => apiRequest("POST", "/api/test/email", { email }),
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: `Test notification sent to ${testEmail}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Test Email Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test email processing
  const testProcessingMutation = useMutation({
    mutationFn: ({ subject, body }: { subject: string; body: string }) =>
      apiRequest("POST", "/api/test/process", { subject, body }),
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Test Processing Successful",
        description: data.jiraTaskKey 
          ? `Created test task: ${data.jiraTaskKey}` 
          : "Test processing completed",
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

  // Manual email sync
  const manualSyncMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/process-emails"),
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Manual Sync Completed",
        description: "Email processing completed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Manual Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTestJira = () => {
    testJiraMutation.mutate();
  };

  const handleTestEmail = () => {
    if (!testEmail.trim()) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    testEmailMutation.mutate(testEmail);
  };

  const handleTestProcessing = () => {
    if (!testSubject.trim() || !testBody.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both subject and body for the test",
        variant: "destructive",
      });
      return;
    }
    testProcessingMutation.mutate({ subject: testSubject, body: testBody });
  };

  const handleManualSync = () => {
    manualSyncMutation.mutate();
  };

  const isLoading = testJiraMutation.isPending || 
                   testEmailMutation.isPending || 
                   testProcessingMutation.isPending ||
                   manualSyncMutation.isPending;

  return (
    <>
      <Header
        title="Testing"
        description="Test your automation system components"
      />
      
      <div className="p-6 space-y-6 max-w-4xl">
        {/* System Tests */}
        <Card data-testid="card-system-tests">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              System Tests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4"
                onClick={handleTestJira}
                disabled={isLoading}
                data-testid="button-test-jira-connection"
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Link className="text-blue-600 w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium">Test Jira Connection</p>
                    <p className="text-sm text-muted-foreground">Verify API connectivity</p>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4"
                onClick={handleManualSync}
                disabled={isLoading}
                data-testid="button-manual-sync"
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Play className="text-green-600 w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium">Manual Email Sync</p>
                    <p className="text-sm text-muted-foreground">Process emails now</p>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Notification Test */}
        <Card data-testid="card-email-test">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Notification Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="testEmail">Test Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                data-testid="input-test-email"
              />
            </div>
            
            <Button
              onClick={handleTestEmail}
              disabled={isLoading}
              data-testid="button-send-test-email"
            >
              <Mail className="w-4 h-4 mr-2" />
              {testEmailMutation.isPending ? "Sending..." : "Send Test Email"}
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Email Processing Test */}
        <Card data-testid="card-processing-test">
          <CardHeader>
            <CardTitle>Email Processing Test</CardTitle>
            <p className="text-sm text-muted-foreground">
              Test the complete email-to-Jira workflow with sample data
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="testSubject">Test Email Subject</Label>
              <Input
                id="testSubject"
                value={testSubject}
                onChange={(e) => setTestSubject(e.target.value)}
                placeholder="Enter test subject..."
                data-testid="input-test-subject"
              />
            </div>
            
            <div>
              <Label htmlFor="testBody">Test Email Body</Label>
              <Textarea
                id="testBody"
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                placeholder="Enter test email body..."
                className="h-32 resize-none"
                data-testid="textarea-test-body"
              />
            </div>
            
            <Button
              onClick={handleTestProcessing}
              disabled={isLoading}
              data-testid="button-test-processing"
            >
              <TestTube className="w-4 h-4 mr-2" />
              {testProcessingMutation.isPending ? "Processing..." : "Test Email Processing"}
            </Button>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">What this test does:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Creates a Jira task with the provided subject and body</li>
                <li>• Sends a notification email to the configured address</li>
                <li>• Logs the processing result for review</li>
                <li>• Does not require actual email inbox access</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Test Results Info */}
        <Card data-testid="card-test-info">
          <CardHeader>
            <CardTitle>Testing Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Environment Variables Required:</strong><br />
                • JIRA_EMAIL - Your Jira account email<br />
                • JIRA_API_TOKEN - API token from Jira<br />
                • EMAIL_USER - Email account for IMAP access<br />
                • EMAIL_PASSWORD - Email account password<br />
                • SMTP_USER - SMTP username for sending notifications<br />
                • SMTP_PASSWORD - SMTP password
              </p>
              <p>
                <strong>Note:</strong> Test results will appear in the Processing Logs section. 
                Check there to verify that tests completed successfully.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, TestTube } from "lucide-react";

const configSchema = z.object({
  jiraUrl: z.string().url("Please enter a valid URL"),
  jiraEmail: z.string().email("Please enter a valid email"),
  jiraProjectKey: z.string().min(1, "Project key is required"),
  jiraIssueType: z.string().min(1, "Issue type is required"),
  notificationEmail: z.string().email("Please enter a valid email"),
  emailCheckInterval: z.number().min(1).max(60),
  isRunning: z.boolean(),
});

type ConfigFormData = z.infer<typeof configSchema>;

export default function Configuration() {
  const { toast } = useToast();

  // Fetch current configuration
  const { data: config, isLoading } = useQuery({
    queryKey: ["/api/config"],
  });

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      jiraUrl: "",
      jiraEmail: "",
      jiraProjectKey: "IT",
      jiraIssueType: "Task",
      notificationEmail: "bwilson@nationalreview.com",
      emailCheckInterval: 10,
      isRunning: false,
    },
  });

  // Update form when config is loaded
  useEffect(() => {
    if (config && typeof config === 'object') {
      form.reset({
        jiraUrl: (config as any).jiraUrl || "",
        jiraEmail: (config as any).jiraEmail || "",
        jiraProjectKey: (config as any).jiraProjectKey || "IT",
        jiraIssueType: (config as any).jiraIssueType || "Task",
        notificationEmail: (config as any).notificationEmail || "bwilson@nationalreview.com",
        emailCheckInterval: (config as any).emailCheckInterval || 10,
        isRunning: (config as any).isRunning || false,
      });
    }
  }, [config, form]);

  // Save configuration mutation
  const saveMutation = useMutation({
    mutationFn: (data: ConfigFormData) => apiRequest("PUT", "/api/config", data),
    onSuccess: () => {
      toast({
        title: "Configuration Saved",
        description: "Your settings have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system/status"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test connection mutation
  const testMutation = useMutation({
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

  const onSubmit = (data: ConfigFormData) => {
    saveMutation.mutate(data);
  };

  const handleTestConnection = () => {
    testMutation.mutate();
  };

  return (
    <>
      <Header
        title="Configuration"
        description="Manage your automation system settings"
      />
      
      <div className="p-6 max-w-4xl">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Jira Configuration */}
          <Card data-testid="card-jira-config">
            <CardHeader>
              <CardTitle>Jira Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jiraUrl">Jira Instance URL</Label>
                  <Input
                    id="jiraUrl"
                    {...form.register("jiraUrl")}
                    placeholder="https://your-company.atlassian.net"
                    data-testid="input-jira-url"
                  />
                  {form.formState.errors.jiraUrl && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.jiraUrl.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="jiraEmail">Jira Email</Label>
                  <Input
                    id="jiraEmail"
                    type="email"
                    {...form.register("jiraEmail")}
                    placeholder="your-email@company.com"
                    data-testid="input-jira-email"
                  />
                  {form.formState.errors.jiraEmail && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.jiraEmail.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jiraProjectKey">Project Key</Label>
                  <Input
                    id="jiraProjectKey"
                    {...form.register("jiraProjectKey")}
                    placeholder="IT"
                    data-testid="input-project-key"
                  />
                  {form.formState.errors.jiraProjectKey && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.jiraProjectKey.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="jiraIssueType">Issue Type</Label>
                  <Input
                    id="jiraIssueType"
                    {...form.register("jiraIssueType")}
                    placeholder="Task"
                    data-testid="input-issue-type"
                  />
                  {form.formState.errors.jiraIssueType && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.jiraIssueType.message}
                    </p>
                  )}
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={testMutation.isPending}
                data-testid="button-test-jira"
              >
                <TestTube className="w-4 h-4 mr-2" />
                {testMutation.isPending ? "Testing..." : "Test Connection"}
              </Button>
            </CardContent>
          </Card>

          {/* Email Configuration */}
          <Card data-testid="card-email-config">
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notificationEmail">Notification Email</Label>
                <Input
                  id="notificationEmail"
                  type="email"
                  {...form.register("notificationEmail")}
                  placeholder="bwilson@nationalreview.com"
                  data-testid="input-notification-email"
                />
                {form.formState.errors.notificationEmail && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.notificationEmail.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="emailCheckInterval">Check Interval (minutes)</Label>
                <Input
                  id="emailCheckInterval"
                  type="number"
                  min="1"
                  max="60"
                  {...form.register("emailCheckInterval", { valueAsNumber: true })}
                  data-testid="input-check-interval"
                />
                {form.formState.errors.emailCheckInterval && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.emailCheckInterval.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Control */}
          <Card data-testid="card-system-control">
            <CardHeader>
              <CardTitle>System Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isRunning"
                  checked={form.watch("isRunning")}
                  onCheckedChange={(checked) => form.setValue("isRunning", checked)}
                  data-testid="switch-automation"
                />
                <Label htmlFor="isRunning">Enable Automation</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                When enabled, the system will automatically process emails at the specified interval.
              </p>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saveMutation.isPending || isLoading}
              data-testid="button-save-config"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

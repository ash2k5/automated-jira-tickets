import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useLocation } from "wouter";

interface SystemConfig {
  jiraUrl: string;
  jiraProjectKey: string;
  emailCheckInterval: number;
  notificationEmail: string;
}

interface SystemConfigProps {
  config: SystemConfig;
}

export default function SystemConfig({ config }: SystemConfigProps) {
  const [, setLocation] = useLocation();

  const configItems = [
    {
      label: "Jira Instance",
      value: config.jiraUrl?.replace("https://", "").replace("http://", "") || "Not configured",
      status: config.jiraUrl ? "connected" : "disconnected"
    },
    {
      label: "Project Key",
      value: config.jiraProjectKey || "Not configured",
      status: config.jiraProjectKey ? "connected" : "disconnected"
    },
    {
      label: "Email Check Interval",
      value: `Every ${config.emailCheckInterval || 10} minutes`,
      status: "connected"
    },
    {
      label: "Notification Email",
      value: config.notificationEmail || "Not configured",
      status: config.notificationEmail ? "connected" : "disconnected"
    }
  ];

  return (
    <Card data-testid="card-system-config">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-card-foreground">System Configuration</CardTitle>
        <p className="text-sm text-muted-foreground">Current automation settings</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {configItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-card-foreground">{item.label}</p>
              <p className="text-sm text-muted-foreground" data-testid={`text-${item.label.toLowerCase().replace(' ', '-')}`}>
                {item.value}
              </p>
            </div>
            <div className={`w-2 h-2 rounded-full ${
              item.status === "connected" ? "bg-green-500" : "bg-red-500"
            }`}></div>
          </div>
        ))}
        
        <Button 
          variant="secondary" 
          className="w-full mt-4"
          onClick={() => setLocation("/configuration")}
          data-testid="button-edit-configuration"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Configuration
        </Button>
      </CardContent>
    </Card>
  );
}

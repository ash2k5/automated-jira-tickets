import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  description: string;
  lastUpdate?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function Header({ 
  title, 
  description, 
  lastUpdate, 
  onRefresh, 
  isRefreshing 
}: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-card-foreground">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdate && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <RefreshCw className="w-4 h-4" />
              <span data-testid="last-update">Last update: {lastUpdate}</span>
            </div>
          )}
          {onRefresh && (
            <Button 
              onClick={onRefresh}
              disabled={isRefreshing}
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

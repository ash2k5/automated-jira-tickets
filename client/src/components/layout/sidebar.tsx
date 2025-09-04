import { Link, useLocation } from "wouter";
import { 
  Mail, 
  Settings, 
  FileText, 
  FlaskConical, 
  BarChart3, 
  User, 
  Gauge 
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Gauge },
  { name: "Configuration", href: "/configuration", icon: Settings },
  { name: "Processing Logs", href: "/logs", icon: FileText },
  { name: "Testing", href: "/testing", icon: FlaskConical },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Mail className="text-sidebar-primary-foreground text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">Jira Automation</h1>
            <p className="text-xs text-muted-foreground">Email Processing System</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4" data-testid="sidebar-navigation">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <span 
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                      isActive 
                        ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                    data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="text-muted-foreground text-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">Admin User</p>
            <p className="text-xs text-muted-foreground truncate">admin@nrinstitute.org</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, LayoutDashboard } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-9xl font-bold text-primary/20 select-none">403</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          You don&apos;t have permission to access this page.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/dashboard">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </Link>
          <Link to="/">
            <Button
              variant="outline"
              className="border-border text-foreground hover:bg-muted"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

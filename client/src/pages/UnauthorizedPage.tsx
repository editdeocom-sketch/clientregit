import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, LogIn } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-9xl font-bold text-primary/20 select-none">401</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Authentication Required</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Please log in to access this page.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/login">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <LogIn className="mr-2 h-4 w-4" />
              Login
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

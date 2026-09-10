import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, RefreshCw } from "lucide-react";

export default function ServerErrorPage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-9xl font-bold text-primary/20 select-none">500</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Server Error</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Something went wrong on our end. Please try again later.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleRetry}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
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

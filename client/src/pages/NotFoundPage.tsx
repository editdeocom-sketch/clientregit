import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-9xl font-bold text-primary/20 select-none">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Page Not Found</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <Button
            variant="outline"
            className="border-border text-foreground hover:bg-muted"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}

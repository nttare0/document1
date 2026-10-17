import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useEffect, useState } from "react";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const [showContent, setShowContent] = useState(false);

  // Smooth transition to prevent flicker
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShowContent(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <Route path={path}>
      <div className="min-h-screen bg-zeolf-bg transition-opacity duration-200" 
           style={{ opacity: showContent ? 1 : 0.9 }}>
        {isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-zeolf-blue" />
          </div>
        ) : !user ? (
          <Redirect to="/auth" />
        ) : (
          <Component />
        )}
      </div>
    </Route>
  );
}

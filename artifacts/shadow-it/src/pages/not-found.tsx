import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useDocumentHead } from "@/hooks/use-document-head";

export default function NotFound() {
  useDocumentHead({ title: "Page not found", description: "The page you're looking for doesn't exist." });

  return (
    <div className="min-h-screen w-full flex items-center justify-center sg-app-bg">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link href="/" className="inline-block mt-6 text-sm font-semibold text-indigo-400 hover:text-indigo-300">
            ← Back to home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

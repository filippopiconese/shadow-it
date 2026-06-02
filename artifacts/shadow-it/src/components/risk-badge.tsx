import { ShieldAlert, ShieldCheck, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OAuthAppRiskLevel } from "@workspace/api-client-react";

interface RiskBadgeProps {
  level: OAuthAppRiskLevel | string;
  className?: string;
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const normalizedLevel = level.toLowerCase();
  
  if (normalizedLevel === 'high') {
    return (
      <Badge variant="destructive" className={`bg-red-100 text-red-700 hover:bg-red-100 border-red-200 font-medium ${className}`}>
        <ShieldAlert className="w-3 h-3 mr-1" />
        High Risk
      </Badge>
    );
  }
  
  if (normalizedLevel === 'medium') {
    return (
      <Badge variant="secondary" className={`bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 font-medium ${className}`}>
        <Shield className="w-3 h-3 mr-1" />
        Medium
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={`bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 font-medium ${className}`}>
      <ShieldCheck className="w-3 h-3 mr-1" />
      Low
    </Badge>
  );
}

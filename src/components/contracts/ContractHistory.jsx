import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Clock, CheckCircle2, AlertCircle, FileText } from "lucide-react";

export default function ContractHistory({ activities }) {
  if (!activities || activities.length === 0) return null;

  const getActivityIcon = (type) => {
    switch(type) {
      case 'vvl_started': return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'followup_completed': return <CheckCircle2 className="h-4 w-4 text-blue-400" />;
      case 'contract_created': return <FileText className="h-4 w-4 text-[#FFD24D]" />;
      case 'contract_updated': return <AlertCircle className="h-4 w-4 text-amber-400" />;
      default: return <Clock className="h-4 w-4 text-[#6B7280]" />;
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Historie</h3>
      <div className="space-y-2">
        {activities.slice(0, 10).map((activity, idx) => (
          <div key={activity.id} className="flex items-start gap-3 text-sm">
            <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[#EAECEF]">{activity.short_text}</p>
              <div className="flex items-center gap-2 text-xs text-[#6B7280] mt-0.5">
                <span>{format(new Date(activity.created_date), 'dd.MM.yyyy HH:mm', { locale: de })}</span>
                {activity.user_name && (
                  <>
                    <span>•</span>
                    <span>{activity.user_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import React from 'react';
import { TimelineEvent } from '../types';
import { Clock, CheckCircle2, User, ShieldAlert, Sparkles } from 'lucide-react';

interface TimelineViewProps {
  timeline: TimelineEvent[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ timeline = [] }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
        <Clock className="w-4 h-4 text-red-500" />
        Incident Action Log & Audit History
      </h3>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2 font-mono before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-800">
        {timeline.map((item, idx) => {
          const isAi = item.event.includes('AI');
          const isAssign = item.event.includes('Assigned') || item.event.includes('Agency');

          return (
            <div key={idx} className="relative flex items-start gap-3 text-xs">
              <div className={`absolute -left-[1.65rem] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                isAi 
                  ? 'bg-purple-950 border-purple-500 text-purple-400' 
                  : isAssign
                  ? 'bg-blue-950 border-blue-500 text-blue-400'
                  : 'bg-dark-900 border-gray-600 text-gray-400'
              }`}>
                {isAi ? <Sparkles className="w-2.5 h-2.5" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
              </div>

              <div className="bg-dark-800/60 p-3 rounded-xl border border-gray-800 flex-1 space-y-1">
                <p className="text-gray-200 font-sans">{item.event}</p>
                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                  <span>
                    {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Just now'}
                  </span>
                  {item.by && (
                    <span className="flex items-center gap-1 text-gray-400">
                      <User className="w-3 h-3 text-gray-500" />
                      {typeof item.by === 'object' ? item.by.name : 'System Officer'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

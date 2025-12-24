"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  CheckCircle2, Circle, Flame, Plus, X, Trash2, Lock
} from "lucide-react";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [activities, setActivities] = useState<any[]>([]);
  const [completedLogs, setCompletedLogs] = useState<Record<string, boolean>>({});
  const [yearLogs, setYearLogs] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    fetchYearlyStats();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    const dateStr = selectedDate.toISOString().split('T')[0];

    const [activitiesRes, logsRes] = await Promise.all([
      supabase.from('activities').select('*').order('created_at', { ascending: true }),
      supabase.from('logs').select('activity_id, is_completed').eq('date', dateStr)
    ]);

    if (activitiesRes.data) setActivities(activitiesRes.data);
    
    const logMap: Record<string, boolean> = {};
    logsRes.data?.forEach(log => {
      logMap[log.activity_id] = log.is_completed;
    });
    setCompletedLogs(logMap);
    setLoading(false);
  };

  const fetchYearlyStats = async () => {
    const { data } = await supabase
      .from('logs')
      .select('date, is_completed')
      .gte('date', '2026-01-01')
      .lte('date', '2026-12-31')
      .eq('is_completed', true);

    const counts: Record<string, number> = {};
    data?.forEach(log => {
      counts[log.date] = (counts[log.date] || 0) + 1;
    });
    setYearLogs(counts);
  };

  const toggleHabit = async (activityId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate > today) return;

    const dateStr = selectedDate.toISOString().split('T')[0];
    const isCurrentlyDone = !!completedLogs[activityId];

    setCompletedLogs(prev => ({ ...prev, [activityId]: !isCurrentlyDone }));

    const { error } = await supabase
      .from('logs')
      .upsert({ 
        activity_id: activityId, 
        date: dateStr, 
        is_completed: !isCurrentlyDone 
      }, { onConflict: 'activity_id, date' });

    if (!error) fetchYearlyStats();
    else fetchData();
  };

  const addActivity = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from('activities').insert([{ name: newName }]);
    if (!error) {
      setNewName("");
      setIsModalOpen(false);
      fetchData();
    }
  };

  const deleteActivity = async (id: string) => {
    if (!confirm("Delete this activity?")) return;
    await supabase.from('activities').delete().eq('id', id);
    fetchData();
  };

  const totalActivities = activities.length;
  const completedCount = Object.values(completedLogs).filter(Boolean).length;
  const progressPercentage = totalActivities > 0 ? (completedCount / totalActivities) * 100 : 0;
  const isFuture = selectedDate > new Date(new Date().setHours(23, 59, 59, 999));

  const days = [-3, -2, -1, 0, 1, 2, 3].map(offset => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-32 font-sans antialiased">
      <div className="max-w-md mx-auto pt-10 px-6">
        
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-4xl font-black tracking-tighter italic">didido</h1>
          <div className="bg-orange-100 text-orange-600 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2">
            <Flame className="w-4 h-4 fill-orange-500" /> 2026
          </div>
        </header>

        {/* Progress Bar */}
        <section className="mb-10 bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Daily Progress</p>
              <p className="text-2xl font-black text-slate-800">{completedCount}/{totalActivities}</p>
            </div>
            <p className={`text-3xl font-black italic ${isFuture ? "text-slate-200" : "text-blue-600"}`}>
              {Math.round(progressPercentage)}%
            </p>
          </div>
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 rounded-full ${isFuture ? "bg-slate-200" : "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]"}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </section>

        {/* Date Scroller */}
        <div className="flex justify-between items-center mb-12 bg-slate-200/30 p-1.5 rounded-[2rem] backdrop-blur-md">
          {days.map((date, i) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isDayInFuture = date > new Date(new Date().setHours(23, 59, 59, 999));
            return (
              <button 
                key={i}
                onClick={() => setSelectedDate(new Date(date))}
                className={`flex flex-col items-center justify-center w-11 h-16 rounded-2xl transition-all ${isSelected ? "bg-white shadow-xl scale-110" : "text-slate-400"}`}
              >
                <span className="text-[10px] uppercase font-bold mb-1 opacity-60">{date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}</span>
                <span className={`text-base font-black ${isDayInFuture ? "opacity-30" : ""}`}>{date.getDate()}</span>
              </button>
            );
          })}
        </div>

        {/* Activity List Section */}
        <div className="space-y-4 mb-16">
           <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Today's Goals</h2>
          {loading ? (
            <p className="text-center py-10 text-slate-300 font-bold uppercase tracking-widest text-xs animate-pulse">Syncing...</p>
          ) : activities.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-medium tracking-tight">Your list is empty.</p>
            </div>
          ) : (
            activities.map((habit) => {
              const isDone = !!completedLogs[habit.id];
              return (
                <div key={habit.id} className="group relative">
                  <button
                    disabled={isFuture}
                    onClick={() => toggleHabit(habit.id)}
                    className={`w-full flex items-center justify-between p-6 rounded-[2rem] transition-all border ${isFuture ? "opacity-40 border-slate-100" : isDone ? "bg-slate-100/50 border-transparent opacity-60" : "bg-white shadow-lg border-white"}`}
                  >
                    <p className={`text-lg font-bold ${isDone ? "line-through text-slate-400" : "text-slate-800"}`}>{habit.name}</p>
                    {isFuture ? <Lock className="w-6 h-6 text-slate-200" /> : isDone ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <Circle className="w-8 h-8 text-slate-200" />}
                  </button>
                  <button onClick={() => deleteActivity(habit.id)} className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 p-2 text-slate-300 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                </div>
              );
            })
          )}
        </div>

        {/* Yearly Heatmap (Now positioned AFTER activities) */}
        <section className="pb-10">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-2">2026 Consistency</h2>
          <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 overflow-x-auto">
            <div className="flex gap-1 w-max">
              {Array.from({ length: 53 }).map((_, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const day = new Date(2026, 0, (weekIndex * 7) + dayIndex + 1);
                    const dateStr = day.toISOString().split('T')[0];
                    const count = yearLogs[dateStr] || 0;
                    let color = "bg-slate-100";
                    if (count > 0) color = count >= 3 ? "bg-blue-600" : "bg-blue-300";
                    return <div key={dateStr} className={`w-2.5 h-2.5 rounded-[1px] ${color}`} title={`${dateStr}: ${count} completed`} />;
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Floating Add Button */}
        <button onClick={() => setIsModalOpen(true)} className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-10 py-5 rounded-[2rem] shadow-2xl font-black uppercase tracking-widest text-sm z-40 transition-transform active:scale-90">+ New activity</button>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 animate-in slide-in-from-bottom duration-300 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black italic">NEW GOAL</h3>
                <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="What's the goal?" className="w-full bg-slate-100 rounded-2xl p-5 mb-6 outline-none font-bold text-lg" onKeyDown={(e) => e.key === 'Enter' && addActivity()} autoFocus />
              <button onClick={addActivity} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-200 transition-colors hover:bg-blue-700">Confirm</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
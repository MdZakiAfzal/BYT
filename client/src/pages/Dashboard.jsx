import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { jobService } from '../services/jobService';
import { Link } from 'react-router-dom';
import { Loader2, Plus, Layout, Zap, Clock } from 'lucide-react';
import Input from '../components/Input';
import { Badge, ProgressBar } from '../components/ui';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    try {
      const res = await jobService.getAllJobs();
      setJobs(res.data.jobs);
    } catch (error) {
      console.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!url) return;
    setCreating(true);
    try {
      await jobService.createJob(url);
      setUrl('');
      loadJobs(); 
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || "Failed to create job"));
    } finally {
      setCreating(false);
    }
  };

  // Plan Limits (Hardcoded based on plans.js spec for display logic)
  const PLAN_LIMITS = {
    free: { quota: 3, duration: 15 },
    starter: { quota: 50, duration: 20 },
    pro: { quota: 150, duration: 60 },
    agency: { quota: 500, duration: 120 }
  };
  const currentLimits = PLAN_LIMITS[user?.plan] || PLAN_LIMITS.free;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <Navbar />

      <main className="p-6 max-w-5xl mx-auto space-y-8">
        
        {/* 1. Quick Action & Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Create Job Card */}
          <div className="md:col-span-2 bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap size={100} />
            </div>
            <h2 className="text-xl font-bold mb-2">Create New Content</h2>
            <p className="text-gray-400 text-sm mb-6">Paste a YouTube URL to generate a blog post, social threads, and newsletter.</p>
            
            <form onSubmit={handleCreateJob} className="flex gap-3">
              <div className="flex-1">
                <input 
                  type="text" 
                  placeholder="https://youtube.com/watch?v=..." 
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-white/20 outline-none transition"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <button 
                disabled={creating}
                className="bg-white text-black font-bold px-6 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 disabled:opacity-50"
              >
                {creating ? <Loader2 className="animate-spin" /> : <><Plus size={18} /> Generate</>}
              </button>
            </form>
          </div>

          {/* Usage Stats Card  */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex flex-col justify-center gap-6">
            <ProgressBar 
              label="Monthly Video Quota" 
              current={user?.monthlyQuotaUsed || 0} 
              max={currentLimits.quota} 
            />
            <ProgressBar 
              label="Whisper Audio Hours" 
              current={user?.whisperQuotaUsed || 0} 
              max={user?.plan === 'free' ? 0 : 3} 
            />
          </div>
        </div>

        {/* 2. Recent Jobs List  */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock size={18} className="text-gray-400"/> Recent Activity
          </h3>
          
          <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : jobs.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No jobs found. Start by pasting a URL above.</div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {jobs.map(job => (
                  <div key={job._id} className="p-4 flex items-center justify-between hover:bg-zinc-900 transition group">
                    <div className="flex items-center gap-4 overflow-hidden">
                      {/* Thumbnail Placeholder */}
                      <div className="w-16 h-10 bg-zinc-800 rounded flex-shrink-0 flex items-center justify-center">
                        <Layout size={16} className="text-zinc-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate text-sm text-gray-200 group-hover:text-white">
                          {job.youtubeUrl}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(job.createdAt).toLocaleDateString()} • {job.attemptNumber} attempts
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge status={job.status} />
                      <Link 
                        to={`/jobs/${job._id}`}
                        className="text-sm border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded transition"
                      >
                        Open Studio
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
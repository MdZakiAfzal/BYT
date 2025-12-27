import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jobService } from '../services/jobService';
import { Loader2, ArrowLeft, FileText, Linkedin, Twitter, Mail, Type, RefreshCw, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Badge } from '../components/ui';

const JobDetail = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('blog');
  const [copied, setCopied] = useState(false);

  const fetchJob = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await jobService.getJobById(id);
      setJob(res.data.job);
      // Debug: Check if content actually exists in the console
      if (res.data.job.status === 'completed') {
        console.log("Job Completed. Blog Data:", res.data.job.generatedBlog);
      }
    } catch (err) {
      console.error("Error fetching job:", err);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleCopy = () => {
    // Logic to copy current tab content
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;
  if (!job) return <div className="h-screen bg-black text-white p-10">Job not found</div>;

  const content = job.generatedBlog || {}; 
  const socials = job.generatedSocials || {};

  const tabs = [
    { id: 'blog', label: 'Blog Post', icon: FileText },
    { id: 'twitter', label: 'Twitter', icon: Twitter },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { id: 'newsletter', label: 'Email', icon: Mail },
    { id: 'transcript', label: 'Transcript', icon: Type },
  ];

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden font-sans">
      
      {/* 1. Header (Responsive) */}
      <header className="h-14 md:h-16 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-10">
        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
          <Link to="/dashboard" className="p-1 -ml-1 text-gray-400 hover:text-white transition rounded-full hover:bg-zinc-800">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex flex-col min-w-0">
            <h1 className="font-bold text-sm tracking-wide text-gray-200 hidden md:block">CONTENT STUDIO</h1>
            <div className="text-sm font-medium md:text-xs text-gray-300 md:text-gray-500 truncate max-w-[150px] md:max-w-md">
              {job.youtubeUrl}
            </div>
          </div>
          <Badge status={job.status} />
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={() => fetchJob(true)} 
             className={`p-2 rounded-full hover:bg-zinc-800 text-gray-400 transition ${refreshing ? 'animate-spin text-white' : ''}`}
             title="Refresh Status"
           >
             <RefreshCw size={18} />
           </button>
           <button 
             onClick={handleCopy}
             className="flex items-center gap-2 text-xs bg-white text-black font-bold px-3 py-2 rounded hover:bg-gray-200 transition"
           >
             {copied ? <Check size={14} /> : <Copy size={14} />}
             <span className="hidden md:inline">{copied ? 'Copied' : 'Copy'}</span>
           </button>
        </div>
      </header>

      {/* 2. Main Layout (Mobile: Stacked, Desktop: Sidebar) */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        
        {/* Navigation Tabs */}
        {/* Mobile: Horizontal Scroll | Desktop: Vertical Sidebar */}
        <nav className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-950/50 md:bg-zinc-900/30 flex-shrink-0">
          <div className="flex md:flex-col overflow-x-auto md:overflow-visible p-2 md:p-4 gap-1 md:gap-1 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 md:px-3 md:py-2.5 rounded-full md:rounded-lg text-sm font-medium transition-all whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'bg-white text-black md:bg-zinc-800 md:text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white hover:bg-zinc-800/50'
                  }
                `}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* 3. Content Area */}
        <main className="flex-1 overflow-y-auto bg-black md:bg-zinc-950 p-4 md:p-8 relative">
          <div className="max-w-3xl mx-auto pb-20">
            
            {/* STATUS STATES */}
            {job.status === 'queued' && (
               <div className="flex flex-col items-center justify-center py-20 text-center">
                 <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-4">
                   <Clock size={24} />
                 </div>
                 <h2 className="text-xl font-bold text-white">Job Queued</h2>
                 <p className="text-gray-400 mt-2 max-w-sm">We are waiting for a worker to pick up your video. Click the refresh button in the top right periodically.</p>
               </div>
            )}

            {job.status === 'processing' && (
               <div className="flex flex-col items-center justify-center py-20 text-center">
                 <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
                 <h2 className="text-xl font-bold text-white animate-pulse">Analyzing Video...</h2>
                 <p className="text-gray-400 mt-2">Extracting transcript and generating content. This usually takes 1-2 minutes.</p>
               </div>
            )}

            {job.status === 'failed' && (
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center">
                  <h3 className="font-bold">Generation Failed</h3>
                  <p className="text-sm mt-2">{job.failedReason || "Unknown error occurred."}</p>
                </div>
            )}

            {/* COMPLETED CONTENT */}
            {job.status === 'completed' && (
              <>
                {activeTab === 'blog' && (
                  <article className="prose prose-invert prose-lg max-w-none">
                    <ReactMarkdown>{content.content || "_No blog content generated yet._"}</ReactMarkdown>
                  </article>
                )}

                {activeTab === 'twitter' && (
                  <div className="space-y-6">
                    {socials.twitterThread ? (
                      (Array.isArray(socials.twitterThread) ? socials.twitterThread : [socials.twitterThread]).map((tweet, i) => (
                        <div key={i} className="flex gap-4">
                           <div className="flex-col items-center flex pt-1">
                              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-xs">
                                {i + 1}
                              </div>
                              {i !== (Array.isArray(socials.twitterThread) ? socials.twitterThread.length : 1) - 1 && (
                                <div className="w-0.5 flex-1 bg-zinc-800 my-2"></div>
                              )}
                           </div>
                           <div className="flex-1">
                             <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-gray-200 text-sm md:text-base leading-relaxed">
                               {tweet}
                             </div>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 italic text-center py-10">No Twitter thread generated.</div>
                    )}
                  </div>
                )}

                {activeTab === 'linkedin' && (
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl whitespace-pre-wrap text-gray-200 text-sm md:text-base leading-relaxed">
                    {socials.linkedinPost || "No LinkedIn post generated."}
                  </div>
                )}
                
                {activeTab === 'newsletter' && (
                  <div className="bg-white text-black p-6 md:p-8 rounded-xl shadow-lg">
                    <div className="border-b border-gray-200 pb-4 mb-4">
                       <h3 className="font-bold text-lg">Weekly Digest</h3>
                       <p className="text-gray-500 text-sm">Subject: {content.title || "Your Video Summary"}</p>
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-800">
                      <ReactMarkdown>{socials.newsletter || "_No newsletter generated._"}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {activeTab === 'transcript' && (
                  <div className="bg-zinc-900 border border-zinc-800 p-4 md:p-6 rounded-xl font-mono text-xs md:text-sm text-gray-400 whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
                     {job.transcript || "Transcript not available."}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

// Helper component for status icons (add this inside the file or import it)
function Clock({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
  );
}

export default JobDetail;
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { 
  ArrowRight, Check, FileText, Mail, Mic, 
  Linkedin, TrendingUp, Clock, Search, X as XIcon 
} from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-white/5 rounded-[100%] blur-[120px] -z-10 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs font-medium text-zinc-400 mb-8 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
            v1.0 Now Live
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white to-zinc-500 text-transparent bg-clip-text pb-2">
            Make your content live forever.
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            YouTube videos spike for 48 hours. Blog posts rank for years. 
            Turn your ephemeral video library into an evergreen content engine that drives traffic while you sleep.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <Link 
              to="/signup" 
              className="h-12 px-8 rounded-full bg-white text-black font-bold flex items-center gap-2 hover:bg-gray-200 transition w-full md:w-auto justify-center"
            >
              Start for Free <ArrowRight size={18} />
            </Link>
            <Link 
              to="/login"
              className="h-12 px-8 rounded-full border border-zinc-800 text-white font-medium hover:bg-zinc-900 transition w-full md:w-auto flex items-center justify-center"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THE VALUE PROP (Longevity Section) */}
      <section className="py-24 border-y border-zinc-900 bg-zinc-900/20">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          <ValueProp 
            icon={Clock}
            title="Beat the Algorithm"
            desc="Algorithms bury your video after a week. SEO-optimized articles keep bringing in new leads for years, compounding your growth over time."
          />
          <ValueProp 
            icon={TrendingUp}
            title="Multiply Your Reach"
            desc="Not everyone watches videos. Capture the reading audience on Google, LinkedIn, and X by meeting them where they are."
          />
          <ValueProp 
            icon={Search}
            title="Dominant SEO"
            desc="Video transcripts aren't enough. We generate structured, keyword-rich articles that Google actually loves to index."
          />
        </div>
      </section>

      {/* 3. FEATURES GRID */}
      <section className="py-24 bg-black">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4">A complete content team in one click</h2>
            <p className="text-zinc-400">From audio processing to viral threads, we handle it all.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard 
              icon={Mic}
              title="Audio Analysis"
              desc="No subtitles? No problem. Our Whisper integration listens to the audio directly to extract perfect transcripts."
            />
            <FeatureCard 
              icon={FileText}
              title="SEO Blog Posts"
              desc="Full-length, formatted articles ready for your CMS. Structured with proper H1/H2 tags for maximum readability."
            />
            <FeatureCard 
              icon={Linkedin}
              title="LinkedIn Posts"
              desc="Professional, thought-leadership style posts designed to build authority and drive engagement on LinkedIn."
            />
            <FeatureCard 
              icon={Mail}
              title="Newsletters"
              desc="Keep your subscribers in the loop. Automatically generate weekly digests from your latest video uploads."
            />
          </div>
        </div>
      </section>

      {/* 4. PRICING SECTION */}
      <section className="py-24 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Simple, transparent pricing</h2>
            <p className="text-zinc-400">Start for free, upgrade when you scale.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PricingCard 
              plan="Free"
              price="$0"
              features={[
                "3 Videos / Month",
                "10 min max duration",
                "Standard AI Model",
                "Short Blog Posts",
                "Text Export Only"
              ]}
            />
            <PricingCard 
              plan="Starter"
              price="$29"
              highlight={true}
              features={[
                "50 Videos / Month",
                "30 min max duration",
                "Standard AI Model",
                "SEO Optimization",
                "3 Audio Credits",
                "Txt & Markdown Export"
              ]}
            />
            <PricingCard 
              plan="Pro"
              price="$49"
              features={[
                "150 Videos / Month",
                "1 Hour max duration",
                "Advanced Reasoning AI",
                "Long-form Blogs",
                "15 Audio Credits",
                "HTML Export"
              ]}
            />
            <PricingCard 
              plan="Agency"
              price="$99"
              features={[
                "500 Videos / Month",
                "2 Hours max duration",
                "Advanced Reasoning AI",
                "Long-form Blogs",
                "50 Audio Credits",
                "JSON Data Export"
              ]}
            />
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="border-t border-zinc-900 py-12 bg-black">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-white text-xs font-bold text-black">B</div>
            <span className="font-bold tracking-tight">BYT &copy; 2025</span>
          </div>
          
          <div className="flex gap-8 text-sm text-zinc-500">
            <Link to="#" className="hover:text-white transition">Privacy Policy</Link>
            <Link to="#" className="hover:text-white transition">Terms of Service</Link>
            <Link to="/login" className="hover:text-white transition">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- Helper Components ---

const ValueProp = ({ icon: Icon, title, desc }) => (
  <div className="flex flex-col gap-4">
    <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-white">
      <Icon size={20} />
    </div>
    <h3 className="text-xl font-bold">{title}</h3>
    <p className="text-zinc-400 leading-relaxed text-sm">{desc}</p>
  </div>
);

const FeatureCard = ({ icon: Icon, title, desc }) => (
  <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 transition">
    <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-4 text-white">
      <Icon size={20} />
    </div>
    <h3 className="text-lg font-bold mb-2">{title}</h3>
    <p className="text-zinc-400 leading-relaxed text-sm">{desc}</p>
  </div>
);

const PricingCard = ({ plan, price, features, highlight }) => (
  <div className={`p-6 rounded-2xl border flex flex-col h-full ${highlight ? 'bg-white text-black border-transparent shadow-xl scale-105 z-10' : 'bg-black border-zinc-800 text-white'}`}>
    <div className="mb-6">
      <h3 className={`text-lg font-medium mb-2 ${highlight ? 'text-gray-600' : 'text-gray-400'}`}>{plan}</h3>
      <div className="text-4xl font-bold tracking-tight">{price}<span className="text-lg font-normal opacity-50">/mo</span></div>
    </div>
    <ul className="space-y-3 mb-8 flex-1">
      {features.map((feat, i) => (
        <li key={i} className="flex items-start gap-3 text-sm">
          <Check size={16} className={`mt-0.5 flex-shrink-0 ${highlight ? 'text-black' : 'text-zinc-400'}`} />
          <span className={highlight ? 'text-gray-700' : 'text-zinc-400'}>{feat}</span>
        </li>
      ))}
    </ul>
    <Link 
      to="/signup" 
      className={`w-full py-3 rounded-lg font-bold text-center transition ${highlight ? 'bg-black text-white hover:bg-gray-800' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
    >
      {plan === 'Free' ? 'Start Free' : 'Subscribe'}
    </Link>
  </div>
);

export default Home;
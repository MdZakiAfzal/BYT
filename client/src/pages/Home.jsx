import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      {/* Navbar */}
      <nav className="fixed top-0 w-full max-w-5xl flex justify-between py-6 px-4 border-b border-gray-800 bg-black/50 backdrop-blur-md z-10">
        <div className="font-bold text-xl tracking-tighter">BYT</div>
        <div className="flex gap-4 text-sm">
           <Link to="/login" className="hover:text-gray-300">Login</Link>
           <Link to="/signup" className="hover:text-gray-300">Signup</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="text-center max-w-2xl mt-20">
        <div className="inline-block mb-4 px-3 py-1 rounded-full border border-gray-700 bg-gray-900 text-xs text-gray-300 font-medium">
          Phase 3: Frontend Development
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-gray-500 text-transparent bg-clip-text">
          Turn Videos into Blogs.
        </h1>
        
        <p className="text-lg text-gray-400 mb-8 leading-relaxed">
          The automated engine for content creators. Convert your YouTube library into SEO-ready articles in seconds.
        </p>

        <div className="flex gap-4 justify-center">
          <Link to="/signup" className="px-6 py-3 rounded-md bg-white text-black font-semibold hover:bg-gray-200 transition">
            Get Started
          </Link>
        </div>
      </main>
    </div>
  );
}

export default Home;
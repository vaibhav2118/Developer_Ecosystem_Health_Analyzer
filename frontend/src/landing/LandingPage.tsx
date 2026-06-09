import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GitBranch, Users, Boxes, ShieldAlert, LineChart, FileText, 
  ChevronRight, Play, Check, ShieldCheck, 
  HelpCircle, Sparkles, ArrowRight, RefreshCw
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

// Interface for FAQ item
interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-800 py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left text-base font-semibold text-white hover:text-indigo-400 transition-colors py-2 cursor-pointer"
      >
        <span>{question}</span>
        <HelpCircle size={18} className={`transform transition-transform ${isOpen ? 'rotate-180 text-indigo-400' : 'text-slate-500'}`} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-slate-400 leading-relaxed mt-2 pb-2">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [demoInput, setDemoInput] = useState<string>('');
  const [demoLoading, setDemoLoading] = useState<boolean>(false);
  const [demoResult, setDemoResult] = useState<any | null>(null);

  // FAQ mock list
  const faqs = [
    {
      question: "How does the platform compute the project Health Score?",
      answer: "The health engine uses a multi-dimensional weighted algorithm: Activity (20% - PR merge velocity, issue resolution), Community (20% - star trends, external ratios), Security (25% - OSV vulnerabilities, dependency freshness), Sustainability (20% - Bus Factor, HHI concentration), and Maintainability (15% - README quality, lead times)."
    },
    {
      question: "What is the Bus Factor, and why does it matter?",
      answer: "The Bus Factor measures sustainability risk by calculating the minimum number of core developers whose departure would stall the codebase (accounting for >50% of commits). A Bus Factor of 1 represents a critical point of failure."
    },
    {
      question: "Do you support private repository scans?",
      answer: "Yes, our Enterprise tier supports private codebases. It authenticates securely via a GitHub App or private SSH tokens, ensuring your repository manifests remain protected and internal dependencies are scanned correctly."
    },
    {
      question: "Is there a local or self-hosted deployment option?",
      answer: "Absolutely. Our platform is completely dockerized. Enterprise subscriptions include access to our private Docker registry images, allowing you to self-host the platform locally on your own infrastructure (Kubernetes or Docker Compose)."
    }
  ];

  // Interactive Demo Handler
  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoInput.includes('/')) {
      alert("Please enter a repository path in 'owner/repo' format (e.g. facebook/react)");
      return;
    }
    setDemoLoading(true);
    setDemoResult(null);

    // Simulate analysis pipeline latency
    setTimeout(() => {
      setDemoLoading(false);
      
      // Seed values based on input hash for mock realism
      const seed = demoInput.charCodeAt(0) + (demoInput.charCodeAt(1) || 0);
      const isHighHealth = seed % 2 === 0;
      
      setDemoResult({
        name: demoInput,
        healthScore: isHighHealth ? 88 : 54,
        busFactor: isHighHealth ? 4 : 1,
        riskLevel: isHighHealth ? 'Low Risk' : 'Critical Bus Factor',
        depCount: isHighHealth ? 24 : 85,
        alerts: isHighHealth ? 0 : 3
      });
    }, 2200);
  };

  const handleStartScan = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen text-slate-100 bg-slate-950 font-body relative overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-20 z-0">
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-blue-500 blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] rounded-full bg-indigo-600 blur-[150px]" />
      </div>

      {/* 1. Sticky Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 text-white no-underline">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-extrabold text-lg text-white">
                Ω
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-wider leading-none text-white font-title">ECOSYSTEM</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-widest leading-none mt-0.5">INTELLIGENCE</span>
              </div>
            </Link>
            
            <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-400">
              <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
              <a href="#metrics" className="hover:text-indigo-400 transition-colors">Metrics</a>
              <a href="#why-us" className="hover:text-indigo-400 transition-colors">Solutions</a>
              <a href="#pricing" className="hover:text-indigo-400 transition-colors">Pricing</a>
              <a href="#faqs" className="hover:text-indigo-400 transition-colors">FAQs</a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link 
              to="/login" 
              className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-1.5 transition-colors no-underline"
            >
              Sign In
            </Link>
            <button
              onClick={handleStartScan}
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 shadow-md shadow-indigo-500/10 active:scale-[0.98] transition-all cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 z-10 flex flex-col items-center text-center gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-indigo-400"
        >
          <Sparkles size={12} />
          <span>Announcing Enterprise Security Auditing</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-title tracking-tight text-white leading-tight max-w-4xl"
        >
          Analyze Open Source Ecosystem Health <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            Before It Becomes a Risk
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed"
        >
          Automate repository quality analysis, track dependency staleness, audit contributor sustainability metrics, and monitor package security CVEs in real-time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 mt-2"
        >
          <button
            onClick={handleStartScan}
            className="flex items-center gap-2 px-6 py-3 rounded-lg text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 shadow-lg shadow-indigo-600/15 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Start Free Scan</span>
            <ChevronRight size={18} />
          </button>
          <a
            href="#demo"
            className="flex items-center gap-2 px-6 py-3 rounded-lg text-base font-bold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800/60 hover:text-white transition-all cursor-pointer no-underline"
          >
            <Play size={16} className="fill-slate-300 text-slate-300" />
            <span>Watch Demo</span>
          </a>
        </motion.div>

        {/* Hero visual: Interactive Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="w-full max-w-5xl mt-12 glass-panel p-2.5 rounded-2xl bg-slate-950/40 border border-slate-800/60 shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden"
        >
          <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-900 flex flex-col">
            {/* Mock Header Controls */}
            <div className="h-10 bg-slate-900 px-4 flex items-center justify-between border-b border-slate-950">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="text-[11px] text-slate-500 font-semibold font-title">
                Ecosystem Intelligence Console — mock-view
              </div>
              <div className="w-8" />
            </div>
            
            {/* Mock Layout Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="glass-card flex flex-col gap-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Health Score</span>
                <div className="text-3xl font-extrabold text-emerald-400">92 / 100</div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: '92%' }} />
                </div>
                <span className="text-[10px] text-slate-500">Highly Viable & Sustained</span>
              </div>

              <div className="glass-card flex flex-col gap-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sustain Factor (Bus Factor)</span>
                <div className="text-3xl font-extrabold text-white">4 Maintainers</div>
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold">JD</div>
                  <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-bold">AL</div>
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold">KT</div>
                </div>
                <span className="text-[10px] text-slate-500">Distributed contribution shares</span>
              </div>

              <div className="glass-card flex flex-col gap-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Security Vulnerabilities</span>
                <div className="text-3xl font-extrabold text-red-400">0 Critical CVE</div>
                <div className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck size={12} /> OSV Scan Clean
                </div>
                <span className="text-[10px] text-slate-500">Checked 45 packages</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 3. Trusted By Section */}
      <section className="bg-slate-950/60 border-y border-slate-900 py-10 z-10 relative">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Trusted By Engineering Teams Worldwide
          </span>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-40 grayscale contrast-200">
            <span className="font-title font-extrabold text-lg tracking-wider text-slate-400">ACME CORP</span>
            <span className="font-title font-extrabold text-lg tracking-wider text-slate-400">GLOBEX</span>
            <span className="font-title font-extrabold text-lg tracking-wider text-slate-400">INITECH</span>
            <span className="font-title font-extrabold text-lg tracking-wider text-slate-400">UMBRELLA</span>
            <span className="font-title font-extrabold text-lg tracking-wider text-slate-400">MASSIVE DYNAMIC</span>
          </div>
        </div>
      </section>

      {/* 4. Key Metrics Section */}
      <section id="metrics" className="max-w-7xl mx-auto px-6 py-20 z-10 relative flex flex-col gap-12">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold font-title text-white">Ecosystem Indicators That Matter</h2>
          <p className="text-sm text-slate-400">
            A single metric doesn't tell the full story. Our engine analyzes project health across five distinct vectors.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { title: "Health Score", label: "Weighted Index", desc: "Overall sustainability aggregated from 5 metrics, complete with confidence boundaries.", val: "94.2" },
            { title: "Bus Factor", label: "Key Developer Risk", desc: "The min contributors whose sudden departure halts project velocity.", val: "4" },
            { title: "Retention Rate", label: "Contributor Longevity", desc: "Percentage of developers returning over a rolling 90-day window.", val: "82%" },
            { title: "Security CVE", label: "Vulnerability Scans", desc: "Active security vulnerabilities mapping package manifests against OSV data.", val: "0" },
            { title: "Freshness Index", label: "Dependency Age", desc: "Average release version lag and package staleness scores.", val: "100%" }
          ].map((item, idx) => (
            <div key={idx} className="glass-panel p-6 flex flex-col gap-4 bg-slate-900/40 border-slate-800/60">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{item.label}</span>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-white font-title">{item.title}</h3>
                <div className="text-2xl font-black mt-2 text-white font-title">{item.val}</div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Feature Showcase */}
      <section id="features" className="bg-slate-900/20 border-y border-slate-900 py-20 z-10 relative">
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-12">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
            <h2 className="text-3xl font-extrabold font-title text-white">Platform Core Capabilities</h2>
            <p className="text-sm text-slate-400">
              Go beyond basic vulnerability alerts. Access deeper insights with custom analytics features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <GitBranch size={22} />, title: "Repository Intelligence", desc: "Automate code checks and repository scans to evaluate language metadata, issues, and pull request metrics." },
              { icon: <Users size={22} />, title: "Contributor Networks", desc: "Custom HTML5 Canvas physics diagrams trace dev interactions to identify centralities and project bottlenecks." },
              { icon: <Boxes size={22} />, title: "Dependency Heatmaps", desc: "A grid-based heatmap that highlights staleness, popularity, and licensing profiles for easy triage." },
              { icon: <ShieldAlert size={22} />, title: "Security Vulnerability Audits", desc: "Real-time updates queried directly from the OSV database, complete with remediation version details." },
              { icon: <LineChart size={22} />, title: "ML-Based Trend Projections", desc: "Predict future developer attrition risk indexes and weekly commit frequencies using Scikit-Learn models." },
              { icon: <FileText size={22} />, title: "Executive Report Generator", desc: "Compile professional, multi-page ReportLab PDF logs to document licensing compliance and audits." }
            ].map((feat, idx) => (
              <div key={idx} className="glass-card flex flex-col gap-4 bg-slate-950/40 border-slate-900/60 p-6">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  {feat.icon}
                </div>
                <h3 className="text-lg font-bold font-title text-white">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Interactive Product Demo */}
      <section id="demo" className="max-w-7xl mx-auto px-6 py-20 z-10 relative flex flex-col gap-12">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold font-title text-white">Experience the Scanner</h2>
          <p className="text-sm text-slate-400">
            Submit a real GitHub repo path below to run a high-fidelity simulated scan.
          </p>
        </div>

        <div className="w-full max-w-2xl mx-auto">
          <div className="glass-panel p-8 bg-slate-900/40 border-slate-800/80 rounded-2xl flex flex-col gap-6 shadow-2xl">
            <form onSubmit={handleDemoSubmit} className="flex gap-3">
              <input
                type="text"
                required
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                placeholder="Enter repository, e.g. fastapi/fastapi"
                className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600 transition-colors"
              />
              <button
                type="submit"
                disabled={demoLoading}
                className="px-6 py-3 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {demoLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Scan Sandbox</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <AnimatePresence mode="wait">
              {demoLoading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-2 font-mono text-[11px] text-indigo-400 bg-slate-950 p-4 rounded-lg border border-slate-900"
                >
                  <div>&gt; Initializing mock analysis worker...</div>
                  <div>&gt; Cloning repository manifests for parsing...</div>
                  <div>&gt; Running OSV check pipeline...</div>
                  <div>&gt; Executing contributor network density mapping...</div>
                  <div>&gt; Fitting linear regression commit forecaster...</div>
                </motion.div>
              )}

              {demoResult && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-slate-950 rounded-lg border border-slate-900 flex flex-col gap-6"
                >
                  <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                    <div className="flex items-center gap-2">
                      <GitBranch size={16} className="text-indigo-400" />
                      <span className="font-bold text-sm text-white">{demoResult.name}</span>
                    </div>
                    <span className="text-xs bg-slate-900 px-2.5 py-1 rounded text-slate-400 font-semibold uppercase">
                      Sandbox Output
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Health Index</span>
                      <span className={`text-xl font-extrabold mt-1 ${demoResult.healthScore >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {demoResult.healthScore} / 100
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Bus Factor</span>
                      <span className="text-xl font-extrabold mt-1 text-white">
                        {demoResult.busFactor} Devs
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Dependency Count</span>
                      <span className="text-xl font-extrabold mt-1 text-white">
                        {demoResult.depCount} libraries
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Security Alerts</span>
                      <span className={`text-xl font-extrabold mt-1 ${demoResult.alerts > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
                        {demoResult.alerts} CVEs
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-slate-900/60 rounded border border-slate-800/40 text-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">STATUS RESOLUTION:</span>
                    <span className={`font-semibold ${demoResult.alerts > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {demoResult.riskLevel} detected. {demoResult.alerts > 0 ? 'Immediate action required.' : 'No urgent alerts.'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 7. Why Choose Us (Matrix) */}
      <section id="why-us" className="bg-slate-900/20 border-y border-slate-900 py-20 z-10 relative">
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-12">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
            <h2 className="text-3xl font-extrabold font-title text-white">How We Compare</h2>
            <p className="text-sm text-slate-400">
              Unlike standard package checkers, our analyzer evaluates long-term project sustainability.
            </p>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse text-left text-sm text-slate-300 min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-semibold font-title">
                  <th className="py-4 px-6">Capability Matrix</th>
                  <th className="py-4 px-6 text-indigo-400 font-extrabold">Ecosystem Intelligence</th>
                  <th className="py-4 px-6">Snyk</th>
                  <th className="py-4 px-6">Dependabot</th>
                  <th className="py-4 px-6">FOSSA</th>
                  <th className="py-4 px-6">Socket.dev</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "OSV Vulnerability Scans", our: true, s: true, d: true, f: false, soc: true },
                  { name: "Bus Factor Risk Alerting", our: true, s: false, d: false, f: false, soc: false },
                  { name: "Dynamic Canvas Contributor Graph", our: true, s: false, d: false, f: false, soc: false },
                  { name: "ML-Based Velocity Forecasting", our: true, s: false, d: false, f: false, soc: false },
                  { name: "Executive PDF Audit Compile", our: true, s: true, d: false, f: true, soc: false },
                  { name: "Package Freshness Grid Maps", our: true, s: false, d: true, f: false, soc: true }
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-900/60">
                    <td className="py-4 px-6 font-semibold text-white">{row.name}</td>
                    <td className="py-4 px-6 text-indigo-400"><Check size={18} className="stroke-[3]" /></td>
                    <td className="py-4 px-6">{row.s ? <Check size={16} className="text-slate-500" /> : '—'}</td>
                    <td className="py-4 px-6">{row.d ? <Check size={16} className="text-slate-500" /> : '—'}</td>
                    <td className="py-4 px-6">{row.f ? <Check size={16} className="text-slate-500" /> : '—'}</td>
                    <td className="py-4 px-6">{row.soc ? <Check size={16} className="text-slate-500" /> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 8. Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20 z-10 relative flex flex-col gap-12">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold font-title text-white">Flexible Plans For Teams</h2>
          <p className="text-sm text-slate-400">
            Start scanning public repositories for free, or scale up to monitor private codebase portfolios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
          {/* Free */}
          <div className="glass-panel p-8 bg-slate-900/30 border-slate-800/60 flex flex-col justify-between gap-8">
            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Developer</span>
              <h3 className="text-3xl font-extrabold text-white font-title">$0</h3>
              <p className="text-xs text-slate-400">For auditing small open source dependencies.</p>
              <div className="h-px bg-slate-800/80 my-2" />
              <ul className="text-xs text-slate-300 space-y-3">
                <li className="flex items-center gap-2"><Check size={12} className="text-indigo-400" /> 3 Tracked Repositories</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-indigo-400" /> Daily Scan Intervals</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-indigo-400" /> Contributor & Dependency Centers</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-indigo-400" /> Standard PDF Reports</li>
              </ul>
            </div>
            <button 
              onClick={handleStartScan}
              className="py-2.5 rounded-lg text-xs font-bold text-slate-300 bg-slate-950 border border-slate-800 hover:bg-slate-800/60 hover:text-white transition-all cursor-pointer"
            >
              Get Started
            </button>
          </div>

          {/* Team */}
          <div className="glass-panel p-8 bg-slate-900/60 border-indigo-500/40 relative flex flex-col justify-between gap-8 shadow-2xl shadow-indigo-500/5">
            <div className="absolute top-0 right-6 -translate-y-1/2 px-2.5 py-0.5 rounded-full bg-indigo-600 text-[10px] font-bold text-white uppercase tracking-wider">
              Popular
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Team Console</span>
              <h3 className="text-3xl font-extrabold text-white font-title">$49 <span className="text-xs text-slate-400 font-semibold font-body">/ month</span></h3>
              <p className="text-xs text-slate-400">For active engineering organizations.</p>
              <div className="h-px bg-slate-800/80 my-2" />
              <ul className="text-xs text-slate-300 space-y-3">
                <li className="flex items-center gap-2"><Check size={12} className="text-indigo-400" /> Up to 50 Tracked Repositories</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-indigo-400" /> Real-time OSV Alert Webhooks</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-indigo-400" /> ML forecasting & centralities</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-indigo-400" /> Custom Report Templates</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-indigo-400" /> Slack & Discord integrations</li>
              </ul>
            </div>
            <button 
              onClick={handleStartScan}
              className="py-2.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition-all cursor-pointer"
            >
              Subscribe
            </button>
          </div>

          {/* Enterprise */}
          <div className="glass-panel p-8 bg-slate-900/30 border-slate-800/60 flex flex-col justify-between gap-8">
            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Enterprise</span>
              <h3 className="text-3xl font-extrabold text-white font-title">Custom</h3>
              <p className="text-xs text-slate-400">For private registry and compliance monitoring.</p>
              <div className="h-px bg-slate-800/80 my-2" />
              <ul className="text-xs text-slate-300 space-y-3">
                <li className="flex items-center gap-2"><Check size={12} className="text-indigo-400" /> Unlimited Repositories</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-indigo-400" /> Self-hosted Deployment (Docker Compose)</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-indigo-400" /> Private GitHub App Integrations</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-indigo-400" /> Single Sign-On (SAML / SSO)</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-indigo-400" /> SLA Response Time Guarantees</li>
              </ul>
            </div>
            <button 
              onClick={handleStartScan}
              className="py-2.5 rounded-lg text-xs font-bold text-slate-300 bg-slate-950 border border-slate-800 hover:bg-slate-800/60 hover:text-white transition-all cursor-pointer"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* 9. Testimonials */}
      <section className="bg-slate-900/20 border-y border-slate-900 py-20 z-10 relative">
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-12">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
            <h2 className="text-3xl font-extrabold font-title text-white">Loved by OSPO Leaders</h2>
            <p className="text-sm text-slate-400">
              See how open source offices use the platform to secure their dependencies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="glass-card bg-slate-950/40 p-8 flex flex-col gap-4 border-slate-900/60">
              <p className="text-xs italic text-slate-300 leading-relaxed">
                "Our team was using standard vulnerability scans, but we kept getting caught off-guard by abandoned packages. This platform lets us spot single-maintainer risks early and onboard pairings before issues arise."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                  SK
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Sarah Jenkins</span>
                  <span className="text-[10px] text-slate-500">Director of OSPO, Globex Industries</span>
                </div>
              </div>
            </div>

            <div className="glass-card bg-slate-950/40 p-8 flex flex-col gap-4 border-slate-900/60">
              <p className="text-xs italic text-slate-300 leading-relaxed">
                "The ReportLab PDF audits save us hours of work during our quarterly vendor security checks. We simply compile the health reports and share them directly with compliance officers."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                  MK
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Marcus Vance</span>
                  <span className="text-[10px] text-slate-500">Lead DevSecOps Engineer, Initech Corp</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FAQ Section */}
      <section id="faqs" className="max-w-4xl mx-auto px-6 py-20 z-10 relative flex flex-col gap-12">
        <h2 className="text-3xl font-extrabold font-title text-center text-white">Frequently Asked Questions</h2>
        <div className="flex flex-col bg-slate-900/10 p-6 rounded-2xl border border-slate-900">
          {faqs.map((faq, idx) => (
            <FAQItem key={idx} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </section>

      {/* 11. Contact Section */}
      <section className="bg-slate-900/20 border-t border-slate-900 py-20 z-10 relative">
        <div className="max-w-xl mx-auto px-6 flex flex-col gap-8 text-center">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-extrabold font-title text-white">Connect with Our Team</h2>
            <p className="text-sm text-slate-400">
              Inquire about self-hosted deployments or ask a quick compliance question.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); alert("Inquiry submitted successfully!"); }} className="glass-panel p-6 bg-slate-900/40 border-slate-800/80 rounded-xl flex flex-col gap-4 text-left">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">First Name</label>
                <input required type="text" className="px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-700" placeholder="e.g. John" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Business Email</label>
                <input required type="email" className="px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-700" placeholder="e.g. john@globex.com" />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Message</label>
              <textarea required rows={4} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-700" placeholder="Enter your compliance or self-hosted deployment inquiry..." />
            </div>

            <button type="submit" className="w-full py-2.5 rounded text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition-all cursor-pointer">
              Submit Inquiry
            </button>
          </form>
        </div>
      </section>

      {/* 12. Footer */}
      <footer className="border-t border-slate-900 py-12 bg-slate-950 z-10 relative">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-xs text-white">
              Ω
            </div>
            <span className="text-xs font-black tracking-widest text-slate-400 font-title">ECOSYSTEM INTELLIGENCE</span>
          </div>

          <div className="text-[11px] text-slate-500 font-semibold font-title">
            © 2026 Developer Ecosystem Health Analyzer. All rights reserved.
          </div>

          <div className="flex gap-4 text-xs text-slate-500 font-semibold">
            <a href="#features" className="hover:text-slate-400 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-slate-400 transition-colors">Pricing</a>
            <span className="text-slate-800">|</span>
            <span className="text-slate-600">v1.2.0-SaaS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

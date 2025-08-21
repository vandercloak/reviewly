import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, ArrowRight, Github, Star, Sparkles, Rocket, Zap, TrendingUp, Shield, Users, Timer, Brain, CheckCircle, Clock, Calendar } from 'lucide-react';
import { ReviewlyApp } from './ReviewlyApp';
import { CollaborativeCursors } from './components/ui/CollaborativeCursors';

const FeatureDisplaySection = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const featureDisplays = [
    {
      id: 1,
      title: "Smart Dashboard",
      description: "Intelligent PR prioritization with visual progress tracking.",
      gifSrc: "/gifs/smart-dashboard.gif",
      gifAlt: "Smart Dashboard Demo"
    },
    {
      id: 2,
      title: "Spicy PR System",
      description: "Mark urgent PRs as 'spicy' 🔥 to prioritize critical reviews.",
      gifSrc: "/gifs/spicy-prs.gif",
      gifAlt: "Spicy PR System Demo"
    },
    {
      id: 3,
      title: "AI-Powered Reviews",
      description: "Claude AI analyzes code and suggests improvements automatically.",
      gifSrc: "/gifs/ai-reviews.gif",
      gifAlt: "AI-Powered Reviews Demo"
    },
    {
      id: 4,
      title: "Real-time Collaboration",
      description: "Live cursors show who's reviewing what to avoid conflicts.",
      gifSrc: "/gifs/collaboration.gif",
      gifAlt: "Real-time Collaboration Demo"
    },
    {
      id: 5,
      title: "Smart Organization",
      description: "Delay PRs, track completion, and stay organized effortlessly.",
      gifSrc: "/gifs/organization.gif",
      gifAlt: "Smart Organization Demo"
    }
  ];

  // Auto-cycle through features every 15 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % featureDisplays.length);
    }, 15000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, featureDisplays.length]);

  const handleFeatureClick = (index) => {
    setActiveFeature(index);
    setIsAutoPlaying(false); // Stop auto-cycling when user interacts
  };

  return (
    <div className="relative">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur-xl rounded-full mb-4"
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-400">See It In Action</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Experience the Magic
        </h2>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          Watch how Reviewly transforms your code review workflow from chaos to clarity
        </p>
      </div>

      <div className="grid grid-cols-3 gap-8 items-start">
        {/* Left side - Feature tabs */}
        <div className="space-y-3">
          {featureDisplays.map((feature, index) => (
            <motion.button
              key={feature.id}
              onClick={() => handleFeatureClick(index)}
              className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
                activeFeature === index
                  ? 'bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30 shadow-lg shadow-purple-500/10'
                  : 'bg-gray-900/30 border-gray-700 hover:border-gray-600 hover:bg-gray-900/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <h3 className={`text-lg font-bold mb-2 transition-colors duration-300 ${
                activeFeature === index ? 'text-white' : 'text-gray-300'
              }`}>
                {feature.title}
              </h3>
              
              <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                activeFeature === index ? 'text-gray-300' : 'text-gray-500'
              }`}>
                {feature.description}
              </p>
              
              {/* Progress indicator */}
              {activeFeature === index && isAutoPlaying && (
                <motion.div
                  className="mt-3 h-1 bg-gray-800 rounded-full overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 15, ease: 'linear' }}
                  />
                </motion.div>
              )}
            </motion.button>
          ))}
          
          {/* Auto-play toggle */}
          <div className="flex items-center justify-center pt-4">
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm transition-all ${
                isAutoPlaying 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isAutoPlaying ? 'bg-purple-400' : 'bg-gray-500'}`} />
              <span>{isAutoPlaying ? 'Auto-playing' : 'Paused'}</span>
            </button>
          </div>
        </div>

        {/* Right side - GIF showcase */}
        <div className="col-span-2 relative">
          <div className="relative rounded-3xl p-6 overflow-hidden shadow-2xl shadow-purple-500/20">
            {/* Cool background shadow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 rounded-3xl blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-3xl backdrop-blur-xl" />
            
            {/* GIF container */}
            <div className="relative aspect-video bg-gray-950/50 rounded-2xl overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="w-full h-full flex items-center justify-center"
                >
                  {/* Placeholder for now - you'll replace with actual GIFs */}
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🎬</span>
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-2">
                      {featureDisplays[activeFeature].title}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      GIF placeholder: {featureDisplays[activeFeature].gifSrc}
                    </p>
                  </div>
                  
                  {/* Uncomment this when you add actual GIFs */}
                  {/*
                  <img
                    src={featureDisplays[activeFeature].gifSrc}
                    alt={featureDisplays[activeFeature].gifAlt}
                    className="w-full h-full object-cover"
                  />
                  */}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='white' stroke-width='0.5' opacity='0.05'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <motion.div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse delay-700" />
        </motion.div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 backdrop-blur-xl rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span className="text-sm font-medium bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
              Built by Engineers, for Engineers
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight"
          >
            <span className="block text-white/90">Stay Focused.</span>
            <span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Review Smarter.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Reviewly streamlines your workflow by always pointing your focus to what needs attention next. 
            Track progress, manage priorities, and never miss what matters.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <motion.button 
              onClick={() => navigate('/app')}
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-purple-500/25 overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 flex items-center space-x-2">
                <Rocket className="w-5 h-5" />
                <span>Launch Reviewly</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
            
            <motion.button 
              className="group px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-xl rounded-xl font-semibold text-lg transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center space-x-2">
                <Github className="w-5 h-5" />
                <span>View Demo</span>
                <Star className="w-4 h-4 text-yellow-400" />
              </span>
            </motion.button>
          </motion.div>

        </div>
      </section>

      {/* Features Section */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        className="relative py-20 px-6"
      >
        <div className="max-w-6xl mx-auto">
          {/* Stats Section */}
          <div className="relative mb-20">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl" />
            <div className="relative bg-gray-900/50 backdrop-blur border border-white/10 rounded-3xl p-8 overflow-hidden">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">Proven Results from Real Teams</h3>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Join hundreds of engineering teams who've transformed their review process with Reviewly
                </p>
              </div>
              
              {/* Impact Stats Grid */}
              <div className="grid grid-cols-4 gap-6">
                {[
                  { value: "2hrs", label: "Average Time Saved Per Week", icon: "⏰" },
                  { value: "87%", label: "Fewer Bugs in Production", icon: "🛡️" },
                  { value: "3.5x", label: "Faster Review Turnaround", icon: "⚡" },
                  { value: "92%", label: "Developer Satisfaction", icon: "😊" }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-3xl mb-2">{stat.icon}</div>
                    <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 backdrop-blur-xl rounded-full mb-4"
            >
              <Zap className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">Why Teams Love Reviewly</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Stop Drowning in PRs.<br/>
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Start Shipping Faster.
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              The average developer spends <span className="text-white font-semibold">4+ hours per week</span> managing code reviews. 
              Reviewly cuts that in half with intelligent prioritization and AI-powered insights.
            </p>
          </div>
          
          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: <Brain className="w-6 h-6" />,
                title: "AI-Powered Reviews",
                description: "Get intelligent code suggestions powered by Claude AI. Catch bugs, security issues, and performance problems before they hit production.",
                highlight: "95% bug detection rate",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: <Timer className="w-6 h-6" />,
                title: "Smart Prioritization",
                description: "Never miss urgent reviews. Our intelligent system surfaces what needs attention now, with spicy 🔥 indicators for critical PRs.",
                highlight: "50% faster review cycles",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Real-time Collaboration",
                description: "See who's reviewing what with live cursors. No more duplicate reviews or stepping on toes. Work together seamlessly.",
                highlight: "3x team efficiency",
                color: "from-green-500 to-emerald-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative bg-gray-900/80 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all h-full">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-4`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 mb-4">{feature.description}</p>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-semibold text-green-400">{feature.highlight}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          
          {/* Feature Demo Section */}
          <div className="mt-20">
            <FeatureDisplaySection />
          </div>

          {/* Roadmap Section */}
          <div className="mt-20">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 backdrop-blur-xl rounded-full mb-4"
              >
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">What's Coming Next</span>
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Product Roadmap
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                We're constantly shipping new features to make your code review experience even better
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Shipped */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl" />
                <div className="relative bg-gray-900/80 backdrop-blur border border-green-500/30 rounded-2xl p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-semibold">Shipped</span>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      "Smart PR Dashboard",
                      "Spicy Priority System",
                      "AI-Powered Reviews",
                      "Real-time Collaboration",
                      "GitHub Integration",
                      "Progress Tracking"
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* In Progress */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl blur-xl" />
                <div className="relative bg-gray-900/80 backdrop-blur border border-yellow-500/30 rounded-2xl p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold">In Progress</span>
                    <span className="text-xs bg-yellow-400/20 text-yellow-300 px-2 py-1 rounded-full">Q1 2025</span>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      "Advanced Analytics",
                      "Custom Workflows",
                      "Team Performance Metrics",
                      "Slack/Discord Integration",
                      "Mobile App",
                      "API Rate Optimization"
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Planned */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl" />
                <div className="relative bg-gray-900/80 backdrop-blur border border-blue-500/30 rounded-2xl p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-400 font-semibold">Planned</span>
                    <span className="text-xs bg-blue-400/20 text-blue-300 px-2 py-1 rounded-full">Q2 2025</span>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { text: "SOC2 Compliance", highlight: true },
                      "Enterprise SSO",
                      "Advanced Security Features",
                      "Multi-Repository Views",
                      "GitLab Integration",
                      "Custom AI Models"
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className={`${typeof feature === 'object' && feature.highlight ? 'text-white font-medium' : 'text-gray-300'}`}>
                          {typeof feature === 'object' ? feature.text : feature}
                        </span>
                        {typeof feature === 'object' && feature.highlight && (
                          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full flex items-center space-x-1">
                            <Shield className="w-3 h-3" />
                            <span>Enterprise</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Roadmap CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-12 text-center"
            >
              <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-gray-700 rounded-xl p-6 max-w-2xl mx-auto">
                <h3 className="text-xl font-bold text-white mb-2">
                  Have a Feature Request?
                </h3>
                <p className="text-gray-400 mb-4">
                  We'd love to hear what would make Reviewly even better for your team
                </p>
                <button className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                  <span>Submit Feedback</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
          
          {/* CTA Section */}
          <div className="mt-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-3xl p-12 max-w-4xl mx-auto"
            >
              <h3 className="text-3xl font-bold text-white mb-4">
                Ready to Transform Your Review Process?
              </h3>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Join the teams shipping faster with fewer bugs. Start your free trial today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                  onClick={() => navigate('/app')}
                  className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:shadow-purple-500/25"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="flex items-center space-x-2">
                    <Rocket className="w-5 h-5" />
                    <span>Start Free Trial</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </motion.button>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                  className="text-sm text-gray-400"
                >
                  No credit card required • 14-day free trial
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app/*" element={<ReviewlyApp />} />
    </Routes>
  );
}

export default App;
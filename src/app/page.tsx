"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.05 },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 85, damping: 18 },
    },
  } as const;

  const floatVariants: any = {
    animate: {
      y: [0, -10, 0],
      rotate: [0, 2, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const features = [
    {
      title: "AI Medicine Analyzer",
      description: "Upload a crisp photograph of your medicine packaging. Kimi-K2.6 visual intelligence dissects active compounds, usage directives, precautions, and safety tags in seconds.",
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      href: "/analyzer"
    },
    {
      title: "Symptom Checker",
      description: "Discuss acute aches, fever, or congestion in a spacious conversational portal. Receive immediate clinical assessments, hydration checklists, and precautionary guides.",
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      href: "/symptoms"
    },
    {
      title: "Smart Routines Planner",
      description: "Schedule med routines in a calm clinical dashboard. Receive timed browser notifications paired with clear spoken SpeechSynthesis audio warnings.",
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: "/dashboard"
    },
    {
      title: "Hands-Free Voice Assist",
      description: "Speak symptoms directly into the portal using speech recognition, and listen to auditory assessments and alert advisories read aloud at customizable rates.",
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
      href: "/symptoms"
    }
  ];

  return (
    <div className="relative min-h-screen bg-dots pb-36 overflow-hidden">
      {/* Luxurious, Airy Sage Floating Gradient Blurs */}
      <div className="absolute top-20 left-1/4 w-[36rem] h-[36rem] bg-emerald-500/[0.015] rounded-full filter blur-[110px] -z-10 pulse-airy" />
      <div className="absolute top-1/3 right-1/4 w-[30rem] h-[30rem] bg-teal-500/[0.015] rounded-full filter blur-[90px] -z-10 pulse-airy" style={{ animationDelay: "2s" }} />

      {/* Abstract medical vector floating paths representing high-end Silicon Valley healthcare style */}
      <motion.div
        variants={floatVariants}
        animate="animate"
        className="hidden lg:block absolute top-40 right-24 w-12 h-12 text-emerald-600/10 pointer-events-none"
      >
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
      </motion.div>
      <motion.div
        variants={floatVariants}
        animate="animate"
        className="hidden lg:block absolute bottom-44 left-16 w-14 h-14 text-emerald-600/10 pointer-events-none"
        style={{ animationDelay: "3s" }}
      >
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.5 10.5C3.67 10.5 3 11.17 3 12s.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5h-15z"/>
        </svg>
      </motion.div>

      <div className="max-w-7xl mx-auto px-8 pt-28 sm:pt-40">
        
        {/* HERO SECTION */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl mx-auto"
        >
          {/* Faint pill tag */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-50/50 border border-emerald-100/40 text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-10 shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Empathetic Medicine Triage & Scheduling
          </motion.div>

          {/* Double-Line Confident Editorial Title */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.08] max-w-3.5xl mx-auto"
          >
            AI-Powered Healthcare Assistance Designed for Everyday Life.
          </motion.h1>

          {/* Calm, Human Subheading */}
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-slate-500 max-w-2.5xl mx-auto mb-14 leading-relaxed font-normal"
          >
            Coordinate medication schedules with offline-resilient alarms, audit packaging vision scans, and explore clinical triage in a spacious, breathable digital healthcare platform.
          </motion.p>

          {/* Premium Calm CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-center items-center gap-5"
          >
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-10 py-4.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest shadow-sm active:scale-98 transition-all duration-250 flex items-center justify-center gap-2"
            >
              Get Started
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link
              href="/analyzer"
              className="w-full sm:w-auto px-10 py-4.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest shadow-sm active:scale-98 transition-all duration-250"
            >
              Analyze Packaging
            </Link>
          </motion.div>
        </motion.div>

        {/* CORE PLATFORM FEATURES SECTION */}
        <div className="mt-48 sm:mt-64">
          <div className="text-center max-w-2xl mx-auto mb-24">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4">
              Designed for Clarity & Absolute Trust
            </h2>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
              Four fundamental health tracking features engineered with premium details, minimal layouts, and high trust.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-10"
          >
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="glass-panel glass-panel-hover p-12 rounded-[2.5rem] flex flex-col justify-between"
              >
                <div>
                  {/* Clean outline icon inside leaf circle */}
                  <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-10 shadow-sm">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-550 mb-10">
                    {feature.description}
                  </p>
                </div>
                <Link
                  href={feature.href}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors group"
                >
                  Explore Tool
                  <svg className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* LUXURIOUS ABOUT VISION GRID */}
        <div className="mt-48 sm:mt-64 border-t border-slate-100 pt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
            <div className="lg:col-span-7 space-y-6">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">
                Clinical Philosophy
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                Empathic, Adaptive, and Human-Centered Digital Care.
              </h2>
              <div className="space-y-6 text-slate-550 text-xs sm:text-sm leading-relaxed">
                <p>
                  MediBuddy AI was built to solve a critical gap in medicine tracking: chaotic, overdesigned alert platforms that induce clinical anxiety. By adopting a Swiss minimal design system, we focus entirely on quiet spaciousness, clarity, and absolute trust.
                </p>
                <p>
                  Our system combines state-of-the-art vision models with robust local failovers to protect your privacy and ensure your diagnostic companion is always responsive. It is designed to be elegant, calm, and deeply supportive of daily wellness.
                </p>
              </div>
            </div>

            {/* Premium Stat Boxes */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-5">
              <div className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 text-center shadow-sm">
                <h4 className="text-4xl font-extrabold text-slate-900 mb-2">100%</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Speech Support</p>
              </div>
              <div className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 text-center shadow-sm">
                <h4 className="text-4xl font-extrabold text-slate-900 mb-2">Instant</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Vision Auditing</p>
              </div>
              <div className="p-10 rounded-[2.5rem] bg-emerald-50 border border-emerald-100 text-left col-span-2 space-y-2 shadow-sm">
                <h4 className="text-base font-bold text-emerald-950">Empathetic Framework</h4>
                <p className="text-xs text-emerald-700/80 leading-relaxed">
                  Engineered with senior UI layouts to maintain a serene state at all times.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

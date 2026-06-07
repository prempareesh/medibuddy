"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Section: Brand & Copyright */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/10">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-slate-700 dark:text-slate-300">
            MediBuddy <span className="text-emerald-500 dark:text-emerald-400">AI</span>
          </span>
          <span className="text-sm text-slate-400 dark:text-slate-500 pl-2 border-l border-slate-200 dark:border-slate-800">
            © {new Date().getFullYear()} All rights reserved.
          </span>
        </div>

        {/* Middle Section: Disclaimer */}
        <p className="max-w-md text-center md:text-left text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
          ⚠️ <strong>Medical Disclaimer:</strong> This application is powered by AI. All insights, reminders, and analyses provided are for educational and tracking purposes. They do not constitute professional clinical diagnoses or medical advice.
        </p>

        {/* Right Section: Navigation Links */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Link href="/dashboard" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
            Dashboard
          </Link>
          <Link href="/analyzer" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
            Smart Scanner
          </Link>
          <Link href="/symptoms" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
            Symptom Chat
          </Link>
        </div>
      </div>
    </footer>
  );
}

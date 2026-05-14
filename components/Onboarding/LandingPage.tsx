import Link from "next/link";

interface LandingPageProps {
  onOpenTool: () => void;
}

const LandingPage = ({ onOpenTool }: LandingPageProps) => {
  return (
    <main className="h-screen flex flex-col items-center justify-center px-6 py-10 overflow-hidden">
      <div className="w-full max-w-2xl flex flex-col items-center gap-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              CHI 2026
            </span>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1">
              <svg
                className="w-3 h-3 text-amber-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Best Paper Award
            </span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 tracking-tight leading-tight">
            Interactive Explainable Ranking
          </h1>

          {/* Authors + affiliation */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-10">
              <a
                href="https://chaozhang.design/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 group"
              >
                <img
                  src="/chao-zhang.jpg"
                  alt="Chao Zhang"
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200"
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                  Chao Zhang
                </span>
              </a>
              <a
                href="https://www.cs.cornell.edu/abe/group/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 group"
              >
                <img
                  src="/abe-davis.png"
                  alt="Abe Davis"
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200"
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                  Abe Davis
                </span>
              </a>
            </div>
            <p className="text-xs text-gray-400 tracking-wide uppercase">
              Cornell University
            </p>
          </div>
        </div>

        {/* Video */}
        <div className="w-full rounded-2xl overflow-hidden border border-gray-100 shadow-lg">
          <iframe
            className="w-full aspect-video"
            src="https://www.youtube.com/embed/cPxyd8doP_4"
            title="Interactive Explainable Ranking"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onOpenTool}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors shadow-sm"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
            Open Tool
          </button>
          <Link
            href="/ier"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Project Page
          </Link>
        </div>
      </div>
    </main>
  );
};

export default LandingPage;

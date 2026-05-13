import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive Explainable Ranking",
  description: "",
};

const LINKS = [
  {
    label: "Paper",
    href: "https://dl.acm.org/doi/10.1145/3772318.3790810",
    icon: (
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
    ),
  },
  {
    label: "Video",
    href: "https://drive.google.com/file/d/1ay2XOiKaTCWf9xmrms4-2L3OPy4idJUy/preview",
    icon: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    label: "Tool",
    href: "https://ranking.chaozhang.design/",
    icon: (
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
    ),
  },
  {
    label: "Code",
    href: "https://github.com/zhangchaodesign/explainable-ranking",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
  },
];

export default function ProjectPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        {/* Hero */}
        <div className="space-y-5">
          {/* Venue + Award */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              CHI 2026
            </span>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1">
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

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            Interactive Explainable Ranking
          </h1>

          {/* Authors */}
          <p className="text-base text-gray-600">
            <a
              href="https://chaozhang.design/"
              target="_blank"
              className="text-blue-600 hover:underline font-medium"
            >
              Chao Zhang
            </a>
            {" and "}
            <span className="font-medium">
              <a
                href="https://abedavis.com/"
                target="_blank"
                className="text-blue-600 hover:underline font-medium"
              >
                Abe Davis
              </a>
            </span>
            <span className="text-gray-400 ml-2 text-sm">
              Cornell University
            </span>
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
              >
                {link.icon}
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Teaser figure */}
        <figure className="space-y-3">
          <img
            src="/teaser_figure.jpg"
            alt="Interactive Explainable Ranking teaser figure"
            className="w-full border-gray-100 shadow-sm"
          />
          <figcaption className="text-xs text-gray-500 leading-relaxed">
            In this paper, we formalize explainable ranking as a new problem for
            decision-making tools: given a set of options, the user needs to
            find a preferred ranking of those options that is consistent with
            some weighted combination of simpler or less ambiguous criteria (an
            explanation). To assist users in explainable ranking, our tool makes
            the three loops interactive: (1) rank choices, (2) explain with
            criteria and weights, and (3) identify &amp; resolve conflicts. It
            visualizes conflicts between the user proposed ranking and the
            ranking explained by current criteria and weights; allows users to
            freely edit criteria and weights or add new criteria; and offers
            User Insertion Sort to safely use uncertain priors (e.g., from AI or
            optimization) while ensuring that every ranking decision is checked
            by a human user. We evaluate our system on different ranking tasks
            reflecting real-world use cases.
          </figcaption>
        </figure>

        {/* Abstract */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            Abstract
          </h2>
          <div className="w-8 h-0.5 bg-gray-200 rounded-full" />
          <p className="text-sm text-gray-600 leading-relaxed">
            We propose an interactive decision-making tool for discovering and
            exploring explainable rankings for a given set of choices (e.g., job
            offers, vacation destinations, award candidates). We define an
            explainable ranking as an ordering of choices based on some
            consistent weighting of measured criteria. Our tool is designed to
            help users explore different orderings, criteria, and criterion
            weights in search of an explainable ranking that reflects their own
            personal preferences. To achieve this, we combine visualization,
            optimization, and (optionally) the integration of AI to help users
            identify and correct or explain inconsistencies in their evaluation
            of different choices. Through user experiments, we demonstrate that
            our tool leads to more consistent explainable rankings with greater
            user confidence.
          </p>
        </section>

        {/* Video */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            Demo Video
          </h2>
          <div className="w-8 h-0.5 bg-gray-200 rounded-full" />
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <iframe
              className="w-full aspect-video"
              src="https://drive.google.com/file/d/1ay2XOiKaTCWf9xmrms4-2L3OPy4idJUy/preview"
              allow="autoplay"
              allowFullScreen
            />
          </div>
        </section>

        {/* Citation */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            Citation
          </h2>
          <div className="w-8 h-0.5 bg-gray-200 rounded-full" />
          <div
            className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-2xs font-mono text-gray-500 whitespace-pre-wrap leading-relaxed select-all overflow-x-auto"
            style={{ fontSize: "11px" }}
          >{`@inproceedings{10.1145/3772318.3790810,
  author = {Zhang, Chao and Davis, Abe},
  title = {Interactive Explainable Ranking},
  year = {2026},
  isbn = {9798400722783},
  publisher = {Association for Computing Machinery},
  address = {New York, NY, USA},
  url = {https://doi.org/10.1145/3772318.3790810},
  doi = {10.1145/3772318.3790810},
  booktitle = {Proceedings of the 2026 CHI Conference on Human Factors in Computing Systems},
  articleno = {619},
  numpages = {17},
  keywords = {Ranking, Decision-Making},
  location = {Barcelona, Spain},
  series = {CHI '26}
}`}</div>
        </section>

        {/* Footer */}
        <footer className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
          <span>Cornell University · CHI 2026</span>
          <a href="/" className="hover:text-gray-600 transition-colors">
            ← Open Tool
          </a>
        </footer>
      </div>
    </main>
  );
}

import React, { useState } from "react";

interface TutorialPanelProps {
  onClose: () => void;
}

const TABS = ["Guide", "Data Format", "Paper & Citation", "Contact"] as const;
type Tab = (typeof TABS)[number];

const TutorialPanel = ({ onClose }: TutorialPanelProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("Guide");

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-0 flex-shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Interactive Explainable Ranking
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Tutorial & Documentation
              </p>
            </div>
            <button
              className="btn btn-sm btn-ghost btn-square text-gray-400 hover:text-gray-600"
              onClick={onClose}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-100">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-xs font-medium transition-colors relative ${
                  activeTab === tab
                    ? "text-blue-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === "Guide" && <GuideTab />}
          {activeTab === "Data Format" && <DataFormatTab />}
          {activeTab === "Paper & Citation" && <PaperTab />}
          {activeTab === "Contact" && <ContactTab />}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex-shrink-0">
          <button className="btn btn-sm btn-neutral w-full" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Guide Tab                                                          */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    num: "1",
    title: "Load your data",
    desc: "Paste a Google Sheet link or upload a CSV/TSV file. Then select which columns to use as criteria, info, and images.",
  },
  {
    num: "2",
    title: "Set your target ranking",
    desc: "In the Target Rank panel, drag and drop items into your preferred order. You can also use Insertion Sort for guided pairwise comparisons.",
  },
  {
    num: "3",
    title: "Adjust criterion weights",
    desc: "In the Weights panel, drag the weight bars to change how much each criterion matters. Click Estimate Weights to automatically find weights that best explain your ranking.",
  },
  {
    num: "4",
    title: "Identify conflicts",
    desc: "The Rank Comparison slope chart highlights conflicts between your target ranking and the weight-based ranking. Green lines mean agreement; red lines mean contradiction.",
  },
  {
    num: "5",
    title: "Resolve conflicts",
    desc: "Click on conflicting items to compare them side by side. You can edit scores directly, adjust weights, or add new criteria to resolve the inconsistency.",
  },
  {
    num: "6",
    title: "Add new criteria",
    desc: "Click Add a Criterion to define a new criterion. Optionally use AI to generate initial scores based on a text description.",
  },
  {
    num: "7",
    title: "Export",
    desc: "When satisfied, click Export Data to download your final ranking and data as a TSV file.",
  },
];

const GuideTab = () => (
  <div className="space-y-5">
    {/* Teaser */}
    <img
      src="/teaser_figure.jpg"
      alt="Interactive Explainable Ranking teaser"
      className="w-full"
    />

    {/* Steps */}
    <div className="space-y-3">
      {STEPS.map((step) => (
        <div key={step.num} className="flex gap-3">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-2xs font-semibold flex items-center justify-center mt-0.5">
            {step.num}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-800">{step.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              {step.desc}
            </p>
          </div>
        </div>
      ))}
    </div>

    {/* Video */}
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-700">Tutorial Video</p>
      <iframe
        className="w-full aspect-video rounded-lg border border-gray-200"
        src="https://drive.google.com/file/d/1ay2XOiKaTCWf9xmrms4-2L3OPy4idJUy/preview"
        allow="autoplay"
        allowFullScreen
      />
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Data Format Tab                                                    */
/* ------------------------------------------------------------------ */

const DataFormatTab = () => (
  <div className="space-y-4">
    <p className="text-xs text-gray-500 leading-relaxed">
      Your data file (CSV or TSV) must follow the format below. See an{" "}
      <a
        href="https://docs.google.com/spreadsheets/d/1WOgYKSJMVTJcHmguyRtQBwJ9iWesat55N6mFIp5uXfs/edit?usp=sharing"
        target="_blank"
        className="text-blue-500 hover:underline font-medium"
      >
        example sheet
      </a>{" "}
      for reference.
    </p>

    {/* Format table */}
    <div className="bg-gray-50 rounded-lg p-4 text-xs font-mono overflow-x-auto border border-gray-100">
      <table className="border-collapse w-full">
        <thead>
          <tr className="text-gray-400 text-2xs uppercase tracking-wider">
            <th className="text-left pr-4 pb-2 font-medium">UID Column</th>
            <th className="text-left pr-4 pb-2 font-medium">Column A</th>
            <th className="text-left pr-4 pb-2 font-medium">Column B</th>
            <th className="text-left pr-4 pb-2 font-medium">Column C</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          <tr>
            <td className="pr-4 py-1.5 text-blue-600 font-semibold">
              index:UID
            </td>
            <td className="pr-4 py-1.5 text-gray-600">Column A</td>
            <td className="pr-4 py-1.5 text-gray-600">Column B</td>
            <td className="pr-4 py-1.5 text-gray-600">Column C</td>
          </tr>
          <tr>
            <td className="pr-4 py-1.5 text-purple-600">cprop:type:info</td>
            <td className="pr-4 py-1.5 text-gray-600">name</td>
            <td className="pr-4 py-1.5 text-gray-600">criterion</td>
            <td className="pr-4 py-1.5 text-gray-600">image</td>
          </tr>
          <tr>
            <td className="pr-4 py-1.5 text-purple-600">cprop:weight:1</td>
            <td className="pr-4 py-1.5 text-gray-400"></td>
            <td className="pr-4 py-1.5 text-gray-600">1</td>
            <td className="pr-4 py-1.5 text-gray-400"></td>
          </tr>
          <tr className="text-gray-400">
            <td className="pr-4 py-1.5">ABC</td>
            <td className="pr-4 py-1.5">Item 1</td>
            <td className="pr-4 py-1.5">5</td>
            <td className="pr-4 py-1.5">https://...</td>
          </tr>
          <tr className="text-gray-400">
            <td className="pr-4 py-1.5">DEF</td>
            <td className="pr-4 py-1.5">Item 2</td>
            <td className="pr-4 py-1.5">3</td>
            <td className="pr-4 py-1.5">https://...</td>
          </tr>
          <tr className="text-gray-400">
            <td className="pr-4 py-1.5">GHI</td>
            <td className="pr-4 py-1.5">Item 3</td>
            <td className="pr-4 py-1.5">8</td>
            <td className="pr-4 py-1.5">https://...</td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Explanations */}
    <div className="space-y-3">
      <FormatItem
        label="index:UID"
        color="text-blue-600"
        description={
          <>
            First column header must have the{" "}
            <code className="bg-gray-100 px-1 py-0.5 rounded text-2xs">
              index:
            </code>{" "}
            prefix to mark the unique identifier column.{" "}
            <span className="font-medium text-gray-700">Required.</span>
          </>
        }
      />
      <FormatItem
        label="cprop:type:default"
        color="text-purple-600"
        description={
          <>
            Second row defines column types. The value after the last colon is
            the default type for unlabeled columns. Valid types:{" "}
            {[
              "name",
              "criterion",
              "image",
              "video",
              "link",
              "file",
              "info",
              "filter",
            ].map((t, i) => (
              <span key={t}>
                {i > 0 && ", "}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-2xs">
                  {t}
                </code>
              </span>
            ))}
            .
          </>
        }
      />
      <FormatItem
        label="cprop:weight:default"
        color="text-purple-600"
        description="Third row defines default weights for criterion columns."
      />
    </div>
  </div>
);

const FormatItem = ({
  label,
  color,
  description,
}: {
  label: string;
  color: string;
  description: React.ReactNode;
}) => (
  <div className="flex gap-3">
    <span
      className={`flex-shrink-0 w-36 text-xs font-mono font-semibold ${color} mt-0.5`}
    >
      {label}
    </span>
    <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Paper & Citation Tab                                               */
/* ------------------------------------------------------------------ */

const PaperTab = () => (
  <div className="space-y-4">
    <p className="text-xs text-gray-500 leading-relaxed">
      For more details, please check out our CHI 2026 paper:{" "}
      <a
        href="https://dl.acm.org/doi/10.1145/3772318.3790810"
        target="_blank"
        className="text-blue-500 hover:underline font-medium"
      >
        Interactive Explainable Ranking — ACM DL
      </a>
      . The source code is available on{" "}
      <a
        href="https://github.com/zhangchaodesign/explainable-ranking"
        target="_blank"
        className="text-blue-500 hover:underline font-medium"
      >
        GitHub
      </a>
      .
    </p>

    {/* BibTeX */}
    <div>
      <p className="text-xs font-medium text-gray-700 mb-2">BibTeX Citation</p>
      <div className="bg-gray-50 rounded-lg p-4 text-2xs font-mono text-gray-500 overflow-x-auto whitespace-pre-wrap select-all border border-gray-100 leading-relaxed">
        {`@inproceedings{10.1145/3772318.3790810,
  author = {Zhang, Chao and Davis, Abe},
  title = {Interactive Explainable Ranking},
  year = {2026},
  isbn = {9798400722783},
  publisher = {Association for Computing Machinery},
  address = {New York, NY, USA},
  url = {https://doi.org/10.1145/3772318.3790810},
  doi = {10.1145/3772318.3790810},
  abstract = {We propose an interactive decision-making tool for discovering and exploring explainable rankings for a given set of choices (e.g., job offers, vacation destinations, award candidates). We define an explainable ranking as an ordering of choices based on some consistent weighting of measured criteria. Our tool is designed to help users explore different orderings, criteria, and criterion weights in search of an explainable ranking that reflects their own personal preferences. To achieve this, we combine visualization, optimization, and (optionally) the integration of AI to help users identify and correct or explain inconsistencies in their evaluation of different choices. Through user experiments, we demonstrate that our tool leads to more consistent explainable rankings with greater user confidence.},
  booktitle = {Proceedings of the 2026 CHI Conference on Human Factors in Computing Systems},
  articleno = {619},
  numpages = {17},
  keywords = {Ranking, Decision-Making},
  location = {Barcelona, Spain},
  series = {CHI '26}
}`}
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Contact Tab                                                        */
/* ------------------------------------------------------------------ */

const ContactTab = () => (
  <div className="space-y-4">
    <p className="text-xs text-gray-500 leading-relaxed">
      For any questions or feedback, please contact us:
    </p>
    <div className="flex gap-3">
      <ContactCard
        name="Chao Zhang"
        email="cz468@cornell.edu"
        website="https://chaozhang.design/"
      />
      <ContactCard name="Abe Davis" email="abedavis@cornell.edu" />
    </div>
  </div>
);

const ContactCard = ({
  name,
  email,
  website,
}: {
  name: string;
  email: string;
  website?: string;
}) => (
  <div className="flex items-center flex-grow gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-800">
        {website ? (
          <a
            href={website}
            target="_blank"
            className="text-blue-500 hover:underline"
          >
            {name}
          </a>
        ) : (
          name
        )}
      </p>
      <a
        href={`mailto:${email}`}
        className="text-2xs text-gray-400 hover:text-blue-500 transition-colors"
      >
        {email}
      </a>
    </div>
  </div>
);

export default TutorialPanel;

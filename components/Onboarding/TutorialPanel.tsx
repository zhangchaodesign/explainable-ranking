import React from "react";

interface TutorialPanelProps {
  onClose: () => void;
}

const TutorialPanel = ({ onClose }: TutorialPanelProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Tutorial & Help
            </h2>
            <button className="btn btn-sm btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>

          {/* Teaser Figure */}
          <img
            src="/teaser_figure.jpg"
            alt="Interactive Explainable Ranking teaser"
            className="w-full"
          />

          {/* How to Use */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">
              How to Use
            </h3>
            <ol className="text-xs text-gray-500 space-y-2 list-decimal list-inside">
              <li>
                <span className="font-medium text-gray-700">Load your data</span>
                {" — "}
                Paste a Google Sheet link or upload a CSV/TSV file. Then select
                which columns to use as criteria, info, and images.
              </li>
              <li>
                <span className="font-medium text-gray-700">
                  Set your target ranking
                </span>
                {" — "}
                In the{" "}
                <span className="font-medium text-gray-600">
                  Target Rank panel
                </span>{" "}
                (bottom-left), drag and drop items into your preferred order. You
                can also use{" "}
                <span className="font-medium text-gray-600">
                  Insertion Sort
                </span>{" "}
                for guided pairwise comparisons.
              </li>
              <li>
                <span className="font-medium text-gray-700">
                  Adjust criterion weights
                </span>
                {" — "}
                In the{" "}
                <span className="font-medium text-gray-600">Weights panel</span>{" "}
                (bottom-right), drag the weight bars to change how much each
                criterion matters. Click{" "}
                <span className="font-medium text-gray-600">
                  Estimate Weights
                </span>{" "}
                to automatically find weights that best explain your ranking.
              </li>
              <li>
                <span className="font-medium text-gray-700">
                  Identify conflicts
                </span>
                {" — "}
                The{" "}
                <span className="font-medium text-gray-600">
                  Rank Comparison
                </span>{" "}
                slope chart (top-right) highlights conflicts between your target
                ranking and the weight-based ranking. Green lines mean agreement;
                red lines mean contradiction.
              </li>
              <li>
                <span className="font-medium text-gray-700">
                  Resolve conflicts
                </span>
                {" — "}
                Click on conflicting items to compare them side by side. You can
                edit scores directly, adjust weights, or add new criteria to
                resolve the inconsistency.
              </li>
              <li>
                <span className="font-medium text-gray-700">
                  Add new criteria
                </span>
                {" — "}
                Click{" "}
                <span className="font-medium text-gray-600">
                  Add a Criterion
                </span>{" "}
                to define a new criterion. Optionally use AI to generate initial
                scores based on a text description.
              </li>
              <li>
                <span className="font-medium text-gray-700">Export</span>
                {" — "}
                When satisfied, click{" "}
                <span className="font-medium text-gray-600">Export Data</span> to
                download your final ranking and data as a TSV file.
              </li>
            </ol>
          </div>

          {/* Video */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">
              Tutorial Video
            </h3>
            <iframe
              className="w-full aspect-video rounded-md border"
              src="https://drive.google.com/file/d/1ay2XOiKaTCWf9xmrms4-2L3OPy4idJUy/preview"
              allow="autoplay"
              allowFullScreen
            />
          </div>

          {/* Data Format */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Data Format</h3>
            <p className="text-xs text-gray-500">
              Your data file (CSV or TSV) must follow this format (
              <a
                href="https://docs.google.com/spreadsheets/d/1WOgYKSJMVTJcHmguyRtQBwJ9iWesat55N6mFIp5uXfs/edit?usp=sharing"
                target="_blank"
                className="text-blue-500 hover:underline"
              >
                example sheet
              </a>
              ):
            </p>
            <div className="bg-gray-50 rounded-md p-3 text-xs font-mono overflow-x-auto">
              <table className="border-collapse">
                <tbody>
                  <tr>
                    <td className="pr-4 text-blue-600 font-semibold">
                      index:UID
                    </td>
                    <td className="pr-4">Column A</td>
                    <td className="pr-4">Column B</td>
                    <td className="pr-4">Column C</td>
                  </tr>
                  <tr>
                    <td className="pr-4 text-purple-600">cprop:type:info</td>
                    <td className="pr-4">name</td>
                    <td className="pr-4">criterion</td>
                    <td className="pr-4">image</td>
                  </tr>
                  <tr>
                    <td className="pr-4 text-purple-600">cprop:weight:1</td>
                    <td className="pr-4"></td>
                    <td className="pr-4">1</td>
                    <td className="pr-4"></td>
                  </tr>
                  <tr className="text-gray-500">
                    <td className="pr-4">ABC</td>
                    <td className="pr-4">Item 1</td>
                    <td className="pr-4">5</td>
                    <td className="pr-4">https://...</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
              <li>
                <span className="font-medium text-gray-700">index:UID</span> —
                First column header must have the{" "}
                <code className="bg-gray-100 px-1 rounded">index:</code> prefix
                to mark the unique identifier column. This is required.
              </li>
              <li>
                <span className="font-medium text-gray-700">
                  cprop:type:default
                </span>{" "}
                — Second row defines column types. The value after the last
                colon is the default type for unlabeled columns. Valid types:{" "}
                <code className="bg-gray-100 px-1 rounded">name</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">criterion</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">image</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">video</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">link</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">file</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">info</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">filter</code>.
              </li>
              <li>
                <span className="font-medium text-gray-700">
                  cprop:weight:default
                </span>{" "}
                — Third row defines default weights for criterion columns.
              </li>
            </ul>
          </div>

          {/* Paper & Citation */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Paper</h3>
            <p className="text-xs text-gray-500">
              For more details, please check out our CHI 2026 paper:{" "}
              <a
                href="https://dl.acm.org/doi/10.1145/3772318.3790810"
                target="_blank"
                className="text-xs text-blue-500 hover:underline"
              >
                Interactive Explainable Ranking — ACM DL
              </a>
              . The source code is available on{" "}
              <a
                href="https://github.com/zhangchaodesign/explainable-ranking"
                target="_blank"
                className="text-blue-500 hover:underline"
              >
                GitHub
              </a>
              . You can also cite our paper using the following BibTeX entry:
            </p>
            <div className="bg-gray-50 rounded-md p-3 text-xs font-mono text-gray-500 overflow-x-auto whitespace-pre-wrap select-all">
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

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Contact</h3>
            <p className="text-xs text-gray-500">
              For any questions or feedback, please contact us:
            </p>
            <div className="text-xs text-gray-600 space-y-1">
              <p>
                <a
                  href="https://chaozhang.design/"
                  target="_blank"
                  className="font-medium text-blue-500 hover:underline"
                >
                  Chao Zhang
                </a>
                {" — "}
                <a
                  href="mailto:cz468@cornell.edu"
                  className="text-blue-500 hover:underline"
                >
                  cz468@cornell.edu
                </a>
              </p>
              <p>
                <span className="font-medium">Abe Davis</span>
                {" — "}
                <a
                  href="mailto:abedavis@cornell.edu"
                  className="text-blue-500 hover:underline"
                >
                  abedavis@cornell.edu
                </a>
              </p>
            </div>
          </div>

          <button className="btn btn-sm btn-neutral w-full" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialPanel;

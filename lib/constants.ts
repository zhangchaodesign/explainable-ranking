export type DatasetType =
  | "cat"
  | "city"
  | "vacation"
  | "video"
  | "minutes"
  | "demo"
  | "grading";

export const DATASET_SHEETS: Record<DatasetType, string> = {
  cat: "15tAcvS1-nCkv0SI8xF4OlMXMG8oY37E1Wm_t3sbq7_Q",
  city: "1ObwSq8nsNusyLNwxP2RaEnxCu1IdDiOxzhGry7jwjOc",
  video: "1lOkVP7J-Dd8Sw-6iqNn5KUzN3l2dOj3GDQV-ewhRblI",
  minutes: "15kcl5QcFRtrnhJuWmGSADLkGotbyurKR6wuv9HJAj2M",
  vacation: "17OKQWvpRVUR8JnIFfGxmBhN1oLq-C8dAaXrwRsT8Wxo",
  demo: "1_Tl_y8V4dNu41jjzU5P9Y4YRRnwHx-VTHBLe07ZXqEI",
  grading: "1kUw5Rib9Pax3QGVVG-PS792MdHWpYaf4QOFvqRtZHdY",
};

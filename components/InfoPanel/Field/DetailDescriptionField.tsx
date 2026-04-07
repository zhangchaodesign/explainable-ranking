import React, { ReactNode } from "react";
import TextArea, { TextAreaProps } from "@/components/InfoPanel/Field/TextArea";

export const enum DetailDescriptionFieldColors {
  BLUE = "blue",
  GRAY = "gray",
  RED = "red",
  GREEN = "green",
}

type BoxColorProps = {
  color: DetailDescriptionFieldColors;
  children: ReactNode | undefined;
};

const DetailBoxBackground = (props: BoxColorProps) => {
  switch (props.color) {
    case DetailDescriptionFieldColors.GRAY:
      return (
        <div className="p-4 text-sm font-medium rounded-md bg-slate-50 text-white w-full">
          {props.children}
        </div>
      );
    case DetailDescriptionFieldColors.RED:
      return (
        <div className="p-4 text-sm font-medium rounded-md bg-rose-700 text-white w-full">
          {props.children}
        </div>
      );
    case DetailDescriptionFieldColors.GREEN:
      return (
        <div className="p-4 text-sm font-medium rounded-md bg-emerald-700 text-white w-full">
          {props.children}
        </div>
      );
    case DetailDescriptionFieldColors.BLUE:
      return (
        <div className="p-4 text-sm font-medium rounded-md bg-sky-700 text-white w-full">
          {props.children}
        </div>
      );
    default:
      return (
        <div className="p-4 text-sm font-medium rounded-md bg-slate-50 text-white w-full">
          {props.children}
        </div>
      );
  }
};

export type DetailDescriptionFieldProps = TextAreaProps & {
  // content: string | null | number;
  // immutable?: boolean;
  // onChange?: (value: string) => void;
  labelName: string;
  colorString?: string;
};

export const DetailDescriptionField = (props: DetailDescriptionFieldProps) => {
  // let color = props.colorString ?? "gray";
  // ${props.colorString??defaultColor}
  switch (props.colorString) {
  }
  return (
    <div className="space-y-2">
      <DetailBoxBackground
        color={props.colorString as DetailDescriptionFieldColors}
      >
        <h3 className="font-semibold text-sm text-gray-400 mb-2">
          {props.labelName}
        </h3>
        <TextArea
          content={props.content}
          editable={true}
          onChange={props.onChange}
          classes="text-white"
        />
        <div className="card-actions justify-start flex mt-1"></div>
      </DetailBoxBackground>
    </div>
  );
};

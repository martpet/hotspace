type LibreProc = "libre";
type SharpProc = "sharp";
type PandocProc = "pandoc";
type AwsMediaConvertProc = "aws_mediaconvert";

export type PostProcessor =
  | AwsMediaConvertProc
  | CustomPostProcessor;

export type CustomPostProcessor =
  | LibreProc
  | SharpProc
  | PandocProc;

export type PostProcessConf =
  | AwsMediaConvertConf
  | CustomPostProcessConf;

export type CustomPostProcessConf =
  | LibreConf
  | PandocConf
  | SharpConf;

export interface AwsMediaConvertConf {
  proc: AwsMediaConvertProc;
  to?: never;
}

export type SharpConf =
  & {
    proc: SharpProc;
  }
  & (
    | {
      to: "image/jpeg";
      thumbOnly?: never;
    }
    | {
      to?: never;
      thumbOnly: true;
    }
  );

export interface LibreConf {
  proc: LibreProc;
  to: "application/pdf" | "image/png";
}

export interface PandocConf {
  proc: PandocProc;
  to: "text/html";
}

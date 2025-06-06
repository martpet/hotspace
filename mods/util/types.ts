export interface FormFieldConstraints {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  title?: string;
}

export type MaybePromise<T> = Promise<T> | T;

export type UnknownValues<T> = { [K in keyof T]: unknown };

export type OmitFirst<T extends unknown[]> = T extends [unknown, ...infer R] ? R
  : never;

export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export type Never<T> = {
  [K in keyof T]?: never;
};

export type MaybeNever<T> = T | Never<T>;

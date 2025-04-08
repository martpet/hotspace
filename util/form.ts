interface ExtractFormDataArrayOptions {
  formData: FormData;
  prefix: string;
}

export function extractFormDataArray(opt: ExtractFormDataArrayOptions) {
  const entriesByIndex: Record<string, FormData> = {};

  for (const [name, value] of opt.formData.entries()) {
    const [prefix, index, nestedName] = name.split("_");
    if (prefix !== opt.prefix) continue;
    entriesByIndex[index] ??= new FormData();
    entriesByIndex[index].set(nestedName, value);
  }

  return Object.values(entriesByIndex);
}

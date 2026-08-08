const legacyPairs: Array<[RegExp, string]> = [
  [/\u00c3\u00a1/g, "á"], [/\u00c3\u00a0/g, "à"], [/\u00c3\u00a2/g, "â"], [/\u00c3\u00a3/g, "ã"],
  [/\u00c3\u00a9/g, "é"], [/\u00c3\u00aa/g, "ê"], [/\u00c3\u00ad/g, "í"], [/\u00c3\u00b3/g, "ó"],
  [/\u00c3\u00b4/g, "ô"], [/\u00c3\u00b5/g, "õ"], [/\u00c3\u00ba/g, "ú"], [/\u00c3\u00a7/g, "ç"],
  [/\u00c3\u0081/g, "Á"], [/\u00c3\u0089/g, "É"], [/\u00c3\u008d/g, "Í"], [/\u00c3\u0093/g, "Ó"],
  [/\u00c3\u009a/g, "Ú"], [/\u00c3\u0087/g, "Ç"], [/\u00c2\u00b7/g, "·"], [/\u00e2\u0080\u0094/g, "—"],
];

export function displayText(value?: string) {
  return legacyPairs.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), value ?? "");
}

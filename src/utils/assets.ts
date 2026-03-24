export const schemeImageMap = {
  "scheme-inline-01.png": require("../../assets/schemes/scheme-inline-01.png"),
  "scheme-inline-02.png": require("../../assets/schemes/scheme-inline-02.png"),
  "scheme-inline-03.png": require("../../assets/schemes/scheme-inline-03.png"),
  "scheme-inline-04.png": require("../../assets/schemes/scheme-inline-04.png"),
  "scheme-inline-05.png": require("../../assets/schemes/scheme-inline-05.png"),
  "scheme-inline-06.png": require("../../assets/schemes/scheme-inline-06.png"),
} as const;

export type SchemeImageKey = keyof typeof schemeImageMap;

export function resolveSchemeImage(imageKey: string) {
  return schemeImageMap[(imageKey as SchemeImageKey) ?? "scheme-inline-01.png"] ?? schemeImageMap["scheme-inline-01.png"];
}

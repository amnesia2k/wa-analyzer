export function formatName(name: string) {
  const unsafeName = name.replace(/\.txt$/, "");

  return unsafeName;
}

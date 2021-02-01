export class CheckError extends Error {
}

export function check(condition: any, errorMessage: string): void | never {
  if (!condition) throw new CheckError(errorMessage);
}

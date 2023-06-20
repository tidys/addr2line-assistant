export function checkIsIp(str: string) {
  const arr = str.split(".");
  if (arr.length === 4) {
    return true;
  }
  return false;
}
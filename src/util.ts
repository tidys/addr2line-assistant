export function checkLeakFileValid(file: string): { err: number, msg: string } {
  const ret = { err: 0, msg: '' };
  return ret;
}
export function checkAppValid(pkg: string): { err: number, msg: string } {
  const ret = { err: 0, msg: '' };
  const arr = pkg.split('.');
  if (arr.length !== 3) {
    ret.err = 1;
    ret.msg = "包名无效";
    return ret;
  }
  return ret;
}
export enum ERROR {
  NO_PORT = 1,
}

export function checkIsIpValid(str: string): { err: number, msg: string } {
  const ret = { err: 0, msg: '' };

  const regex = /^(\d{1,3}\.){3}\d{1,3}:\d{1,5}$/;
  if (regex.test(str)) {
    return ret;
  }
  const arr = str.split(".");
  if (arr.length !== 4) {
    ret.err = 1;
    ret.msg = '无效的IP';
    return ret;
  }
  const port = arr[3].split(':');
  if (port.length !== 2) {
    ret.err = ERROR.NO_PORT;
    ret.msg = "缺少端口";
    return ret;
  }
  return ret;
}
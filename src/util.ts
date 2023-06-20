export function checkIsIp(str: string): { err: number, msg: string } {
  const ret = { err: 0, msg: '' }

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
    ret.err = 2;
    ret.msg = "缺少端口";
    return ret;
  }
  return ret;
}
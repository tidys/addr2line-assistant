import * as ADbDriver from "adb-driver";

export async function remoteDevicesFileExist(file: string) {
  if (ADbDriver.isSystemAdbAvailable()) {
    file = file.trim();
    const cmd = `adb shell ls ${file}`;
    const ret: any = await ADbDriver.execADBCommand(cmd);
    // 如果文件存在，则会输出文件的名称和路径。如果文件不存在，则不会输出任何内容。
    if (typeof ret === 'string' && ret.indexOf(file) !== -1) {
      return true;
    } else if (typeof ret === 'object' && ret.code !== 0) {
      return false;
    }
    return false;
  }
  return false;
}
import { createReadStream } from "fs";
import { execSync, execFile } from "child_process";
import * as readline from "readline";
import * as ADbDriver from "adb-driver";
import { Log, log } from "./log";
import { addLocalFiles, getKey, getLeakFile } from "./config";
import { tmpdir, homedir } from "os"
import { ensureFileSync } from "fs-extra"
import { join } from "path";
import { LeakAddress, LeakStack } from "./leak-stack";


class LeakReporter {
  async connectIP(ip: string) {
    log.output(`connecting ${ip}`);
    if (ADbDriver.isSystemAdbAvailable()) {
      const ret: string = await ADbDriver.execADBCommand(`adb connect ${ip}`);
      log.output(ret);
      if (ret.startsWith("connected to") || ret.startsWith("already connected to")) {
        log.output("连接手机成功");
      } else {
        log.output('连接手机失败');
      }
    }
  }
  async pullReportFile(ip: string, app: string) {
    if (ADbDriver.isSystemAdbAvailable()) {
      const prefix = "/storage/emulated/0/Android/data";
      const leakFile = getLeakFile();
      const remoteLeakFile = `${prefix}/${app}/${leakFile}`;

      const b = await this.remoteDevicesFileExist(remoteLeakFile);
      if (!b) {
        log.output(`远程设备不存在文件：${remoteLeakFile}`);
        return;
      }

      //  /storage/emulated/0/Android/data/com.example.jni/files/Documents/leak_report.txt
      const time = (new Date()).getTime();
      const localFile = join(homedir(), 'leak', `leak_report_${time}.txt`);
      ensureFileSync(localFile);
      const cmd = `adb pull ${remoteLeakFile} ${localFile}`;
      log.output(cmd);
      const ret: string = await ADbDriver.execADBCommand(cmd);
      log.output(ret);
      // todo 判断拉取成功

      return localFile;
    }
    return null;
  }
  private async remoteDevicesFileExist(file: string) {
    if (ADbDriver.isSystemAdbAvailable()) {
      const cmd = `adb shell ls ${file}`;
      const ret: string = await ADbDriver.execADBCommand(cmd);
      // 如果文件存在，则会输出文件的名称和路径。如果文件不存在，则不会输出任何内容。
      if (ret && ret.indexOf(file) !== -1) {
        return true;
      }
      return false;
    }
    return false;
  }

  async parse(file: string): Promise<{ stacks: LeakStack[], address: LeakAddress }> {
    return new Promise((resolve, rejects) => {
      const leakAddress = new LeakAddress();

      const stackArray: LeakStack[] = [];
      const rl = readline.createInterface({
        input: createReadStream(file),
        crlfDelay: Infinity
      });
      rl.on('line', (line) => {
        const stack = new LeakStack();
        if (stack.parseLine(line)) {
          stack.address.map(address => leakAddress.add(address));
          stackArray.push(stack);
        }
      });
      rl.on('close', async () => {
        leakAddress.addr2line();
        for (let i = 0; i < stackArray.length; i++) {
          const item = stackArray[i];
        }
        rejects({ stacks: stackArray, address: leakAddress });
      });
    });

  }
}
export const leakReporter = new LeakReporter();
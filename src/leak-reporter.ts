import { createReadStream } from "fs";
import { execSync, execFile } from "child_process";
import * as readline from "readline";
import * as ADbDriver from "adb-driver"
import { log } from "./log";
const soFiles = "";
class LeakResult {
  public address: string[] = [];
  doAddr2line() {
    const cmd = `addr2line -f -C -e ${soFiles} ${this.address.join(" ")}`;
    execSync(cmd);
  }
}

class LeakReporter {
  leaks: LeakResult[] = [];
  async connectPhone(ip: string) {
    log.output(`connecting ${ip}`);
    if (ADbDriver.isSystemAdbAvailable()) {
      const ret: string = await ADbDriver.execADBCommand(`adb connect ${ip}`);
      log.output(ret);
      if (ret.startsWith("connected to") || ret.startsWith("already connected to")) {
        log.output("连接手机成功");
      }
    }
    // execFile(adbFile, args, (error, stdout, stderr) => {
    //   if (error) {
    //     log.output(error.message);
    //   }
    //   if (stdout) {
    //     log.output(stdout);
    //   }
    // });
  }
  pullReportFile() {
    const prefix = "/storage/emulated/0/Android/data/";
    const cmd = `adb pull`;
    execSync(cmd);
  }
  async parse(file: string) {
    return new Promise((resolve, rejects) => {
      const rl = readline.createInterface({
        input: createReadStream(file),
        crlfDelay: Infinity
      });
      rl.on('line', (line) => {

        // if ($line =~ /^leak, time=([\d.]*), stack=([\w ]*), size=(\d*), data=.*/) {

      });
      rl.on('close', () => {
        rejects();
      });
    })

  }
}
export const leakReporter = new LeakReporter();
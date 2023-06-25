import { execSync } from "child_process";
import { log } from "./log";
import { commandSync } from 'execa'
import { assets } from "./assets";
// const { addr2line } = require('addr2line')
// @ts-ignore
import { addr2line } from 'addr2line';
import { getExecutableFile } from "./config";
import { normalize } from "path";
export class LeakAddress {
  public static address: Record<string, string> = {};
  public static clean() {
    this.address = {};
  }
  public static add(addr: string) {
    if (!this.address[addr]) {
      this.address[addr] = 'unknown';
    }
  }
  public static get(addr: string) {
    return this.address[addr];
  }
  private static useNpmPkg(soFile: string, addr: string[]) {
    addr2line([soFile], addr).then((res: string) => {
      console.log(res);
    }).catch((err: Error) => {
      // 会报错一个错误：No .debug_aranges DWARF section found
      // android ndk for window 编译出来的so是没有这个section的
      log.output(err.message);
    });
  }
  public static async addr2line() {
    const keys = Object.keys(this.address);
    const soFile = getExecutableFile();
    if (!soFile) { return; }
    // const addrList = Object.keys(this.address).join(" ");
    const addr2lineFile = assets.getAddr2lineExecutable();
    for (const addr in this.address) {
      // -f 函数名
      const cmd = `${addr2lineFile} -C -e ${soFile} ${addr}`;
      const { stdout, stderr } = commandSync(cmd, { encoding: 'utf-8' })
      if (stderr) {
        log.output(stderr);
      }
      if (stdout) {
        const matches = stdout.match(/(.*):(\d+)$/);
        if (matches?.length === 3) {
          const file = matches[1];
          const line = matches[2];
          const normalizeFile = normalize(file);
          this.address[addr] = `${normalizeFile}:${line}`;
        } else {

          this.address[addr] = stdout;
        }
        console.log(stdout)
      }
    }
  }
}

export class LeakStack {
  private size: number = 0;
  private time: string = '';
  private address: string[] = [];
  parseLine(line: string) {
    // if ($line =~ /^leak, time=([\d.]*), stack=([\w ]*), size=(\d*), data=.*/) {
    const matches = line.match(/^leak, time=([\d.]*), stack=([\w ]*), size=(\d*), data=.*/);
    console.log(matches);
    if (matches && matches.length >= 4) {
      const stack = matches[2];
      const arr = stack.split(' ');
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (item) {
          LeakAddress.add(item);
          this.address.push(item);
        }
      }
      this.time = matches[1];
      this.size = parseFloat(matches[3]);
      return true;
    }
    return false;
  }
  showDetails() {
    const head = `${this.size} bytes lost in blocks ( one of them allocated at ${this.time}.), from following call stack:`;
    log.output(head)
    for (let i = 0; i < this.address.length; i++) {
      const addr = this.address[i];
      const str = LeakAddress.get(addr);
      log.output(str);
    }
  }
}
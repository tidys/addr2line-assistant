import { execSync } from "child_process";
import { log } from "./log";
import { commandSync } from 'execa';
import { assets } from "./assets";
// const { addr2line } = require('addr2line')
// @ts-ignore
import { addr2line } from 'addr2line';
import { getExecutableFile } from "./config";
import { dirname, normalize } from "path";
import { parseSourcemap } from "./util";
import { existsSync } from "fs";
export class LeakAddress {
  public address: Record<string, string> = {};
  public clean() {
    this.address = {};
  }
  public add(addr: string) {
    if (!this.address[addr]) {
      this.address[addr] = 'unknown';
    }
  }
  public get(addr: string) {
    return this.address[addr];
  }
  private useNpmPkg(soFile: string, addr: string[]) {
    addr2line([soFile], addr).then((res: string) => {
      console.log(res);
    }).catch((err: Error) => {
      // 会报错一个错误：No .debug_aranges DWARF section found
      // android ndk for window 编译出来的so是没有这个section的
      log.output(err.message);
    });
  }
  public addr2line() {
    const keys = Object.keys(this.address);
    const soFile = getExecutableFile();
    if (!soFile || !existsSync(soFile)) {
      log.output(`No executable file:${soFile}`);
      return;
    }
    // const addrList = Object.keys(this.address).join(" ");
    const addr2lineFile = assets.getAddr2lineExecutable();
    if (!addr2lineFile || !existsSync(addr2lineFile)) {
      log.output(`No addr2line file: ${addr2lineFile}`);
      return;
    }
    let idx = 0, total = Object.keys(this.address).length;
    for (const addr in this.address) {
      idx++;
      const tip = `addr2line process: ${addr} [${idx}/${total}]`;
      log.output(tip);
      console.log(tip);
      // -f 函数名
      const cmd = `${addr2lineFile} -C -e ${soFile} ${addr}`;
      const { stdout, stderr } = commandSync(cmd, { encoding: 'utf-8', cwd: dirname(addr2lineFile) });
      if (stderr) {
        log.output(stderr);
      }
      if (stdout) {
        const result = parseSourcemap(stdout);
        if (result) {
          const { file, line } = result;
          this.address[addr] = `${file}:${line}`;
        }
        else {
          this.address[addr] = stdout;
        }
      }
    }
  }
}

export class LeakStack {
  public size: number = 0;
  private time: string = '';
  public address: string[] = [];
  parseLine(line: string) {
    // if ($line =~ /^leak, time=([\d.]*), stack=([\w ]*), size=(\d*), data=.*/) {
    const matches = line.match(/^leak, time=([\d.]*), stack=([\w ]*), size=(\d*), data=.*/);
    if (matches && matches.length >= 4) {
      const stack = matches[2];
      const arr = stack.split(' ');
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (item) {
          this.address.push(item);
        }
      }
      this.time = matches[1];
      this.size = parseFloat(matches[3]);
      return true;
    }
    return false;
  }

  getTitle() {
    const kb = this.size / 1024;
    const head = `${this.size} bytes / ${kb.toFixed(0)} kb  lost in blocks ( one of them allocated at ${this.time}.), from following call stack:`;
    return head;
  }
}
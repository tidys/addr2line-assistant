import { createReadStream } from "fs";
import { execSync } from "child_process";
import * as readline from "readline";
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
    connectPhone(ip: string, port: string) {
        const cmd = `adb connect ${ip}:${port}`;
        execSync(cmd);
    }
    pullReportFile() {
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
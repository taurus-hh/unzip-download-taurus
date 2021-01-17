import * as fs from "fs";
import * as util from "util";
import * as path from "path";
const mkdir = util.promisify(fs.mkdir);
const stat = util.promisify(fs.stat);
const unlink = util.promisify(fs.unlink);
export interface optionsConfig {
  mode: number;
}

function checkPathValid(dir: string) {
  const dest = dir.replace(path.parse(dir).root, "");
  if (/[<>:"|?*]/.test(dest)) {
    throw new Error("the path is invalid");
  }
}

export async function mkdirp(
  dirs: string,
  options: optionsConfig = {
    mode: 0o7777,
  }
) {
  checkPathValid(dirs);
  try {
    await mkdir(dirs, options.mode);
  } catch (error) {
    if (error.code === "EPERM") {
      throw error;
    }

    if (error.code === "ENOENT") {
      if (path.dirname(dirs) === dirs) {
        throw new Error(`operation not permitted, mkdir '${dirs}'`);
      }

      if (error.message.includes("null bytes")) {
        throw error;
      }

      await mkdir(path.dirname(dirs));
      return mkdir(dirs);
    }

    try {
      const stats = await stat(dirs);
      if (!stats.isDirectory()) {
        throw new Error("The path is not a directory");
      }
    } catch {
      throw error;
    }
  }
}
export async function remove(path: string) {
  if (fs.existsSync(path)) {
    return await unlink(path)
  }
}
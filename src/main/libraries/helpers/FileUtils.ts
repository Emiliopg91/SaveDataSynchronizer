import { FileHelper } from '@tser-framework/main';
import { FileTreeAction } from '@tser-framework/main/dist/implementations/FileHelper';
import path from 'path';

import { Constants } from './Constants';

export class FileUtils {
  public static isPendingSync(
    source: string,
    target: string,
    sourceRoot: string,
    targetRoot: string,
    exclusions: Array<string> | undefined
  ): boolean {
    let pending = false;

    FileHelper.walkFileTree(
      source,
      (dir: string): FileTreeAction => {
        const relative = path.relative(sourceRoot, dir);
        const dst = path.resolve(targetRoot, relative);

        if (!FileHelper.exists(dst)) {
          pending = true;
          return FileTreeAction.SKIP_SUBTREE;
        } else {
          return FileTreeAction.CONTINUE;
        }
      },
      undefined,
      (file: string): void => {
        if (!exclusions || !exclusions.includes(FileHelper.getName(file))) {
          const relative = path.relative(sourceRoot, file);
          const dst = path.resolve(targetRoot, relative);
          if (!FileHelper.exists(dst) || FileUtils.hasChanged(file, dst)) {
            pending = true;
          }
        }
      }
    );

    if (FileHelper.exists(target)) {
      FileHelper.walkFileTree(
        target,
        (dir: string): FileTreeAction => {
          const relative = path.relative(targetRoot, dir);
          const src = path.resolve(sourceRoot, relative);

          if (!FileHelper.exists(src)) {
            pending = true;
            return FileTreeAction.SKIP_SUBTREE;
          } else {
            return FileTreeAction.CONTINUE;
          }
        },
        undefined,
        (file: string): void => {
          if (!exclusions || !exclusions.includes(FileHelper.getName(file))) {
            const relative = path.relative(targetRoot, file);
            const src = path.resolve(sourceRoot, relative);
            if (!FileHelper.exists(src)) {
              pending = true;
            }
          }
        }
      );
    }

    return pending;
  }

  public static getLastModifiedTime(
    folder: string,
    inclusions: Array<string> | undefined,
    exclusions: Array<string> | undefined
  ): number {
    if (FileHelper.isDirectory(folder)) {
      let time = 0;
      if (inclusions && inclusions.length > 0) {
        for (const inc in inclusions) {
          const file = path.join(folder, inclusions[inc]);
          if (FileHelper.exists(file)) {
            time = Math.max(time, FileHelper.getLastModified(file));
          }
        }
      } else {
        FileHelper.walkFileTree(folder, undefined, undefined, (pathF: string): void => {
          if (!exclusions || !exclusions.includes(FileHelper.getName(pathF))) {
            time = Math.max(time, FileHelper.getLastModified(pathF));
          }
        });
      }
      return time / 1000;
    } else {
      return FileHelper.getLastModified(folder) / 1000;
    }
  }

  public static syncFile(
    source: string,
    sourceRoot: string,
    targetRoot: string,
    dryRun: boolean
  ): number {
    const relative = path.relative(sourceRoot, source);
    const dst = path.resolve(targetRoot, relative);
    let count = 0;

    if (!FileHelper.exists(source)) {
      if (FileHelper.exists(dst)) {
        if (!dryRun) {
          FileHelper.delete(dst);
          console.info("  (-) '" + relative + "'");
        }
        count++;
      }
    } else {
      if (!FileHelper.exists(dst)) {
        if (!dryRun) {
          FileHelper.copy(source, dst);
          console.info("  (+) '" + relative + "'");
        }
        count++;
      } else if (FileUtils.hasChanged(source, dst)) {
        if (!dryRun) {
          FileHelper.copy(source, dst);
          console.info("  (m) '" + relative + "'");
        }
        count++;
      }
    }

    return count;
  }

  public static syncFolder(
    source: string,
    target: string,
    sourceRoot: string,
    targetRoot: string,
    exclusions: Array<string> | undefined,
    dryRun: boolean
  ): number {
    let count = 0;

    FileHelper.walkFileTree(
      source,
      (dir: string): FileTreeAction => {
        const relative = path.relative(sourceRoot, dir);
        const dst = path.resolve(targetRoot, relative);

        if (!FileHelper.exists(dst)) {
          if (!dryRun) {
            FileHelper.mkdir(dst);
            console.info("  (+) '" + relative + "'");
          }
          count++;
        }

        return FileTreeAction.CONTINUE;
      },
      (dir: string): void => {
        const relative = path.relative(sourceRoot, dir);
        const dst = path.resolve(targetRoot, relative);

        if (!dryRun) {
          FileHelper.setLastModified(dst, FileHelper.getLastModified(dir));
        }
      },
      (file: string): void => {
        if (
          Constants.SDS_FILE_NAME != FileHelper.getName(file) &&
          (!exclusions || !exclusions.includes(FileHelper.getName(file)))
        ) {
          const relative = path.relative(sourceRoot, file);
          const dst = path.resolve(targetRoot, relative);

          if (!FileHelper.exists(dst)) {
            if (!dryRun) {
              FileHelper.copy(file, dst);
              FileHelper.setLastModified(dst, FileHelper.getLastModified(file));
              console.info("  (+) '" + relative + "'");
            }
            count++;
          } else if (FileUtils.hasChanged(file, dst)) {
            if (!dryRun) {
              FileHelper.copy(file, dst);
              FileHelper.setLastModified(dst, FileHelper.getLastModified(file));
              console.info("  (m) '" + relative + "'");
            }
            count++;
          }
        }
      }
    );

    if (FileHelper.exists(target)) {
      FileHelper.walkFileTree(
        target,
        (dir: string): FileTreeAction => {
          const relative = path.relative(targetRoot, dir);
          const src = path.resolve(sourceRoot, relative);

          let action = FileTreeAction.CONTINUE;
          if (!FileHelper.exists(src)) {
            if (!dryRun) {
              FileHelper.delete(dir);
              console.info("  (-) '" + relative + "'");
              action = FileTreeAction.SKIP_SUBTREE;
            }
            count++;
          }

          return action;
        },
        undefined,
        (file: string): void => {
          const relative = path.relative(targetRoot, file);
          const src = path.resolve(sourceRoot, relative);

          if (!FileHelper.exists(src)) {
            if (!dryRun) {
              FileHelper.delete(file);
              console.info("  (-) '" + relative + "'");
            }
            count++;
          }
        }
      );
    }

    return count;
  }

  public static hasChanged(f1: string, f2: string): boolean {
    return FileHelper.getLastModified(f1) != FileHelper.getLastModified(f2);
  }
}

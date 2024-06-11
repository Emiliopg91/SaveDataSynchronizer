import { File, FileTreeAction, LoggerMain, Path } from '@tser-framework/main';
import path from 'path';

import { Constants } from './Constants';

export class FileUtils {
  private static LOGGER = new LoggerMain('FileUtils');

  public static isPendingSync(
    source: string,
    target: string,
    sourceRoot: string,
    targetRoot: string,
    exclusions: Array<string> | undefined
  ): boolean {
    const sourcePath = new Path(sourceRoot);
    const targetPath = new Path(targetRoot);
    let pending = false;

    File.walkFileTree(
      new Path(source),
      (dir: Path): FileTreeAction => {
        const relative = sourcePath.relative(dir.getPath());
        const dst = targetPath.resolve(relative.getPath());

        if (!dst.toFile().exists()) {
          pending = true;
          return FileTreeAction.SKIP_SUBTREE;
        } else {
          return FileTreeAction.CONTINUE;
        }
      },
      undefined,
      (file: Path): void => {
        if (!exclusions || !exclusions.includes(file.toFile().getName())) {
          const relative = sourcePath.relative(file.getPath());
          const dst = targetPath.resolve(relative.getPath());
          if (!dst.toFile().exists() || FileUtils.hasChanged(file, dst)) {
            pending = true;
          }
        }
      }
    );

    if (new File({ file: target }).exists()) {
      File.walkFileTree(
        new Path(target),
        (dir: Path): FileTreeAction => {
          const relative = targetPath.relative(dir.getPath());
          const src = sourcePath.resolve(relative.getPath());

          if (!src.toFile().exists()) {
            pending = true;
            return FileTreeAction.SKIP_SUBTREE;
          } else {
            return FileTreeAction.CONTINUE;
          }
        },
        undefined,
        (file: Path): void => {
          if (!exclusions || !exclusions.includes(file.toFile().getName())) {
            const relative = targetPath.relative(file.getPath());
            const src = sourcePath.resolve(relative.getPath());
            if (!src.toFile().exists()) {
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
    if (new File({ file: folder }).isDirectory()) {
      let time = 0;
      if (inclusions && inclusions.length > 0) {
        for (const inc in inclusions) {
          const file = path.join(folder, inclusions[inc]);
          if (new File({ file }).exists()) {
            time = Math.max(time, new File({ file }).getLastModified());
          }
        }
      } else {
        File.walkFileTree(new Path(folder), undefined, undefined, (pathF: Path): void => {
          if (!exclusions || !exclusions.includes(pathF.toFile().getName())) {
            time = Math.max(time, pathF.toFile().getLastModified());
          }
        });
      }
      return time / 1000;
    } else {
      return new File({ file: folder }).getLastModified() / 1000;
    }
  }

  public static syncFile(
    source: string,
    sourceRoot: string,
    targetRoot: string,
    dryRun: boolean
  ): number {
    const relative = new Path(sourceRoot).relative(source);
    const dst = new Path(targetRoot).resolve(relative.getPath());
    let count = 0;

    if (!new File({ file: source }).exists()) {
      if (dst.toFile().exists()) {
        if (!dryRun) {
          dst.toFile().delete();
          FileUtils.LOGGER.info("  (-) '" + relative + "'");
        }
        count++;
      }
    } else {
      if (!dst.toFile().exists()) {
        if (!dryRun) {
          dst.toFile().copy(dst.toFile());
          FileUtils.LOGGER.info("  (+) '" + relative + "'");
        }
        count++;
      } else if (FileUtils.hasChanged(new Path(source), dst)) {
        if (!dryRun) {
          new File({ file: source }).copy(dst.toFile());
          FileUtils.LOGGER.info("  (m) '" + relative + "'");
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

    File.walkFileTree(
      new Path(source),
      (dir: Path): FileTreeAction => {
        const relative = new Path(sourceRoot).relative(dir.getPath());
        const dst = new Path(targetRoot).resolve(relative.getPath());

        if (!dst.toFile().exists()) {
          if (!dryRun) {
            dst.toFile().mkdir();
            FileUtils.LOGGER.info("  (+) '" + relative + "'");
          }
          count++;
        }

        return FileTreeAction.CONTINUE;
      },
      (dir: Path): void => {
        const relative = new Path(sourceRoot).relative(dir.getPath());
        const dst = new Path(targetRoot).resolve(relative.getPath());

        if (!dryRun) {
          dst.toFile().setLastModified(dir.toFile().getLastModified());
        }
      },
      (file: Path): void => {
        if (
          Constants.SDS_FILE_NAME != file.toFile().getName() &&
          (!exclusions || !exclusions.includes(file.toFile().getName()))
        ) {
          const relative = new Path(sourceRoot).relative(file.getPath());
          const dst = new Path(targetRoot).resolve(relative.getPath());

          if (!dst.toFile().exists()) {
            if (!dryRun) {
              dst.toFile().copy(dst.toFile());
              dst.toFile().setLastModified(file.toFile().getLastModified());
              FileUtils.LOGGER.info("  (+) '" + relative + "'");
            }
            count++;
          } else if (FileUtils.hasChanged(file, dst)) {
            if (!dryRun) {
              file.toFile().copy(dst.toFile());
              dst.toFile().setLastModified(file.toFile().getLastModified());
              FileUtils.LOGGER.info("  (m) '" + relative + "'");
            }
            count++;
          }
        }
      }
    );

    if (new File({ file: target }).exists()) {
      File.walkFileTree(
        new Path(target),
        (dir: Path): FileTreeAction => {
          const relative = new Path(targetRoot).relative(dir.getPath());
          const src = new Path(sourceRoot).resolve(relative.getPath());

          let action = FileTreeAction.CONTINUE;
          if (!src.toFile().exists()) {
            if (!dryRun) {
              dir.toFile().delete();
              FileUtils.LOGGER.info("  (-) '" + relative + "'");
              action = FileTreeAction.SKIP_SUBTREE;
            }
            count++;
          }

          return action;
        },
        undefined,
        (file: Path): void => {
          const relative = new Path(targetRoot).relative(file.getPath());
          const src = new Path(sourceRoot).resolve(relative.getPath());

          if (!src.toFile().exists()) {
            if (!dryRun) {
              file.toFile().delete();
              FileUtils.LOGGER.info("  (-) '" + relative + "'");
            }
            count++;
          }
        }
      );
    }

    return count;
  }

  public static hasChanged(f1: Path, f2: Path): boolean {
    return f1.toFile().getLastModified() != f2.toFile().getLastModified();
  }
}

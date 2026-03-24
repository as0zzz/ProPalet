import * as FileSystem from "expo-file-system/legacy";

import { DICTIONARIES_DIRECTORY, REPORTS_DIRECTORY } from "@/src/utils/constants";

function sanitizeFileNamePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

async function ensureDirectory(path: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}

function getDocumentDirectory(): string {
  if (!FileSystem.documentDirectory) {
    throw new Error("Документы на устройстве недоступны.");
  }

  return FileSystem.documentDirectory;
}

export async function writeTextReportFile(fileNameBase: string, contents: string): Promise<string> {
  const directory = `${getDocumentDirectory()}${REPORTS_DIRECTORY}/`;
  await ensureDirectory(directory);
  const path = `${directory}${sanitizeFileNamePart(fileNameBase)}.txt`;
  await FileSystem.writeAsStringAsync(path, contents, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return path;
}

export async function writeDictionaryJsonFile(fileNameBase: string, contents: string): Promise<string> {
  const directory = `${getDocumentDirectory()}${DICTIONARIES_DIRECTORY}/`;
  await ensureDirectory(directory);
  const path = `${directory}${sanitizeFileNamePart(fileNameBase)}.json`;
  await FileSystem.writeAsStringAsync(path, contents, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return path;
}

export async function moveFileIntoReportsDirectory(sourcePath: string, fileNameBase: string, extension: string): Promise<string> {
  const directory = `${getDocumentDirectory()}${REPORTS_DIRECTORY}/`;
  await ensureDirectory(directory);
  const destination = `${directory}${sanitizeFileNamePart(fileNameBase)}.${extension}`;
  const currentInfo = await FileSystem.getInfoAsync(destination);
  if (currentInfo.exists) {
    await FileSystem.deleteAsync(destination, { idempotent: true });
  }
  await FileSystem.moveAsync({ from: sourcePath, to: destination });
  return destination;
}

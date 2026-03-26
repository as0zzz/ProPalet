import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

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

function findSafEntry(entries: string[], name: string): string | undefined {
  return entries.find((entry) => decodeURIComponent(entry).endsWith(`/${name}`));
}

async function getAndroidDocumentsDirectoryUri(): Promise<string> {
  const initialUri = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot("Documents");
  let permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(initialUri);
  if (!permission.granted || !permission.directoryUri) {
    permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  }

  if (!permission.granted || !permission.directoryUri) {
    throw new Error("Не удалось получить доступ к папке Documents. Выберите папку Documents в системном окне.");
  }

  return permission.directoryUri;
}

async function writeAndroidDocumentsFile(directoryName: string, fileName: string, contents: string, mimeType: string): Promise<string> {
  const documentsUri = await getAndroidDocumentsDirectoryUri();
  return writeAndroidDocumentsFileToDirectory(documentsUri, directoryName, fileName, contents, mimeType);
}

async function writeAndroidDocumentsFileToDirectory(
  documentsUri: string,
  directoryName: string,
  fileName: string,
  contents: string,
  mimeType: string,
): Promise<string> {
  let targetDirectoryUri = documentsUri;

  if (directoryName) {
    const entries = await FileSystem.StorageAccessFramework.readDirectoryAsync(documentsUri);
    const existingDirectoryUri = findSafEntry(entries, directoryName);
    targetDirectoryUri = existingDirectoryUri ?? (await FileSystem.StorageAccessFramework.makeDirectoryAsync(documentsUri, directoryName));
  }

  const fileBaseName = fileName.replace(/\.[^.]+$/, "");
  const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(targetDirectoryUri, fileBaseName, mimeType);
  await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, contents, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return fileUri;
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

export async function writeDictionarySourceFile(directoryName: string, fileName: string, contents: string): Promise<string> {
  if (Platform.OS === "android") {
    return writeAndroidDocumentsFile(directoryName, fileName, contents, "text/typescript");
  }

  const baseDirectory = `${getDocumentDirectory()}${DICTIONARIES_DIRECTORY}/`;
  await ensureDirectory(baseDirectory);
  const directory = `${baseDirectory}${sanitizeFileNamePart(directoryName)}/`;
  await ensureDirectory(directory);
  const path = `${directory}${fileName}`;
  await FileSystem.writeAsStringAsync(path, contents, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return path;
}

export async function writeDictionarySourceFiles(
  directoryName: string,
  files: Array<{ fileName: string; contents: string }>,
): Promise<string[]> {
  if (Platform.OS === "android") {
    const documentsUri = await getAndroidDocumentsDirectoryUri();
    const paths: string[] = [];
    for (const file of files) {
      paths.push(await writeAndroidDocumentsFileToDirectory(documentsUri, directoryName, file.fileName, file.contents, "text/typescript"));
    }
    return paths;
  }

  const paths: string[] = [];
  for (const file of files) {
    paths.push(await writeDictionarySourceFile(directoryName, file.fileName, file.contents));
  }
  return paths;
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

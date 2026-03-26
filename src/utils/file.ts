import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

import { ANDROID_REPORTS_PICKER_DIRECTORY, DICTIONARIES_DIRECTORY, REPORTS_DIRECTORY } from "@/src/utils/constants";

const ANDROID_DOCUMENTS_DIRECTORY = "Documents";

function sanitizeFileNamePart(value: string) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").trim() || "export";
}

function getDocumentDirectory() {
  if (!FileSystem.documentDirectory) {
    throw new Error("Локальная папка приложения недоступна.");
  }

  return FileSystem.documentDirectory;
}

function joinPath(baseUri: string, name: string) {
  return baseUri.endsWith("/") ? `${baseUri}${name}` : `${baseUri}/${name}`;
}

function getSafEntryName(uri: string) {
  const decoded = decodeURIComponent(uri);
  const tail = decoded.slice(decoded.lastIndexOf("/") + 1);
  return tail.slice(tail.lastIndexOf(":") + 1);
}

async function ensureDirectory(directoryUri: string) {
  const info = await FileSystem.getInfoAsync(directoryUri);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
  }
}

async function findSafEntry(parentUri: string, name: string) {
  const entries = await FileSystem.StorageAccessFramework.readDirectoryAsync(parentUri);
  return entries.find((entryUri) => getSafEntryName(entryUri) === name);
}

async function ensureSafDirectory(parentUri: string, directoryName: string) {
  const existing = await findSafEntry(parentUri, directoryName);
  if (existing) {
    return existing;
  }

  return FileSystem.StorageAccessFramework.makeDirectoryAsync(parentUri, directoryName);
}

async function replaceSafFile(parentUri: string, fileName: string, mimeType: string, contents: string, encoding: "utf8" | "base64") {
  const existing = await findSafEntry(parentUri, fileName);
  if (existing) {
    await FileSystem.deleteAsync(existing, { idempotent: true });
  }

  const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(parentUri, fileName, mimeType);
  await FileSystem.writeAsStringAsync(fileUri, contents, { encoding });
  return fileUri;
}

async function getAndroidDocumentsDirectoryUri() {
  const initialUri = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot(ANDROID_DOCUMENTS_DIRECTORY);
  const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(initialUri);

  if (!permissions.granted || !permissions.directoryUri) {
    throw new Error("Доступ к папке Documents не выдан.");
  }

  if (getSafEntryName(permissions.directoryUri) !== ANDROID_DOCUMENTS_DIRECTORY) {
    throw new Error("Выберите папку Documents и нажмите Use this folder.");
  }

  return permissions.directoryUri;
}

async function getAndroidReportsDirectoryUri() {
  const documentsUri = await getAndroidDocumentsDirectoryUri();
  return ensureSafDirectory(documentsUri, ANDROID_REPORTS_PICKER_DIRECTORY);
}

function getMimeType(extension: string) {
  switch (extension) {
    case "pdf":
      return "application/pdf";
    case "json":
      return "application/json";
    case "txt":
    case "ts":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
}

export async function writeTextReportFile(fileNameBase: string, text: string) {
  const safeFileName = `${sanitizeFileNamePart(fileNameBase)}.txt`;

  if (Platform.OS === "android") {
    const reportsUri = await getAndroidReportsDirectoryUri();
    return replaceSafFile(reportsUri, safeFileName, getMimeType("txt"), text, "utf8");
  }

  const directoryUri = joinPath(getDocumentDirectory(), REPORTS_DIRECTORY);
  await ensureDirectory(directoryUri);

  const fileUri = joinPath(directoryUri, safeFileName);
  await FileSystem.writeAsStringAsync(fileUri, text, { encoding: FileSystem.EncodingType.UTF8 });
  return fileUri;
}

export async function writeDictionaryJsonFile(fileNameBase: string, contents: string) {
  const safeFileName = `${sanitizeFileNamePart(fileNameBase)}.json`;

  if (Platform.OS === "android") {
    const documentsUri = await getAndroidDocumentsDirectoryUri();
    const dictionariesUri = await ensureSafDirectory(documentsUri, DICTIONARIES_DIRECTORY);
    return replaceSafFile(dictionariesUri, safeFileName, getMimeType("json"), contents, "utf8");
  }

  const directoryUri = joinPath(getDocumentDirectory(), DICTIONARIES_DIRECTORY);
  await ensureDirectory(directoryUri);

  const fileUri = joinPath(directoryUri, safeFileName);
  await FileSystem.writeAsStringAsync(fileUri, contents, { encoding: FileSystem.EncodingType.UTF8 });
  return fileUri;
}

export async function writeDictionarySourceFiles(directoryName: string, files: Array<{ fileName: string; contents: string }>) {
  if (Platform.OS === "android") {
    const documentsUri = await getAndroidDocumentsDirectoryUri();
    const exportDirectoryUri = await ensureSafDirectory(documentsUri, sanitizeFileNamePart(directoryName));

    const fileUris: string[] = [];
    for (const file of files) {
      const safeFileName = sanitizeFileNamePart(file.fileName);
      const fileUri = await replaceSafFile(exportDirectoryUri, safeFileName, getMimeType("ts"), file.contents, "utf8");
      fileUris.push(fileUri);
    }

    return fileUris;
  }

  const rootDirectoryUri = joinPath(getDocumentDirectory(), DICTIONARIES_DIRECTORY);
  const exportDirectoryUri = joinPath(rootDirectoryUri, sanitizeFileNamePart(directoryName));
  await ensureDirectory(exportDirectoryUri);

  const fileUris: string[] = [];
  for (const file of files) {
    const fileUri = joinPath(exportDirectoryUri, sanitizeFileNamePart(file.fileName));
    await FileSystem.writeAsStringAsync(fileUri, file.contents, { encoding: FileSystem.EncodingType.UTF8 });
    fileUris.push(fileUri);
  }

  return fileUris;
}

export async function moveFileIntoReportsDirectory(sourcePath: string, fileNameBase: string, extension: string) {
  const safeFileName = `${sanitizeFileNamePart(fileNameBase)}.${extension}`;

  if (Platform.OS === "android") {
    const reportsUri = await getAndroidReportsDirectoryUri();
    const base64Contents = await FileSystem.readAsStringAsync(sourcePath, { encoding: FileSystem.EncodingType.Base64 });
    const targetUri = await replaceSafFile(reportsUri, safeFileName, getMimeType(extension), base64Contents, "base64");
    await FileSystem.deleteAsync(sourcePath, { idempotent: true });
    return targetUri;
  }

  const directoryUri = joinPath(getDocumentDirectory(), REPORTS_DIRECTORY);
  await ensureDirectory(directoryUri);

  const targetUri = joinPath(directoryUri, safeFileName);
  const existing = await FileSystem.getInfoAsync(targetUri);
  if (existing.exists) {
    await FileSystem.deleteAsync(targetUri, { idempotent: true });
  }

  await FileSystem.copyAsync({ from: sourcePath, to: targetUri });
  await FileSystem.deleteAsync(sourcePath, { idempotent: true });
  return targetUri;
}

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { moveFileIntoReportsDirectory, writeDictionaryJsonFile, writeDictionarySourceFiles, writeTextReportFile } from "@/src/utils/file";

export const WEB_PRINT_SENTINEL = "browser-print";

async function printPdfOnWeb(html: string): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Печать PDF на web недоступна в текущем окружении.");
  }

  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1024,height=768");
  if (!printWindow) {
    throw new Error("Браузер заблокировал окно печати PDF. Разрешите всплывающие окна и повторите.");
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  await new Promise((resolve) => window.setTimeout(resolve, 250));
  printWindow.focus();
  printWindow.print();
  window.setTimeout(() => printWindow.close(), 250);

  return WEB_PRINT_SENTINEL;
}

export const exportService = {
  async exportTxt(fileNameBase: string, text: string): Promise<string> {
    return writeTextReportFile(fileNameBase, text);
  },
  async exportPdf(fileNameBase: string, html: string): Promise<string> {
    if (Platform.OS === "web") {
      return printPdfOnWeb(html);
    }

    const result = await Print.printToFileAsync({ html });
    return moveFileIntoReportsDirectory(result.uri, fileNameBase, "pdf");
  },
  async exportJson(fileNameBase: string, contents: string): Promise<string> {
    return writeDictionaryJsonFile(fileNameBase, contents);
  },
  async exportDictionarySources(
    directoryName: string,
    files: Array<{ fileName: string; contents: string }>,
  ): Promise<string[]> {
    return writeDictionarySourceFiles(directoryName, files);
  },
  async shareFile(path: string): Promise<void> {
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      throw new Error("Системный share sheet недоступен на этом устройстве.");
    }

    await Sharing.shareAsync(path);
  },
};

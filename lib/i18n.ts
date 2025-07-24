"use client"

import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

const resources = {
  en: {
    translation: {
      "nav.dashboard": "Dashboard",
      "nav.uploads": "Uploads",
      "nav.downloads": "Downloads",
      "nav.chat": "Chat",
      "nav.admin": "Admin",
      "upload.title": "Upload Files",
      "upload.dragDrop": "Drag and drop files here or click to browse",
      "upload.folderName": "Folder Name",
      "upload.submit": "Upload",
      "downloads.title": "Downloads",
      "downloads.approved": "Approved Files",
      "chat.title": "Chat",
      "chat.selectDealer": "Select a dealer to chat with",
      "admin.dealers": "Manage Dealers",
      "admin.files": "Manage Files",
      "status.pending": "Pending",
      "status.approved": "Approved",
      "status.rejected": "Rejected",
    },
  },
  nl: {
    translation: {
      "nav.dashboard": "Dashboard",
      "nav.uploads": "Uploads",
      "nav.downloads": "Downloads",
      "nav.chat": "Chat",
      "nav.admin": "Beheer",
      "upload.title": "Bestanden Uploaden",
      "upload.dragDrop": "Sleep bestanden hierheen of klik om te bladeren",
      "upload.folderName": "Mapnaam",
      "upload.submit": "Uploaden",
      "downloads.title": "Downloads",
      "downloads.approved": "Goedgekeurde Bestanden",
      "chat.title": "Chat",
      "chat.selectDealer": "Selecteer een dealer om mee te chatten",
      "admin.dealers": "Dealers Beheren",
      "admin.files": "Bestanden Beheren",
      "status.pending": "In behandeling",
      "status.approved": "Goedgekeurd",
      "status.rejected": "Afgewezen",
    },
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "nl",
    lng: "nl",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  })

export default i18n

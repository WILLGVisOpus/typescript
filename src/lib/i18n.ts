export interface Lang {
  name: string;
  code: string;
}

// VisOpus locale set — matches the Frontend (test.visopus.com).
// Adding new locales? Also drop a `locales/<code>.json` and update Backend i18n provisioning.
export const LANGS: Lang[] = [
  {
    name: "English",
    code: "en",
  },
  {
    name: "Norsk bokmål",
    code: "nb",
  },
  {
    name: "Deutsch",
    code: "de",
  },
  {
    name: "Nederlands",
    code: "nl",
  },
  {
    name: "Dansk",
    code: "da",
  },
];

export const LANGUAGE_COOKIE_NAME = "NEXT_LOCALE";
export const LANGUAGE_HEADER_NAME = "accept-language";

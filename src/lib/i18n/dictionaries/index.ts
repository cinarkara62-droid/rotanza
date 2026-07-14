import { Locale } from "@/lib/i18n/config";
import { en } from "./en";
import { tr } from "./tr";
import { de } from "./de";
import { fr } from "./fr";
import { es } from "./es";
import { ar } from "./ar";

export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, tr, de, fr, es, ar };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

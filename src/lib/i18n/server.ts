import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { getMessages, makeT } from "./translate";

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

/** Server components:  const t = await getT();  t("login.title") */
export async function getT() {
  const locale = await getLocale();
  return makeT(getMessages(locale));
}

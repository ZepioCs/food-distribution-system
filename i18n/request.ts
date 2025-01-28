import { getRequestConfig } from 'next-intl/server';
import { i18n } from '../i18n.config';

export default getRequestConfig(async () => {
  return {
    messages: (await import(`../messages/${i18n.defaultLocale}.json`)).default,
    timeZone: 'Europe/Berlin',
    now: new Date(),
    locale: i18n.defaultLocale
  };
}); 
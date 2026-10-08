/** Links from the panel to the public website. */
export const SITE_URL = (process.env.REACT_APP_SITE_URL || 'https://sooq-com.com').replace(/\/$/, '');

/** The public page of an ad. */
export const adUrl = (id) => `${SITE_URL}/${encodeURIComponent('اعلان')}/${id}`;

export const isOrganic = (source) => source === 'ORGANIC_USER';

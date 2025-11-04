export const DEFAULT_AD_SELECTORS: string[] = [
  'div[id*="div-gpt-ad-"]',
  '[data-google-query-id]',
  '[class*="adnm-"]'
];

export const DATASET_ID_CANDIDATES: string[] = [
  'googleAdId',
  'googleQueryId',
  'adId',
  'adid',
  'adUnit',
  'adunit',
  'adSlot',
  'slotId',
  'pbAdId',
  'pbSlot',
  'pbid',
  'placementId',
  'adnmFid'
];

export const ATTRIBUTE_ID_CANDIDATES: string[] = [
  'id',
  'data-google-query-id',
  'data-adslot',
  'data-adunit',
  'data-slot',
  'data-adid',
  'data-ad-name',
  'data-adnm-fid',
  'data-pb-slot',
  'data-bidder',
  'data-prebid'
];

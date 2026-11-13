/*
  What arrives with the BMW order: the configured car. In production this
  would come from the order page; here it is a fixed example.
  Codes only. What the customer reads comes from the copy files.
*/

export const order = {
  reference: 'FR-2026-118420',
  model_code: 'i4',
  variant: 'edrive40',
  paint: 'brooklyn_grey',
  wheels: 'aero_19',
  list_price: 5959000,          // minor units, 59 590,00 €
  delivery_date: '2027-06-04',
};

/* The test driver from the API document, used by ?demo=1. */
export const demoDriver = {
  birth_date: '1994-03-18',
  licence_since: '2013-07-02',
  claims_3y: 0,
  annual_km: 15000,           // the API document uses 12000; 15000 matches one of the screen's choices
  postcode: '75011',
  parking: 'street',
  charging: 'home',
};

export const demoHolder = {
  first_name: 'Camille',
  last_name: 'Fontaine',
  email: 'camille.fontaine@example.fr',
  phone: '+33600000000',
};

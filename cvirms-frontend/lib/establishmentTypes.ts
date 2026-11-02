export type EstablishmentType =
  | 'lodge'
  | 'pg'
  | 'hotel'
  | 'organization'
  | 'properties'
  | 'jewellery'
  | 'petrol_bunk'
  | 'scrap_dealer'
  | 'vehicle_dealer'
  | 'home_stay'
  | 'resort'
  | 'housing_society';

export interface ModuleVisibility {
  customer: boolean;
  employee: boolean;
  foreigner: boolean;
  customerSubTypes?: string[]; // for jewellery: ['seller','pledger'], vehicle_dealer: ['buyer','seller']
}

export const ESTABLISHMENT_TYPES: Record<EstablishmentType, ModuleVisibility> = {
  lodge:           { customer: true,  employee: true,  foreigner: true },
  pg:              { customer: true,  employee: true,  foreigner: false },
  hotel:           { customer: false, employee: true,  foreigner: false },
  organization:    { customer: false, employee: true,  foreigner: false },
  properties:      { customer: true,  employee: true,  foreigner: false },
  jewellery:       { customer: true,  employee: true,  foreigner: false, customerSubTypes: ['seller', 'pledger'] },
  petrol_bunk:     { customer: false, employee: true,  foreigner: false },
  scrap_dealer:    { customer: true,  employee: true,  foreigner: false },
  vehicle_dealer:  { customer: true,  employee: true,  foreigner: false, customerSubTypes: ['buyer', 'seller'] },
  home_stay:       { customer: true,  employee: true,  foreigner: true },
  resort:          { customer: true,  employee: true,  foreigner: true },
  housing_society: { customer: true,  employee: false, foreigner: false },
};

export const ESTABLISHMENT_LABELS: Record<EstablishmentType, string> = {
  lodge: 'Lodge',
  pg: 'PG',
  hotel: 'Hotel',
  organization: 'Organization',
  properties: 'Properties',
  jewellery: 'Jewellery',
  petrol_bunk: 'Petrol Bunk',
  scrap_dealer: 'Scrap Dealer',
  vehicle_dealer: 'Vehicle Dealer',
  home_stay: 'Home Stay',
  resort: 'Resort',
  housing_society: 'Housing Society',
};

// Helper to get visibility from a member_type string (fallback to lodge if unknown)
export function getModuleVisibility(memberType: string | undefined): ModuleVisibility {
  if (!memberType) return ESTABLISHMENT_TYPES.lodge;
  const key = memberType.toLowerCase().trim().replace(/[\s-]+/g, '_') as EstablishmentType;
  return ESTABLISHMENT_TYPES[key] || ESTABLISHMENT_TYPES.lodge;
}

// Helper to get human-readable label
export function getEstablishmentLabel(memberType: string | undefined): string {
  if (!memberType) return 'Lodge';
  const key = memberType.toLowerCase().trim().replace(/[\s-]+/g, '_') as EstablishmentType;
  return ESTABLISHMENT_LABELS[key] || 'Establishment';
}

export interface CustomerSubTypeConfig {
  value: string;
  label: string;
  extraFields: string[]; // field names to show
}

export const CUSTOMER_SUB_TYPES: Record<string, CustomerSubTypeConfig[]> = {
  jewellery: [
    {
      value: 'seller',
      label: 'Seller (Selling Jewellery)',
      extraFields: ['item_description', 'item_weight', 'item_purity', 'item_amount', 'remark'],
    },
    {
      value: 'pledger',
      label: 'Pledger (Pledging for Loan)',
      extraFields: ['item_description', 'item_weight', 'item_purity', 'loan_amount', 'pledge_duration_days', 'remark'],
    },
  ],
  vehicle_dealer: [
    {
      value: 'buyer',
      label: 'Buyer (Buying Vehicle)',
      extraFields: ['vehicle_type', 'vehicle_registration', 'vehicle_make_model', 'item_amount', 'remark'],
    },
    {
      value: 'seller',
      label: 'Seller (Selling Vehicle)',
      extraFields: ['vehicle_type', 'vehicle_registration', 'vehicle_make_model', 'item_amount', 'remark'],
    },
  ],
};

// Helper to get sub-types for a member_type
export function getCustomerSubTypes(memberType: string | undefined): CustomerSubTypeConfig[] {
  if (!memberType) return [];
  const key = memberType.toLowerCase().trim().replace(/[\s-]+/g, '_');
  return CUSTOMER_SUB_TYPES[key] || [];
}

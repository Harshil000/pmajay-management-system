// Indian States and Union Territories data with codes and approximate populations (2024)
export interface IndianStateData {
  name: string;
  code: string;
  population: number; // in lakhs (100,000s)
  type: 'state' | 'ut'; // state or union territory
}

export const INDIAN_STATES_DATA: IndianStateData[] = [
  // States
  { name: 'Andhra Pradesh', code: 'AP', population: 494, type: 'state' },
  { name: 'Arunachal Pradesh', code: 'AR', population: 14, type: 'state' },
  { name: 'Assam', code: 'AS', population: 312, type: 'state' },
  { name: 'Bihar', code: 'BR', population: 1240, type: 'state' },
  { name: 'Chhattisgarh', code: 'CG', population: 295, type: 'state' },
  { name: 'Goa', code: 'GA', population: 15, type: 'state' },
  { name: 'Gujarat', code: 'GJ', population: 704, type: 'state' },
  { name: 'Haryana', code: 'HR', population: 280, type: 'state' },
  { name: 'Himachal Pradesh', code: 'HP', population: 72, type: 'state' },
  { name: 'Jharkhand', code: 'JH', population: 380, type: 'state' },
  { name: 'Karnataka', code: 'KA', population: 679, type: 'state' },
  { name: 'Kerala', code: 'KL', population: 349, type: 'state' },
  { name: 'Madhya Pradesh', code: 'MP', population: 853, type: 'state' },
  { name: 'Maharashtra', code: 'MH', population: 1237, type: 'state' },
  { name: 'Manipur', code: 'MN', population: 32, type: 'state' },
  { name: 'Meghalaya', code: 'ML', population: 33, type: 'state' },
  { name: 'Mizoram', code: 'MZ', population: 12, type: 'state' },
  { name: 'Nagaland', code: 'NL', population: 22, type: 'state' },
  { name: 'Odisha', code: 'OR', population: 467, type: 'state' },
  { name: 'Punjab', code: 'PB', population: 305, type: 'state' },
  { name: 'Rajasthan', code: 'RJ', population: 799, type: 'state' },
  { name: 'Sikkim', code: 'SK', population: 7, type: 'state' },
  { name: 'Tamil Nadu', code: 'TN', population: 765, type: 'state' },
  { name: 'Telangana', code: 'TS', population: 395, type: 'state' },
  { name: 'Tripura', code: 'TR', population: 41, type: 'state' },
  { name: 'Uttar Pradesh', code: 'UP', population: 2419, type: 'state' },
  { name: 'Uttarakhand', code: 'UK', population: 114, type: 'state' },
  { name: 'West Bengal', code: 'WB', population: 1028, type: 'state' },
  
  // Union Territories
  { name: 'Andaman and Nicobar Islands', code: 'AN', population: 4, type: 'ut' },
  { name: 'Chandigarh', code: 'CH', population: 12, type: 'ut' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', code: 'DH', population: 6, type: 'ut' },
  { name: 'Delhi', code: 'DL', population: 330, type: 'ut' },
  { name: 'Jammu and Kashmir', code: 'JK', population: 141, type: 'ut' },
  { name: 'Ladakh', code: 'LA', population: 3, type: 'ut' },
  { name: 'Lakshadweep', code: 'LD', population: 1, type: 'ut' },
  { name: 'Puducherry', code: 'PY', population: 15, type: 'ut' },
];

export const getStateByName = (name: string): IndianStateData | undefined => {
  return INDIAN_STATES_DATA.find(state => 
    state.name.toLowerCase() === name.toLowerCase()
  );
};

export const getStateByCode = (code: string): IndianStateData | undefined => {
  return INDIAN_STATES_DATA.find(state => 
    state.code.toLowerCase() === code.toLowerCase()
  );
};

export const formatPopulation = (populationInLakhs: number): string => {
  if (populationInLakhs < 1) {
    return `${(populationInLakhs * 100000).toLocaleString()}`;
  } else if (populationInLakhs < 100) {
    return `${populationInLakhs.toFixed(1)} Lakh`;
  } else {
    return `${(populationInLakhs / 100).toFixed(2)} Crore`;
  }
};
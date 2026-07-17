export type EligibilityCategory =
  | 'low-income'
  | 'disability'
  | 'elderly-alone'
  | 'long-term-care'
  | 'urgent-care';

export type DocumentReference = {
  id: string;
  type: string;
  name: string;
  source: string;
  status: 'pending' | 'ready';
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
};

export type EligibilityFormState = {
  caseName: string;
  nationalId: string;
  birthDate: string;
  phone: string;
  category: EligibilityCategory;
  householdNote: string;
  careNeedNote: string;
  documents: DocumentReference[];
};

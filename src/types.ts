export interface GlobalJobData {
  jobName: string;
  jobNum: string;
  clientPhone: string;
  jobAddress: string;
  contractor: string;
  expectedPhase: number;
  salesperson: string;
  jobType: string;
  contractorContactName: string;
  contractorContactPhone: string;
}

export interface RoomFormDetails {
  id: string;
  title: string;
  product: string;
  color: string;
  thickness: string;
  edgeProfile: string;
  sinkModel: string;
  sinkType: string;
  sinkSuppliedBy: string;
  faucetHoles: string;
  faucetModel: string;
  faucetNotes: string;
  backsplashHeight: string;
  splashInfo: string;
  sideSplash: string;
  rangeType: string;
  cabinets: string;
  tearout: string;
}

export interface PhaseData {
  phaseId: string;
  forms: RoomFormDetails[];
  templater: string;
  templateDate: string;
}

export interface ParsedMorawareData {
  global: GlobalJobData;
  phases: Record<string, PhaseData>;
  rawHtml?: string;
  fileName?: string;
  parseDate?: string;
}

export interface PdfSheetDetail {
  pageNumber: number;
  statedSheetNumber?: number;
  statedTotalSheets?: number;
  sheetTitle?: string;
  roomName?: string;
  sinkModel?: string;
  sinkType?: string;
  sinkSuppliedBy?: string;
  faucetHoles?: string;
  backsplash?: string;
  edgeProfile?: string;
  material?: string;
  tearout?: string;
  cabinets?: string;
  range?: string;
  downdraft?: string;
  pageText: string;
}

export interface ParsedPdfData {
  actualPages: number;
  statedPages: number;
  jobNum: string;
  jobName: string;
  phone: string;
  contractor: string;
  contactName?: string;
  contactPhone?: string;
  sinkModel: string;
  sinkType?: string;
  sinkSuppliedBy?: string;
  faucetHoles: string;
  backsplash: string;
  edgeProfile?: string;
  material?: string;
  tearout?: string;
  cabinets?: string;
  rangeType?: string;
  templaterDrawn?: string;
  rooms?: string[];
  sheets?: PdfSheetDetail[];
  rawText?: string;
  fileName?: string;
}

export interface QACheckItem {
  id: string;
  label: string;
  category: 'header' | 'specs' | 'sheet';
  htmlVal: string;
  pdfVal: string;
  isMatch: boolean;
  notes?: string;
  isPhase?: boolean;
}

export interface DrafterSettings {
  drafterInitials: string;
  soundEnabled: boolean;
  autoUppercase: boolean;
  compactCards: boolean;
  dateFormat: 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD/MM/YYYY';
}

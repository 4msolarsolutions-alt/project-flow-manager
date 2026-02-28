// ========== String Configuration & Electrical Calculations ==========

// ========== Inverter Database ==========
export interface InverterModel {
  id: string;
  brand: string;
  model: string;
  ratedPowerKW: number;
  mpptCount: number;
  stringsPerMPPT: number;
  mpptVoltageMin: number; // V
  mpptVoltageMax: number; // V
  maxInputVoltage: number; // Vdc
  maxInputCurrent: number; // A per MPPT
  maxShortCircuitCurrent: number; // A per MPPT
  outputVoltage: number; // V AC
  efficiency: number; // %
  type: "string" | "micro" | "central";
}

export const INVERTER_DATABASE: InverterModel[] = [
  // Growatt
  { id: "growatt-3kw", brand: "Growatt", model: "MIN 3000TL-X", ratedPowerKW: 3, mpptCount: 1, stringsPerMPPT: 1, mpptVoltageMin: 80, mpptVoltageMax: 500, maxInputVoltage: 550, maxInputCurrent: 13, maxShortCircuitCurrent: 16.3, outputVoltage: 230, efficiency: 97.5, type: "string" },
  { id: "growatt-5kw", brand: "Growatt", model: "MIN 5000TL-X", ratedPowerKW: 5, mpptCount: 2, stringsPerMPPT: 1, mpptVoltageMin: 80, mpptVoltageMax: 550, maxInputVoltage: 550, maxInputCurrent: 13, maxShortCircuitCurrent: 16.3, outputVoltage: 230, efficiency: 97.6, type: "string" },
  { id: "growatt-8kw", brand: "Growatt", model: "MOD 8000TL3-X", ratedPowerKW: 8, mpptCount: 2, stringsPerMPPT: 2, mpptVoltageMin: 200, mpptVoltageMax: 850, maxInputVoltage: 1000, maxInputCurrent: 14, maxShortCircuitCurrent: 18, outputVoltage: 400, efficiency: 98.1, type: "string" },
  { id: "growatt-10kw", brand: "Growatt", model: "MOD 10KTL3-X", ratedPowerKW: 10, mpptCount: 2, stringsPerMPPT: 2, mpptVoltageMin: 200, mpptVoltageMax: 850, maxInputVoltage: 1000, maxInputCurrent: 14, maxShortCircuitCurrent: 18, outputVoltage: 400, efficiency: 98.2, type: "string" },
  { id: "growatt-15kw", brand: "Growatt", model: "MOD 15KTL3-X", ratedPowerKW: 15, mpptCount: 2, stringsPerMPPT: 2, mpptVoltageMin: 200, mpptVoltageMax: 850, maxInputVoltage: 1000, maxInputCurrent: 22, maxShortCircuitCurrent: 28, outputVoltage: 400, efficiency: 98.4, type: "string" },
  { id: "growatt-25kw", brand: "Growatt", model: "MID 25KTL3-X", ratedPowerKW: 25, mpptCount: 3, stringsPerMPPT: 2, mpptVoltageMin: 200, mpptVoltageMax: 1000, maxInputVoltage: 1100, maxInputCurrent: 18, maxShortCircuitCurrent: 23, outputVoltage: 400, efficiency: 98.5, type: "string" },
  { id: "growatt-50kw", brand: "Growatt", model: "MAX 50KTL3 LV", ratedPowerKW: 50, mpptCount: 5, stringsPerMPPT: 2, mpptVoltageMin: 200, mpptVoltageMax: 1000, maxInputVoltage: 1100, maxInputCurrent: 18, maxShortCircuitCurrent: 23, outputVoltage: 400, efficiency: 98.7, type: "string" },
  // Sungrow
  { id: "sungrow-5kw", brand: "Sungrow", model: "SG5.0RS", ratedPowerKW: 5, mpptCount: 2, stringsPerMPPT: 1, mpptVoltageMin: 80, mpptVoltageMax: 560, maxInputVoltage: 600, maxInputCurrent: 12.5, maxShortCircuitCurrent: 15, outputVoltage: 230, efficiency: 97.7, type: "string" },
  { id: "sungrow-10kw", brand: "Sungrow", model: "SG10RT", ratedPowerKW: 10, mpptCount: 2, stringsPerMPPT: 2, mpptVoltageMin: 180, mpptVoltageMax: 850, maxInputVoltage: 1000, maxInputCurrent: 15, maxShortCircuitCurrent: 20, outputVoltage: 400, efficiency: 98.3, type: "string" },
  { id: "sungrow-20kw", brand: "Sungrow", model: "SG20RT", ratedPowerKW: 20, mpptCount: 2, stringsPerMPPT: 3, mpptVoltageMin: 180, mpptVoltageMax: 850, maxInputVoltage: 1000, maxInputCurrent: 22, maxShortCircuitCurrent: 30, outputVoltage: 400, efficiency: 98.5, type: "string" },
  { id: "sungrow-50kw", brand: "Sungrow", model: "SG50CX-P2", ratedPowerKW: 50, mpptCount: 5, stringsPerMPPT: 2, mpptVoltageMin: 200, mpptVoltageMax: 1000, maxInputVoltage: 1100, maxInputCurrent: 15, maxShortCircuitCurrent: 20, outputVoltage: 400, efficiency: 98.7, type: "string" },
  // Huawei
  { id: "huawei-5kw", brand: "Huawei", model: "SUN2000-5KTL-L1", ratedPowerKW: 5, mpptCount: 2, stringsPerMPPT: 2, mpptVoltageMin: 90, mpptVoltageMax: 560, maxInputVoltage: 600, maxInputCurrent: 11, maxShortCircuitCurrent: 15, outputVoltage: 230, efficiency: 98.0, type: "string" },
  { id: "huawei-10kw", brand: "Huawei", model: "SUN2000-10KTL-M1", ratedPowerKW: 10, mpptCount: 2, stringsPerMPPT: 2, mpptVoltageMin: 200, mpptVoltageMax: 850, maxInputVoltage: 1080, maxInputCurrent: 13.5, maxShortCircuitCurrent: 18, outputVoltage: 400, efficiency: 98.4, type: "string" },
  { id: "huawei-20kw", brand: "Huawei", model: "SUN2000-20KTL-M2", ratedPowerKW: 20, mpptCount: 2, stringsPerMPPT: 3, mpptVoltageMin: 200, mpptVoltageMax: 850, maxInputVoltage: 1080, maxInputCurrent: 22, maxShortCircuitCurrent: 30, outputVoltage: 400, efficiency: 98.6, type: "string" },
  // ABB / FIMER
  { id: "abb-5kw", brand: "ABB/FIMER", model: "UNO-DM-5.0-TL", ratedPowerKW: 5, mpptCount: 2, stringsPerMPPT: 1, mpptVoltageMin: 90, mpptVoltageMax: 530, maxInputVoltage: 580, maxInputCurrent: 12, maxShortCircuitCurrent: 15, outputVoltage: 230, efficiency: 97.3, type: "string" },
  { id: "abb-10kw", brand: "ABB/FIMER", model: "PVS-10-TL", ratedPowerKW: 10, mpptCount: 2, stringsPerMPPT: 2, mpptVoltageMin: 200, mpptVoltageMax: 800, maxInputVoltage: 950, maxInputCurrent: 14, maxShortCircuitCurrent: 18, outputVoltage: 400, efficiency: 98.0, type: "string" },
];

// ========== Panel Electrical Properties ==========
export interface PanelElectricalData {
  voc: number;     // Open circuit voltage (V)
  vmp: number;     // Max power point voltage (V)
  isc: number;     // Short circuit current (A)
  imp: number;     // Max power point current (A)
  tempCoeffVoc: number;  // %/°C (negative)
  tempCoeffIsc: number;  // %/°C (positive)
  tempCoeffPmax: number; // %/°C (negative)
}

// Approximate electrical properties based on panel wattage
export function estimatePanelElectricals(wattage: number): PanelElectricalData {
  // Modern N-type panels: ~40-55V Voc depending on wattage
  if (wattage >= 600) {
    return { voc: 51.5, vmp: 43.5, isc: 15.6, imp: 14.8, tempCoeffVoc: -0.25, tempCoeffIsc: 0.048, tempCoeffPmax: -0.30 };
  } else if (wattage >= 540) {
    return { voc: 49.8, vmp: 41.2, isc: 14.0, imp: 13.3, tempCoeffVoc: -0.27, tempCoeffIsc: 0.050, tempCoeffPmax: -0.34 };
  } else if (wattage >= 450) {
    return { voc: 49.0, vmp: 40.8, isc: 11.7, imp: 11.1, tempCoeffVoc: -0.28, tempCoeffIsc: 0.050, tempCoeffPmax: -0.35 };
  } else if (wattage >= 400) {
    return { voc: 44.5, vmp: 37.2, isc: 11.5, imp: 10.8, tempCoeffVoc: -0.29, tempCoeffIsc: 0.050, tempCoeffPmax: -0.37 };
  } else {
    return { voc: 40.2, vmp: 33.5, isc: 10.7, imp: 10.0, tempCoeffVoc: -0.30, tempCoeffIsc: 0.048, tempCoeffPmax: -0.38 };
  }
}

// ========== Temperature Correction ==========
export interface TempCorrectionResult {
  vocCorrected: number;
  vmpCorrected: number;
  iscCorrected: number;
  impCorrected: number;
}

export function applyTempCorrection(
  panel: PanelElectricalData,
  ambientTempMin: number, // °C (coldest for Voc max)
  ambientTempMax: number, // °C (hottest for Vmp min)
  cellTempRise: number = 25, // Cell temp above ambient under NOCT
): { cold: TempCorrectionResult; hot: TempCorrectionResult } {
  const stc = 25; // STC temperature
  const tCellCold = ambientTempMin; // Minimum (no irradiance for max Voc)
  const tCellHot = ambientTempMax + cellTempRise;

  const deltaT_cold = tCellCold - stc;
  const deltaT_hot = tCellHot - stc;

  return {
    cold: {
      vocCorrected: panel.voc * (1 + (panel.tempCoeffVoc / 100) * deltaT_cold),
      vmpCorrected: panel.vmp * (1 + (panel.tempCoeffVoc / 100) * deltaT_cold),
      iscCorrected: panel.isc * (1 + (panel.tempCoeffIsc / 100) * deltaT_cold),
      impCorrected: panel.imp * (1 + (panel.tempCoeffIsc / 100) * deltaT_cold),
    },
    hot: {
      vocCorrected: panel.voc * (1 + (panel.tempCoeffVoc / 100) * deltaT_hot),
      vmpCorrected: panel.vmp * (1 + (panel.tempCoeffVoc / 100) * deltaT_hot),
      iscCorrected: panel.isc * (1 + (panel.tempCoeffIsc / 100) * deltaT_hot),
      impCorrected: panel.imp * (1 + (panel.tempCoeffIsc / 100) * deltaT_hot),
    },
  };
}

// ========== String Configuration Calculator ==========
export interface StringConfig {
  maxPanelsPerString: number;
  minPanelsPerString: number;
  recommendedPanelsPerString: number;
  totalStrings: number;
  stringsPerMPPT: number;
  unusedPanels: number;
  // Voltage analysis
  stringVocMax: number;    // Cold condition
  stringVmpMin: number;    // Hot condition
  stringVmpNominal: number;
  stringIsc: number;
  // Safety margins
  voltageMarginHigh: number; // % below max input voltage
  voltageMarginMPPT: number; // % above MPPT min
  currentMargin: number;     // % below max input current
  // Warnings
  warnings: string[];
  isValid: boolean;
}

export function calculateStringConfig(
  totalPanels: number,
  panelWattage: number,
  inverter: InverterModel,
  panelElec: PanelElectricalData,
  ambientTempMin: number = 0,
  ambientTempMax: number = 45,
): StringConfig {
  const tempCorr = applyTempCorrection(panelElec, ambientTempMin, ambientTempMax);
  const warnings: string[] = [];

  // Max panels per string: Voc_cold * N <= maxInputVoltage
  const vocCold = tempCorr.cold.vocCorrected;
  const maxPanelsPerString = Math.floor(inverter.maxInputVoltage / vocCold);

  // Min panels per string: Vmp_hot * N >= mpptVoltageMin
  const vmpHot = tempCorr.hot.vmpCorrected;
  const minPanelsPerString = Math.ceil(inverter.mpptVoltageMin / vmpHot);

  // Recommended: Vmp_nominal within MPPT window, maximizing string length
  const vmpNominal = panelElec.vmp;
  const recommendedMax = Math.floor(inverter.mpptVoltageMax / vmpNominal);
  const recommendedPanelsPerString = Math.min(maxPanelsPerString, Math.max(minPanelsPerString, recommendedMax));

  // Calculate string count & distribution
  const totalStringsAvailable = inverter.mpptCount * inverter.stringsPerMPPT;
  const totalStrings = Math.min(
    totalStringsAvailable,
    Math.ceil(totalPanels / recommendedPanelsPerString)
  );
  const stringsPerMPPT = Math.ceil(totalStrings / inverter.mpptCount);

  const panelsUsed = totalStrings * recommendedPanelsPerString;
  const unusedPanels = totalPanels - panelsUsed;

  // Voltage/current at string level
  const stringVocMax = vocCold * recommendedPanelsPerString;
  const stringVmpMin = vmpHot * recommendedPanelsPerString;
  const stringVmpNominal = vmpNominal * recommendedPanelsPerString;
  const stringIsc = tempCorr.cold.iscCorrected;

  // Safety margins
  const voltageMarginHigh = ((inverter.maxInputVoltage - stringVocMax) / inverter.maxInputVoltage) * 100;
  const voltageMarginMPPT = ((stringVmpMin - inverter.mpptVoltageMin) / inverter.mpptVoltageMin) * 100;
  const currentMargin = ((inverter.maxShortCircuitCurrent - stringIsc) / inverter.maxShortCircuitCurrent) * 100;

  // Validation
  let isValid = true;

  if (stringVocMax > inverter.maxInputVoltage) {
    warnings.push(`⚠️ String Voc (${stringVocMax.toFixed(1)}V) exceeds max input voltage (${inverter.maxInputVoltage}V)!`);
    isValid = false;
  }
  if (stringVmpMin < inverter.mpptVoltageMin) {
    warnings.push(`⚠️ String Vmp at high temp (${stringVmpMin.toFixed(1)}V) below MPPT min (${inverter.mpptVoltageMin}V)!`);
    isValid = false;
  }
  if (stringVmpNominal > inverter.mpptVoltageMax) {
    warnings.push(`⚠️ String Vmp (${stringVmpNominal.toFixed(1)}V) exceeds MPPT max (${inverter.mpptVoltageMax}V)!`);
    isValid = false;
  }
  if (stringIsc > inverter.maxShortCircuitCurrent) {
    warnings.push(`⚠️ String Isc (${stringIsc.toFixed(1)}A) exceeds max short circuit current (${inverter.maxShortCircuitCurrent}A)!`);
    isValid = false;
  }
  if (unusedPanels > 0) {
    warnings.push(`ℹ️ ${unusedPanels} panel(s) unassigned. Consider adjusting string size or adding inverter capacity.`);
  }
  if (totalPanels > panelsUsed + recommendedPanelsPerString) {
    warnings.push(`ℹ️ Consider adding another inverter — ${totalPanels - panelsUsed} excess panels.`);
  }
  if (voltageMarginHigh < 5) {
    warnings.push(`⚠️ Low voltage safety margin (${voltageMarginHigh.toFixed(1)}%). Consider reducing panels per string.`);
  }

  return {
    maxPanelsPerString,
    minPanelsPerString,
    recommendedPanelsPerString,
    totalStrings,
    stringsPerMPPT,
    unusedPanels,
    stringVocMax,
    stringVmpMin,
    stringVmpNominal,
    stringIsc,
    voltageMarginHigh,
    voltageMarginMPPT,
    currentMargin,
    warnings,
    isValid,
  };
}

// ========== Auto-select best inverter ==========
export function autoSelectInverter(capacityKW: number): InverterModel | null {
  // Find the smallest inverter that can handle the capacity
  const sorted = [...INVERTER_DATABASE].sort((a, b) => a.ratedPowerKW - b.ratedPowerKW);
  // Allow 20% oversize on inverter
  const match = sorted.find(inv => inv.ratedPowerKW >= capacityKW * 0.8);
  return match || sorted[sorted.length - 1];
}

// ========== Multi-inverter configuration ==========
export interface SystemStringConfig {
  inverters: {
    inverter: InverterModel;
    count: number;
    stringConfig: StringConfig;
  }[];
  totalInverterCapacity: number;
  dcAcRatio: number;
}

export function calculateSystemConfig(
  totalPanels: number,
  panelWattage: number,
  inverter: InverterModel,
  panelElec: PanelElectricalData,
  ambientTempMin: number = 0,
  ambientTempMax: number = 45,
): SystemStringConfig {
  const totalDCCapacity = (totalPanels * panelWattage) / 1000;
  const inverterCount = Math.max(1, Math.ceil(totalDCCapacity / (inverter.ratedPowerKW * 1.3)));
  const panelsPerInverter = Math.ceil(totalPanels / inverterCount);

  const stringConfig = calculateStringConfig(
    panelsPerInverter,
    panelWattage,
    inverter,
    panelElec,
    ambientTempMin,
    ambientTempMax,
  );

  const totalInverterCapacity = inverterCount * inverter.ratedPowerKW;
  const dcAcRatio = totalDCCapacity / totalInverterCapacity;

  return {
    inverters: [{ inverter, count: inverterCount, stringConfig }],
    totalInverterCapacity,
    dcAcRatio,
  };
}

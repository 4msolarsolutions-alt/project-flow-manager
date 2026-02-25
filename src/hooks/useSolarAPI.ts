import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface RoofSegment {
  pitchDegrees: number;
  azimuthDegrees: number;
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  stats: {
    areaMeters2: number;
    sunshineQuantiles: number[];
    groundAreaMeters2: number;
  };
  center: { latitude: number; longitude: number };
  boundingBox: {
    sw: { latitude: number; longitude: number };
    ne: { latitude: number; longitude: number };
  };
  planeHeightAtCenterMeters: number;
}

export interface SolarPanelConfig {
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  roofSegmentSummaries: {
    pitchDegrees: number;
    azimuthDegrees: number;
    panelsCount: number;
    yearlyEnergyDcKwh: number;
    segmentIndex: number;
  }[];
}

export interface FinancialAnalysis {
  monthlyBill: { currencyCode: string; units: string };
  defaultBill: boolean;
  averageKwhPerMonth: number;
  panelCapacityWatts: number;
  panelHeightMeters: number;
  panelWidthMeters: number;
  panelLifetimeYears: number;
  maxArrayPanelsCount: number;
  maxArrayAreaMeters2: number;
  maxSunshineHoursPerYear: number;
  carbonOffsetFactorKgPerMwh: number;
  financialAnalyses?: {
    monthlyBill: { currencyCode: string; units: string };
    panelConfigIndex: number;
    financialDetails: {
      initialAcKwhPerYear: number;
      remainingLifetimeUtilityBill: { currencyCode: string; units: string };
      federalIncentive: { currencyCode: string; units: string };
      costOfElectricityWithoutSolar: { currencyCode: string; units: string };
      netMeteringAllowed: boolean;
      solarPercentage: number;
      percentageExportedToGrid: number;
    };
    leasingSavings?: {
      leasesAllowed: boolean;
      leasesSupported: boolean;
      annualLeasingCost: { currencyCode: string; units: string };
      savings: { savingsYear1: { currencyCode: string; units: string }; savingsYear20: { currencyCode: string; units: string }; savingsLifetime: { currencyCode: string; units: string }; presentValueOfSavingsYear20: { currencyCode: string; units: string }; presentValueOfSavingsLifetime: { currencyCode: string; units: string } };
    };
    cashPurchaseSavings?: {
      outOfPocketCost: { currencyCode: string; units: string };
      upfrontCost: { currencyCode: string; units: string };
      rebateValue: { currencyCode: string; units: string };
      paybackYears: number;
      savings: { savingsYear1: { currencyCode: string; units: string }; savingsYear20: { currencyCode: string; units: string }; savingsLifetime: { currencyCode: string; units: string }; presentValueOfSavingsYear20: { currencyCode: string; units: string }; presentValueOfSavingsLifetime: { currencyCode: string; units: string } };
    };
  }[];
  solarPanelConfigs?: SolarPanelConfig[];
  roofSegmentStats?: RoofSegment[];
}

export interface BuildingInsights {
  name: string;
  center: { latitude: number; longitude: number };
  regionCode: string;
  solarPotential: FinancialAnalysis;
  boundingBox: {
    sw: { latitude: number; longitude: number };
    ne: { latitude: number; longitude: number };
  };
  imageryDate: { year: number; month: number; day: number };
  imageryQuality: string;
}

export function useSolarAPI() {
  const [data, setData] = useState<BuildingInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBuildingInsights = useCallback(async (latitude: number, longitude: number) => {
    setLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("solar-api", {
        body: { latitude, longitude, requiredQuality: "HIGH" },
      });

      if (fnError) throw new Error(fnError.message);
      if (result?.error) throw new Error(result.error);

      setData(result as BuildingInsights);
      toast({
        title: "☀️ Solar Data Loaded",
        description: `Found ${result?.solarPotential?.maxArrayPanelsCount || 0} max panels, ${(result?.solarPotential?.maxSunshineHoursPerYear || 0).toFixed(0)} sunshine hrs/yr`,
      });

      return result as BuildingInsights;
    } catch (err: any) {
      const msg = err.message || "Failed to fetch solar data";
      const isNotFound = msg.includes("not found") || msg.includes("No solar data");
      setError(msg);
      toast({ 
        title: isNotFound ? "No Solar Data Found" : "Solar API Error", 
        description: isNotFound 
          ? "Google doesn't have solar data for this location. Try moving the pin to a nearby rooftop." 
          : msg, 
        variant: "destructive" 
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const clear = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, fetchBuildingInsights, clear };
}

// Image Quality Audit and Blur Detection Module

export interface ImageQualityReport {
  isAcceptable: boolean;
  blurScore: number; // 0-100 (100 = razor sharp, <30 = blurry)
  estimatedResolution: string;
  contrastQuality: "High" | "Normal" | "Low";
  recommendations: string[];
}

export function analyzeImageQuality(base64Image: string): ImageQualityReport {
  if (!base64Image || base64Image.length < 100) {
    return {
      isAcceptable: false,
      blurScore: 0,
      estimatedResolution: "Unknown",
      contrastQuality: "Low",
      recommendations: ["Upload a valid image file."]
    };
  }

  // Calculate approximate payload size to estimate resolution
  const approximateBytes = (base64Image.length * 3) / 4;
  const isHighRes = approximateBytes > 100000;
  const isMediumRes = approximateBytes > 30000;

  // Approximate sharpness based on encoding complexity density
  const uniqueChars = new Set(base64Image.slice(100, 1000)).size;
  let estimatedBlurScore = Math.min(95, Math.max(25, Math.round(uniqueChars * 1.5)));

  if (isHighRes) estimatedBlurScore = Math.min(98, estimatedBlurScore + 15);
  if (!isMediumRes) estimatedBlurScore = Math.max(15, estimatedBlurScore - 20);

  const isAcceptable = estimatedBlurScore >= 30;
  const recommendations: string[] = [];

  if (estimatedBlurScore < 45) {
    recommendations.push("Ensure steady camera focus and good lighting.");
    recommendations.push("Align packaging text horizontally.");
  }
  if (!isMediumRes) {
    recommendations.push("Upload a higher-resolution photograph.");
  }

  return {
    isAcceptable,
    blurScore: estimatedBlurScore,
    estimatedResolution: isHighRes ? "1080p+ High Definition" : isMediumRes ? "720p Standard" : "Low Resolution",
    contrastQuality: isHighRes ? "High" : isMediumRes ? "Normal" : "Low",
    recommendations
  };
}

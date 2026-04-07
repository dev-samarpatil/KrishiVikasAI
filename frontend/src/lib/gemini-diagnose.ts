import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY!
);

export async function diagnoseCrop(
  imageFile: File,
  context: {
    district: string;
    state: string;
    crop_type: string;
    language: string;
    farm_size?: string;
    farming_type?: string;
  }
): Promise<DiagnosisResult> {

  // We enforce gemini-2.5-flash as 1.5/2.0 have quota limits exhausted!
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  });

  // Convert image file to base64
  const imageBase64 = await fileToBase64(imageFile);
  const mimeType = imageFile.type || "image/jpeg";

  const langName: Record<string, string> = {
    en: "English", hi: "Hindi",
    mr: "Marathi", ta: "Tamil"
  };
  const language = langName[context.language] || "English";

  const prompt = `You are an expert Indian plant pathologist. Analyse this crop photo carefully.

Location: ${context.district}, ${context.state}
Crop: ${context.crop_type || "unknown crop"}
Farm Size: ${context.farm_size || "Unknown"}
Farming Type: ${context.farming_type || "Unknown"}
Language for response: ${language}

IMPORTANT: Identify the SPECIFIC disease. Common ones:
- Tomato: Early Blight, Late Blight, Leaf Curl Virus, Septoria Leaf Spot, Fusarium Wilt, Bacterial Spot
- Cotton: Bollworm, Leaf Curl Virus, Aphids, Mealybug  
- Wheat: Yellow Rust, Brown Rust, Powdery Mildew, Smut
- Onion: Purple Blotch, Downy Mildew, Thrips damage
- General: Nitrogen deficiency (uniform yellowing), Spider Mite damage (tiny dots + webbing), Iron deficiency (interveinal chlorosis)

Return ONLY this JSON object, no other text:
{
  "type": "disease or deficiency or pest",
  "name": "Specific English disease name",
  "name_local": "Disease name in ${language}",
  "confidence": 0.85,
  "explanation": "2-3 simple sentences in ${language} explaining what is wrong with this crop and how the farmer can recognise it",
  "cause": "What caused this disease in ${language}",
  "treatment_steps": [
    "Step 1: specific treatment with product name in ${language}",
    "Step 2: dosage and application in ${language}",
    "Step 3: follow-up action in ${language}"
  ],
  "organic_option": {
    "description": "Specific organic treatment in ${language}",
    "steps": [
      "Step 1: organic method with quantities",
      "Step 2: frequency and timing"
    ]
  },
  "prevention": "Specific prevention for this disease in ${language}",
  "budget_items": [
    {"item": "Specific product name", "quantity": "250g", "price_inr": 90},
    {"item": "Sprayer rental", "quantity": "1 day", "price_inr": 50},
    {"item": "Labour", "quantity": "1 day", "price_inr": 200}
  ],
  "total_cost_inr": 340,
  "organic_total_cost_inr": 100,
  "urgency": "immediate",
  "low_confidence_note": null
}`;

  // Retry up to 2 times if Gemini fails
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: mimeType,
            data: imageBase64,
          },
        },
      ]);

      const text = result.response.text();
      console.log(`Gemini response (attempt ${attempt + 1}):`, text.substring(0, 500));

      // Aggressive JSON extraction
      let clean = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // Try to find JSON object if there's extra text around it
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        clean = jsonMatch[0];
      }

      const parsed = JSON.parse(clean);

      // Ensure confidence is a proper 0-1 float
      if (parsed.confidence && parsed.confidence > 1) {
        parsed.confidence = parsed.confidence / 100;
      }

      return parsed;
    } catch (err: any) {
      console.error(`Gemini diagnosis error (attempt ${attempt + 1}):`, err?.message || err);
      if (attempt === 0) {
        // Wait 1 second before retry
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      // Final attempt failed — return fallback
      return {
        type: "unclear",
        name: "Analysis Failed",
        name_local: "",
        confidence: 0,
        explanation:
          "The AI could not analyze your image. " +
          "Please try again with a clearer photo or consult your nearest KVK.",
        cause: "Error: " + (err?.message || "unknown error"),
        treatment_steps: [
          "Step 1: Try scanning again with better lighting",
          "Step 2: If issue persists, visit your nearest KVK",
          "Step 3: Take a close-up photo of the affected leaf",
        ],
        organic_option: {
          description: "Neem oil spray (general purpose)",
          steps: [
            "Mix 5ml neem oil in 1L water",
            "Spray on affected parts every 7 days",
          ],
        },
        prevention: "Avoid overhead irrigation and maintain proper plant spacing",
        budget_items: [
          { item: "Fungicide", quantity: "250g", price_inr: 120 },
          { item: "Labour", quantity: "1 day", price_inr: 200 },
        ],
        total_cost_inr: 320,
        organic_total_cost_inr: 80,
        urgency: "within_week",
        low_confidence_note:
          "AI analysis failed after 2 attempts. Please visit your nearest KVK for accurate diagnosis.",
      } as DiagnosisResult;
    }
  }

  // Unreachable, but TypeScript needs it
  throw new Error("Diagnosis loop exited unexpectedly");
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix, keep only base64 data
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export interface DiagnosisResult {
  type: string;
  name: string;
  name_local: string;
  confidence: number;
  explanation: string;
  cause: string;
  treatment_steps: string[];
  organic_option: {
    description: string;
    steps: string[];
  };
  prevention: string;
  budget_items: Array<{
    item: string;
    quantity: string;
    price_inr: number;
  }>;
  total_cost_inr: number;
  organic_total_cost_inr: number;
  urgency: string;
  low_confidence_note: string | null;
  district?: string;
  state?: string;
}

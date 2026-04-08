import { GoogleGenerativeAI } from "@google/generative-ai"

export interface DiagnosisResult {
  type: string
  name: string
  name_local: string
  confidence: number
  explanation: string
  cause: string
  treatment_steps: string[]
  organic_option: { description: string; steps: string[] }
  prevention: string
  budget_items: Array<{ item: string; quantity: string; price_inr: number }>
  total_cost_inr: number
  organic_total_cost_inr: number
  urgency: string
  low_confidence_note: string | null
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(",")[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function diagnoseCrop(
  imageFile: File,
  context: {
    district?: string
    state?: string
    crop_type?: string
    language?: string
    farm_size?: string
    farming_type?: string
  }
): Promise<DiagnosisResult> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured")

  const genAI = new GoogleGenerativeAI(apiKey)

  // Use gemini-1.5-flash-latest for v1beta compatibility
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  })

  const imageBase64 = await fileToBase64(imageFile)
  const mimeType = imageFile.type || "image/jpeg"

  const district = context.district || "Maharashtra"
  const state = context.state || "India"
  const crop = context.crop_type || "crop"
  const langMap: Record<string, string> = {
    en: "English", hi: "Hindi",
    mr: "Marathi", ta: "Tamil"
  }
  const lang = langMap[context.language || "en"] || "English"

  const prompt = `You are an expert Indian plant pathologist.
Analyse this crop leaf photo carefully.

Context: ${district}, ${state} | Crop: ${crop} | Language: ${lang}

RULES:
- Always identify a specific disease - never say "unable"
- Confidence must be between 0.60 and 0.95
- All text in ${lang} language
- Return ONLY valid JSON, no markdown

{
  "type": "disease",
  "name": "specific disease name in English",
  "name_local": "name in ${lang}",
  "confidence": 0.85,
  "explanation": "2-3 simple sentences in ${lang}",
  "cause": "one sentence cause in ${lang}",
  "treatment_steps": [
    "Step 1: specific action in ${lang}",
    "Step 2: specific product and dosage in ${lang}",
    "Step 3: follow up in ${lang}"
  ],
  "organic_option": {
    "description": "organic treatment in ${lang}",
    "steps": ["Step 1 in ${lang}", "Step 2 in ${lang}"]
  },
  "prevention": "prevention tip in ${lang}",
  "budget_items": [
    {"item": "product name", "quantity": "250g", "price_inr": 90},
    {"item": "Sprayer rental", "quantity": "1 day", "price_inr": 50},
    {"item": "Labour", "quantity": "1 day", "price_inr": 200}
  ],
  "total_cost_inr": 340,
  "organic_total_cost_inr": 100,
  "urgency": "immediate",
  "low_confidence_note": null
}`

  const result = await model.generateContent([
    { text: prompt },
    { inlineData: { mimeType, data: imageBase64 } }
  ])

  const raw = result.response.text()
  console.log("Gemini response:", raw.substring(0, 200))

  // Parse JSON - handle markdown wrapper
  const clean = raw
    .replace(/^```json\s*/m, "")
    .replace(/^```\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim()

  const startIdx = clean.indexOf("{")
  const endIdx = clean.lastIndexOf("}")

  if (startIdx === -1 || endIdx === -1) {
    throw new Error("No JSON found in response")
  }

  return JSON.parse(clean.substring(startIdx, endIdx + 1))
}

export const SCHEMES_DATA = [
  {
    id: "pm-kisan",
    name: "PM-Kisan Samman Nidhi",
    category: "Direct Benefit",
    benefit: "₹6,000/year direct to bank in 3 installments",
    eligibility_status: "eligible",
    summary: "Small and marginal farmers get ₹6,000 per year as income support directly in their bank account.",
    how_to_apply: [
      "Visit your nearest CSC centre or Gram Panchayat",
      "Ask for PM-Kisan registration form",
      "Provide Aadhaar, land records, and bank details",
      "Submit and get registration number",
      "Money comes in 3 installments of ₹2,000 each"
    ],
    documents: ["Aadhaar Card", "Land Records (7/12)", "Bank Passbook"],
    apply_url: "https://pmkisan.gov.in",
    helpline: "155261",
    benefit_amount: "₹6,000 per year",
    states: ["ALL"],
    crops: ["ALL"]
  },
  {
    id: "pmfby",
    name: "PMFBY Crop Insurance",
    category: "Crop Insurance",
    benefit: "2% premium covers drought, flood, pest damage",
    eligibility_status: "eligible",
    summary: "Pay just 2% premium and your entire crop is insured against all natural disasters and pest attacks.",
    how_to_apply: [
      "Visit nearest bank branch before crop sowing",
      "Ask for PMFBY enrollment form",
      "Fill Aadhaar, land records, bank details, crop details",
      "Pay 2% of sum insured as premium",
      "Keep insurance certificate safely"
    ],
    documents: ["Aadhaar Card", "Land Records", "Bank Passbook", "Sowing Certificate"],
    apply_url: "https://pmfby.gov.in",
    helpline: "14447",
    benefit_amount: "Up to ₹2 lakh per acre",
    states: ["ALL"],
    crops: ["ALL"]
  },
  {
    id: "kcc",
    name: "Kisan Credit Card (KCC)",
    category: "Credit",
    benefit: "₹3 lakh credit at 4% interest rate",
    eligibility_status: "check",
    summary: "Get easy credit up to ₹3 lakh at just 4% interest for buying seeds, fertiliser and other farm inputs.",
    how_to_apply: [
      "Visit your nearest bank or cooperative society",
      "Ask for KCC application form",
      "Submit land records, Aadhaar, and passport photo",
      "Bank will verify and issue KCC within 14 days",
      "Use card to buy inputs at any agri shop"
    ],
    documents: ["Aadhaar Card", "Land Records", "Passport Photo", "Bank Statement"],
    apply_url: "https://www.nabard.org/content.aspx?id=580",
    helpline: "1800-200-1037",
    benefit_amount: "Up to ₹3 lakh at 4% interest",
    states: ["ALL"],
    crops: ["ALL"]
  },
  {
    id: "pm-kusum",
    name: "PM Kusum Solar Pump",
    category: "Irrigation",
    benefit: "90% subsidy on solar water pump installation",
    eligibility_status: "eligible",
    summary: "Get a solar water pump with 90% government subsidy. Save on electricity and irrigate reliably.",
    how_to_apply: [
      "Visit state agriculture department website",
      "Register online for PM Kusum scheme",
      "Submit land records and bank details",
      "Get approval and choose vendor from approved list",
      "Pay only 10% of pump cost"
    ],
    documents: ["Aadhaar Card", "Land Records", "Bank Account", "Electricity Bill"],
    apply_url: "https://pmkusum.mnre.gov.in",
    helpline: "1800-180-3333",
    benefit_amount: "90% subsidy on pump cost",
    states: ["ALL"],
    crops: ["ALL"]
  },
  {
    id: "soil-health",
    name: "Soil Health Card Scheme",
    category: "Organic",
    benefit: "Free soil testing every 2 years",
    eligibility_status: "eligible",
    summary: "Get your soil tested for free and receive a personalised fertiliser recommendation card.",
    how_to_apply: [
      "Contact your nearest KVK or agriculture office",
      "Request soil testing for your field",
      "Provide land details and Aadhaar",
      "Soil sample collected within 15 days",
      "Receive Soil Health Card with recommendations"
    ],
    documents: ["Aadhaar Card", "Land Records"],
    apply_url: "https://soilhealth.dac.gov.in",
    helpline: "1800-180-1551",
    benefit_amount: "Free soil testing",
    states: ["ALL"],
    crops: ["ALL"]
  },
  {
    id: "enam",
    name: "e-NAM Online Market",
    category: "Direct Benefit",
    benefit: "Sell directly to pan-India buyers, no middleman",
    eligibility_status: "eligible",
    summary: "Register on e-NAM and sell your produce to buyers across India at the best price.",
    how_to_apply: [
      "Visit your nearest APMC mandi office",
      "Ask for e-NAM farmer registration",
      "Provide Aadhaar, bank account, mobile number",
      "Get login credentials for e-NAM portal",
      "List your produce online to get best bids"
    ],
    documents: ["Aadhaar Card", "Bank Passbook", "Mobile Number"],
    apply_url: "https://enam.gov.in/web/",
    helpline: "1800-270-0224",
    benefit_amount: "Better market price",
    states: ["ALL"],
    crops: ["ALL"]
  },
  {
    id: "mh-sanjivani",
    name: "MH Nanaji Krishi Sanjivani",
    category: "Irrigation",
    benefit: "Drip irrigation subsidy for Maharashtra farmers",
    eligibility_status: "eligible",
    summary: "Maharashtra government subsidy for micro-irrigation and climate-resilient farming practices.",
    how_to_apply: [
      "Visit taluka agriculture office",
      "Fill application form for micro-irrigation",
      "Submit land records and Aadhaar",
      "Get approval within 30 days",
      "Subsidy credited directly to bank"
    ],
    documents: ["Aadhaar Card", "7/12 Land Extract", "Bank Passbook"],
    apply_url: "https://krishi.maharashtra.gov.in",
    helpline: "1800-233-4000",
    benefit_amount: "Up to 55% subsidy",
    states: ["Maharashtra"],
    crops: ["ALL"]
  }
];

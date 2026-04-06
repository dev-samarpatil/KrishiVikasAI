/* VIBE CODER INSTRUCTIONS:
1. We are building a localized agriculture app for farmers in Maharashtra.
2. Require 'dotenv' to load environment variables.
3. Create an async function called `translateToMarathi(englishText)`.
4. Use the native `fetch` API to make a POST request to Sarvam AI's translation endpoint (https://api.sarvam.ai/translate).
5. Pass `process.env.SARVAM_API_KEY` in the headers as 'api-subscription-key'.
6. The payload should have source_language_code: "en-IN" and target_language_code: "mr-IN".
7. Extract and return the translated string.
8. Create a second function `generateMarathiAudio(marathiText)` using Sarvam's TTS (Text-to-Speech) API to convert the translated text into audio.
9. Export both functions using module.exports.
*/
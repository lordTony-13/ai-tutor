import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const formalExample = {
  hindi: [
    { word: "क्या", reading: "kya" },
    { word: "आप" },
    { word: "भारत", reading: "bharat" },
    { word: "में", reading: "mein" },
    { word: "रहते", reading: "rehte" },
    { word: "हैं", reading: "hain" },
    { word: "?" },
  ],
  grammarBreakdown: [
    {
      english: "Do you live in India?",
      hindi: [
        { word: "क्या", reading: "kya" },
        { word: "आप" },
        { word: "भारत", reading: "bharat" },
        { word: "में", reading: "mein" },
        { word: "रहते", reading: "rehte" },
        { word: "हैं", reading: "hain" },
        { word: "?" },
      ],
      chunks: [
        {
          hindi: [{ word: "भारत", reading: "bharat" }],
          meaning: "India",
          grammar: "Noun",
        },
        {
          hindi: [{ word: "में", reading: "mein" }],
          meaning: "in",
          grammar: "Postposition",
        },
        {
          hindi: [{ word: "रहते", reading: "rehte" }, { word: "हैं", reading: "hain" }],
          meaning: "live",
          grammar: "Verb (present habitual)",
        },
        {
          hindi: [{ word: "क्या", reading: "kya" }],
          meaning: "question marker",
          grammar: "Question word",
        },
        {
          hindi: [{ word: "?" }],
          meaning: "question",
          grammar: "Punctuation",
        },
      ],
    },
  ],
};

const casualExample = {
  hindi: [
    { word: "क्या", reading: "kya" },
    { word: "तुम" },
    { word: "भारत", reading: "bharat" },
    { word: "में", reading: "mein" },
    { word: "रहते", reading: "rehte" },
    { word: "हो", reading: "ho" },
    { word: "?" },
  ],
  grammarBreakdown: [
    {
      english: "Do you live in India?",
      hindi: [
        { word: "क्या", reading: "kya" },
        { word: "तुम" },
        { word: "भारत", reading: "bharat" },
        { word: "में", reading: "mein" },
        { word: "रहते", reading: "rehte" },
        { word: "हो", reading: "ho" },
        { word: "?" },
      ],
      chunks: [
        {
          hindi: [{ word: "भारत", reading: "bharat" }],
          meaning: "India",
          grammar: "Noun",
        },
        {
          hindi: [{ word: "में", reading: "mein" }],
          meaning: "in",
          grammar: "Postposition",
        },
        {
          hindi: [{ word: "रहते", reading: "rehte" }, { word: "हो", reading: "ho" }],
          meaning: "live",
          grammar: "Verb (present habitual)",
        },
        {
          hindi: [{ word: "क्या", reading: "kya" }],
          meaning: "question marker",
          grammar: "Question word",
        },
        {
          hindi: [{ word: "?" }],
          meaning: "question",
          grammar: "Punctuation",
        },
      ],
    },
  ],
};



export async function GET(req) {
  const speech = req.nextUrl.searchParams.get("speech") || "formal";
  const speechExample = speech === "formal" ? formalExample : casualExample;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a Hindi language teacher. 
Your student asks you how to say something from English to Hindi.
You should respond with: 
- english: the English version ex: "Do you live in India?"
- hindi: the Hindi translation split into words ex: ${JSON.stringify(
            speechExample.hindi
          )}
- grammarBreakdown: an explanation of the grammar structure per sentence ex: ${JSON.stringify(
            speechExample.grammarBreakdown
          )}
`,
        },
        {
          role: "system",
          content: `You always respond with a JSON object with the following format: 
          {
            "english": "",
            "hindi": [{
              "word": "",
              "reading": ""
            }],
            "grammarBreakdown": [{
              "english": "",
              "hindi": [{
                "word": "",
                "reading": ""
              }],
              "chunks": [{
                "hindi": [{
                  "word": "",
                  "reading": ""
                }],
                "meaning": "",
                "grammar": ""
              }]
            }]
          }`,
        },
        {
          role: "user",
          content: `How to say ${
            req.nextUrl.searchParams.get("question") ||
            "Have you ever been to India?"
          } in Hindi in ${speech} speech?`,
        },
      ],
      model: "llama3-70b-8192",
      max_tokens: 1000,
      temperature: 0.7,
      top_p: 1,
      stream: false,
    });

    console.log("Raw API response:", chatCompletion.choices[0].message.content);

    // Extract JSON from the response
    const jsonMatch = chatCompletion.choices[0].message.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in the response");
    }

    const jsonResponse = JSON.parse(jsonMatch[0]);
    console.log("Parsed JSON response:", jsonResponse);

    return Response.json(jsonResponse);
  } catch (error) {
    console.error("Error in GET request:", error);
    return Response.json({ error: "An error occurred while processing your request.", details: error.message }, { status: 500 });
  }
}

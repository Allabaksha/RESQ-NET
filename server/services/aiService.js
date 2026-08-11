/**
 * AI Service for RESQ-NET
 * Primary: Local Ollama (llama3 / mistral)
 * Fallback: Natural language heuristic parser for guaranteed hackathon / demo uptime
 */

async function analyzeIncident(description) {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
  const modelName = process.env.OLLAMA_MODEL || "llama3";

  const prompt = `Classify this disaster incident. Return ONLY valid JSON with keys:
"incidentType" (string), "severity" ("Low", "Moderate", "High", "Critical"), "estimatedVictims" (qualitative string, e.g. "5-10 people trapped", "Multiple casualties suspected", "No direct injuries reported"), "suggestedResources" (array of exact string values selected from: ["Fire & Rescue", "Ambulance", "Police", "NDRF", "SDRF", "Civil Defence", "NGO"]).

Incident description: "${description.replace(/"/g, "'")}"`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout for fast response

    const response = await fetch(ollamaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelName,
        prompt: prompt,
        stream: false,
        json: true
      })
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const rawText = data.response || "";
      // Extract JSON block if surrounded by markdown codeblock
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return formatAiOutput(parsed, description);
      }
    }
  } catch (err) {
    console.log(`[AI Service] Ollama not reached (${err.message}). Using intelligent disaster classifier fallback.`);
  }

  // Smart Heuristic Fallback
  return fallbackClassifier(description);
}

function formatAiOutput(parsed, originalDesc) {
  const validResources = ["Fire & Rescue", "Ambulance", "Police", "NDRF", "SDRF", "Civil Defence", "NGO"];
  let suggested = Array.isArray(parsed.suggestedResources) ? parsed.suggestedResources : [];
  suggested = suggested.filter(r => validResources.includes(r));
  if (suggested.length === 0) suggested = ["Fire & Rescue", "Ambulance"];

  const validSeverities = ["Low", "Moderate", "High", "Critical"];
  const severity = validSeverities.includes(parsed.severity) ? parsed.severity : "High";

  return {
    incidentType: parsed.incidentType || "General Emergency",
    severity: severity,
    estimatedVictims: parsed.estimatedVictims || "Potentially affected civilians",
    suggestedResources: suggested,
    reviewedByOfficer: false
  };
}

function fallbackClassifier(desc) {
  const lower = desc.toLowerCase();
  let incidentType = "General Disaster";
  let severity = "Moderate";
  let estimatedVictims = "1-5 individuals affected";
  const suggestedResources = new Set();

  if (lower.includes("flood") || lower.includes("water") || lower.includes("submerged") || lower.includes("drowning")) {
    incidentType = "Flash Flood / Water Logging";
    severity = "High";
    suggestedResources.add("NDRF");
    suggestedResources.add("SDRF");
    suggestedResources.add("Civil Defence");
    estimatedVictims = "Multiple residents stranded in water";
  } else if (lower.includes("fire") || lower.includes("smoke") || lower.includes("explosion") || lower.includes("blast")) {
    incidentType = "Fire & Explosion Emergency";
    severity = "High";
    suggestedResources.add("Fire & Rescue");
    suggestedResources.add("Ambulance");
    suggestedResources.add("Police");
    estimatedVictims = "Burn risks and smoke inhalation suspected";
  } else if (lower.includes("collapse") || lower.includes("debris") || lower.includes("landslide") || lower.includes("rubble")) {
    incidentType = "Structural Collapse / Landslide";
    severity = "Critical";
    suggestedResources.add("NDRF");
    suggestedResources.add("Fire & Rescue");
    suggestedResources.add("Ambulance");
    estimatedVictims = "Estimated 10+ trapped beneath rubble";
  } else if (lower.includes("accident") || lower.includes("crash") || lower.includes("collision") || lower.includes("bleeding")) {
    incidentType = "Mass Casualty Transportation Accident";
    severity = "High";
    suggestedResources.add("Ambulance");
    suggestedResources.add("Police");
    suggestedResources.add("Fire & Rescue");
    estimatedVictims = "Injured passengers requiring immediate trauma triage";
  } else if (lower.includes("cyclone") || lower.includes("storm") || lower.includes("wind") || lower.includes("tree")) {
    incidentType = "Severe Cyclonic Storm Impact";
    severity = "High";
    suggestedResources.add("SDRF");
    suggestedResources.add("Civil Defence");
    suggestedResources.add("NGO");
    estimatedVictims = "Widespread structural damage and disruption";
  } else {
    suggestedResources.add("Police");
    suggestedResources.add("Ambulance");
  }

  if (lower.includes("urgent") || lower.includes("die") || lower.includes("critical") || lower.includes("trap") || lower.includes("severe")) {
    severity = "Critical";
  }

  return {
    incidentType,
    severity,
    estimatedVictims,
    suggestedResources: Array.from(suggestedResources),
    reviewedByOfficer: false
  };
}

module.exports = { analyzeIncident };

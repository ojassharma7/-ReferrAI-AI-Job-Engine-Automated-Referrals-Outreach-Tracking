// Quick test to see what models work
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.log('GEMINI_API_KEY not set');
  process.exit(1);
}

const models = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro', 'gemini-pro'];
const testModel = async (model) => {
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Say hello' }] }]
      })
    });
    if (response.ok) {
      console.log(`✅ ${model} works with v1`);
      return true;
    } else {
      const text = await response.text();
      console.log(`❌ ${model}: ${response.status} - ${text.substring(0, 100)}`);
      return false;
    }
  } catch (e) {
    console.log(`❌ ${model}: ${e.message}`);
    return false;
  }
};

(async () => {
  console.log('Testing models...\n');
  for (const model of models) {
    await testModel(model);
  }
})();

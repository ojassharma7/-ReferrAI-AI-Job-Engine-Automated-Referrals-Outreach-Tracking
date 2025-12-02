#!/usr/bin/env tsx
// Script to list available Gemini models

import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY not set in .env');
  process.exit(1);
}

async function listModels() {
  console.log('🔍 Fetching available Gemini models...\n');
  
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error: ${response.status}`);
      console.error(errorText);
      return;
    }
    
    const data = await response.json();
    
    if (data.models && data.models.length > 0) {
      console.log('✅ Available models:\n');
      
      const generateContentModels = data.models
        .filter((m: any) => 
          m.supportedGenerationMethods && 
          m.supportedGenerationMethods.includes('generateContent')
        )
        .map((m: any) => ({
          name: m.name,
          displayName: m.displayName,
          description: m.description,
        }));
      
      generateContentModels.forEach((model: any) => {
        console.log(`📌 ${model.name}`);
        console.log(`   Display: ${model.displayName || 'N/A'}`);
        console.log(`   Description: ${model.description || 'N/A'}`);
        console.log('');
      });
      
      console.log('\n💡 Use the model name (without "models/" prefix) in GEMINI_MODEL');
      console.log('   Example: GEMINI_MODEL=gemini-1.5-pro');
      
    } else {
      console.log('❌ No models found');
    }
    
  } catch (error) {
    console.error('❌ Error fetching models:', error);
  }
}

listModels();


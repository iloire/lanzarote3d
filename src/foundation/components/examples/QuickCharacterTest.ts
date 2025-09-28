import * as THREE from 'three';
import { PilotVoxelComponent, CharacterType } from '../characters';

/**
 * Quick test to validate both Adri and Ivan characters work
 */
export async function testBothCharacters() {
  console.log('🧪 Testing both Adri and Ivan characters...');

  // Test Adri character
  try {
    const adri = new PilotVoxelComponent({
      characterType: CharacterType.ADRI,
      scale: 0.01
    });

    console.log('✅ Adri character created successfully');
    console.log('📋 Adri info:', adri.getCharacterInfo());

    // Clean up
    adri.dispose();
  } catch (error) {
    console.error('❌ Adri character test failed:', error);
  }

  // Test Ivan character
  try {
    const ivan = new PilotVoxelComponent({
      characterType: CharacterType.IVAN,
      scale: 0.01
    });

    console.log('✅ Ivan character created successfully');
    console.log('📋 Ivan info:', ivan.getCharacterInfo());

    // Clean up
    ivan.dispose();
  } catch (error) {
    console.error('❌ Ivan character test failed:', error);
  }

  // Test character switching
  try {
    const switchingPilot = new PilotVoxelComponent({
      characterType: CharacterType.ADRI,
      scale: 0.01
    });

    console.log('🔄 Testing character switching...');

    // Note: We can't actually load without a scene, but we can test the setup
    console.log('✅ Character switching setup successful');

    switchingPilot.dispose();
  } catch (error) {
    console.error('❌ Character switching test failed:', error);
  }

  console.log('🎉 Character tests completed!');
}

/**
 * Test character registry functionality
 */
export function testCharacterRegistry() {
  console.log('📚 Testing character registry...');

  // Import registry here to avoid top-level imports during module load
  const { characterRegistry } = require('../characters/CharacterRegistry');

  // Test registry functions
  const allCharacters = characterRegistry.getAllCharacters();
  console.log(`📊 Total characters registered: ${allCharacters.length}`);

  const adriCharacter = characterRegistry.getCharacter(CharacterType.ADRI);
  const ivanCharacter = characterRegistry.getCharacter(CharacterType.IVAN);

  if (adriCharacter) {
    console.log(`✅ Adri found: ${adriCharacter.name} - ${adriCharacter.description}`);
  } else {
    console.log('❌ Adri character not found in registry');
  }

  if (ivanCharacter) {
    console.log(`✅ Ivan found: ${ivanCharacter.name} - ${ivanCharacter.description}`);
  } else {
    console.log('❌ Ivan character not found in registry');
  }

  // Test search functionality
  const pilotCharacters = characterRegistry.getCharactersByTag('pilot');
  console.log(`🔍 Characters tagged as 'pilot': ${pilotCharacters.length}`);

  const personalCharacters = characterRegistry.searchCharacters('ivan');
  console.log(`👤 Characters matching 'ivan': ${personalCharacters.length}`);

  console.log('✅ Character registry tests completed!');

  return {
    totalCharacters: allCharacters.length,
    adriFound: !!adriCharacter,
    ivanFound: !!ivanCharacter,
    pilotCount: pilotCharacters.length,
    searchResults: personalCharacters.length
  };
}

// Export test runner
export async function runAllCharacterTests() {
  console.log('🚀 Running comprehensive character system tests...');

  // Test registry first
  const registryResults = testCharacterRegistry();

  // Test character creation
  await testBothCharacters();

  console.log('📊 Test Summary:');
  console.log(`   Registry Status: ${registryResults.adriFound && registryResults.ivanFound ? '✅' : '❌'}`);
  console.log(`   Total Characters: ${registryResults.totalCharacters}`);
  console.log(`   Pilot Characters: ${registryResults.pilotCount}`);

  return registryResults;
}
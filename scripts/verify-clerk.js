#!/usr/bin/env node

/**
 * Script para verificar la configuración de Clerk
 * Uso: node scripts/verify-clerk.js
 */

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;

console.log('🔍 Verificando configuración de Clerk...\n');

// Verificar formato de la Publishable Key
console.log('📋 NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:');
if (!publishableKey) {
  console.log('   ❌ No está configurada');
} else if (publishableKey.length < 50) {
  console.log(`   ⚠️  Parece estar truncada (longitud: ${publishableKey.length})`);
  console.log(`   Valor actual: ${publishableKey}`);
} else if (!publishableKey.startsWith('pk_')) {
  console.log('   ❌ Formato incorrecto (debe empezar con "pk_")');
} else {
  console.log(`   ✅ Formato válido (longitud: ${publishableKey.length})`);
  console.log(`   Primeros 20 caracteres: ${publishableKey.substring(0, 20)}...`);
}

console.log('\n📋 CLERK_SECRET_KEY:');
if (!secretKey) {
  console.log('   ❌ No está configurada');
} else if (secretKey.length < 50) {
  console.log(`   ⚠️  Parece estar truncada (longitud: ${secretKey.length})`);
  console.log(`   Valor actual: ${secretKey}`);
} else if (!secretKey.startsWith('sk_')) {
  console.log('   ❌ Formato incorrecto (debe empezar con "sk_")');
} else {
  console.log(`   ✅ Formato válido (longitud: ${secretKey.length})`);
  console.log(`   Primeros 20 caracteres: ${secretKey.substring(0, 20)}...`);
}

console.log('\n📋 Estado de Autenticación:');
if (publishableKey && secretKey && 
    publishableKey.length > 50 && 
    secretKey.length > 50) {
  console.log('   ✅ Clerk parece estar configurado correctamente');
  console.log('   → Los usuarios podrán iniciar sesión real');
} else {
  console.log('   ⚠️  Clerk NO está completamente configurado');
  console.log('   → La aplicación usará modo demo (sin login real)');
}

console.log('\n📋 Para obtener las claves de Clerk:');
console.log('   1. Ve a https://dashboard.clerk.com');
console.log('   2. Selecciona tu aplicación');
console.log('   3. Ve a API Keys');
console.log('   4. Copia las claves de API');
console.log('   5. Actualiza tu archivo .env.development\n');

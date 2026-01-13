#!/usr/bin/env node

/**
 * Automated Regression Test for Story 0-8
 * 
 * Checks:
 * - Component usage (Card, Button, Input, Table)
 * - ARIA attributes (role="alert", aria-label)
 * - Design Token usage (bg-linear-*, text-linear-*, p-linear-*, m-linear-*)
 * - Responsive classes (sm:, md:, lg:)
 * - Accessibility features
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Epic 1 and Epic 2 page files to check
const filesToCheck = [
  // Epic 1
  'src/auth/LoginPage.tsx',
  'src/users/UserManagementPage.tsx',
  'src/products/ProductManagementPage.tsx',
  // Add more files as needed
];

// Component imports to check
const requiredComponents = ['Card', 'Button', 'Input', 'Table'];

// ARIA attributes to check
const ariaAttributes = {
  'role="alert"': 'Error messages should have role="alert"',
  'aria-label': 'Tables and interactive elements should have aria-label',
};

// Design Token patterns
const designTokenPatterns = {
  'bg-linear-': 'Background colors using design tokens',
  'text-linear-': 'Text colors using design tokens',
  'p-linear-': 'Padding using design tokens',
  'm-linear-': 'Margin using design tokens',
};

// Responsive patterns
const responsivePatterns = {
  'sm:': 'Small screen responsive classes',
  'md:': 'Medium screen responsive classes',
  'lg:': 'Large screen responsive classes',
};

// Test results
const results = {
  totalFiles: 0,
  checkedFiles: 0,
  componentUsage: {},
  ariaAttributes: {},
  designTokens: {},
  responsiveClasses: {},
  errors: [],
  warnings: [],
};

/**
 * Check if file exists
 */
function fileExists(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  return fs.existsSync(fullPath);
}

/**
 * Read file content
 */
function readFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  try {
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (error) {
    results.errors.push(`Failed to read ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Check component usage
 */
function checkComponentUsage(content, filePath) {
  const checks = {};
  
  requiredComponents.forEach(component => {
    // Check import
    const importPattern = new RegExp(`import.*${component}.*from`, 'i');
    const hasImport = importPattern.test(content);
    
    // Check usage
    const usagePattern = new RegExp(`<${component}[\\s>]`, 'i');
    const hasUsage = usagePattern.test(content);
    
    checks[component] = {
      imported: hasImport,
      used: hasUsage,
    };
    
    if (hasImport && !hasUsage) {
      results.warnings.push(`${filePath}: ${component} is imported but not used`);
    }
    
    if (!hasImport && hasUsage) {
      results.errors.push(`${filePath}: ${component} is used but not imported`);
    }
  });
  
  return checks;
}

/**
 * Check ARIA attributes
 */
function checkAriaAttributes(content, filePath) {
  const checks = {};
  
  Object.keys(ariaAttributes).forEach(attr => {
    const pattern = new RegExp(attr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = content.match(pattern);
    checks[attr] = {
      found: matches !== null,
      count: matches ? matches.length : 0,
    };
  });
  
  return checks;
}

/**
 * Check design token usage
 */
function checkDesignTokens(content, filePath) {
  const checks = {};
  
  Object.keys(designTokenPatterns).forEach(pattern => {
    const regex = new RegExp(`"${pattern}[^"]*"|'${pattern}[^']*'|\\b${pattern}\\w+`, 'g');
    const matches = content.match(regex);
    checks[pattern] = {
      found: matches !== null,
      count: matches ? matches.length : 0,
      examples: matches ? matches.slice(0, 5) : [],
    };
  });
  
  return checks;
}

/**
 * Check responsive classes
 */
function checkResponsiveClasses(content, filePath) {
  const checks = {};
  
  Object.keys(responsivePatterns).forEach(pattern => {
    const regex = new RegExp(`\\b${pattern}\\w+`, 'g');
    const matches = content.match(regex);
    checks[pattern] = {
      found: matches !== null,
      count: matches ? matches.length : 0,
      examples: matches ? matches.slice(0, 5) : [],
    };
  });
  
  return checks;
}

/**
 * Main test function
 */
function runTests() {
  console.log('🧪 Running Automated Regression Tests for Story 0-8...\n');
  
  results.totalFiles = filesToCheck.length;
  
  filesToCheck.forEach(filePath => {
    if (!fileExists(filePath)) {
      results.errors.push(`File not found: ${filePath}`);
      return;
    }
    
    const content = readFile(filePath);
    if (!content) {
      return;
    }
    
    results.checkedFiles++;
    
    console.log(`📄 Checking ${filePath}...`);
    
    // Check component usage
    const componentChecks = checkComponentUsage(content, filePath);
    results.componentUsage[filePath] = componentChecks;
    
    // Check ARIA attributes
    const ariaChecks = checkAriaAttributes(content, filePath);
    results.ariaAttributes[filePath] = ariaChecks;
    
    // Check design tokens
    const tokenChecks = checkDesignTokens(content, filePath);
    results.designTokens[filePath] = tokenChecks;
    
    // Check responsive classes
    const responsiveChecks = checkResponsiveClasses(content, filePath);
    results.responsiveClasses[filePath] = responsiveChecks;
  });
  
  // Print results
  printResults();
}

/**
 * Print test results
 */
function printResults() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60));
  
  console.log(`\n✅ Files Checked: ${results.checkedFiles}/${results.totalFiles}`);
  
  // Component usage summary
  console.log('\n📦 Component Usage:');
  requiredComponents.forEach(component => {
    let importedCount = 0;
    let usedCount = 0;
    
    Object.values(results.componentUsage).forEach(checks => {
      if (checks[component]?.imported) importedCount++;
      if (checks[component]?.used) usedCount++;
    });
    
    console.log(`  ${component}: ${importedCount} imported, ${usedCount} used`);
  });
  
  // ARIA attributes summary
  console.log('\n♿ ARIA Attributes:');
  Object.keys(ariaAttributes).forEach(attr => {
    let totalCount = 0;
    Object.values(results.ariaAttributes).forEach(checks => {
      totalCount += checks[attr]?.count || 0;
    });
    console.log(`  ${attr}: ${totalCount} found`);
  });
  
  // Design tokens summary
  console.log('\n🎨 Design Tokens:');
  Object.keys(designTokenPatterns).forEach(pattern => {
    let totalCount = 0;
    Object.values(results.designTokens).forEach(checks => {
      totalCount += checks[pattern]?.count || 0;
    });
    console.log(`  ${pattern}*: ${totalCount} found`);
  });
  
  // Responsive classes summary
  console.log('\n📱 Responsive Classes:');
  Object.keys(responsivePatterns).forEach(pattern => {
    let totalCount = 0;
    Object.values(results.responsiveClasses).forEach(checks => {
      totalCount += checks[pattern]?.count || 0;
    });
    console.log(`  ${pattern}*: ${totalCount} found`);
  });
  
  // Errors
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => {
      console.log(`  - ${error}`);
    });
  }
  
  // Warnings
  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(warning => {
      console.log(`  - ${warning}`);
    });
  }
  
  // Overall status
  console.log('\n' + '='.repeat(60));
  if (results.errors.length === 0) {
    console.log('✅ All automated checks passed!');
  } else {
    console.log(`❌ Found ${results.errors.length} error(s)`);
  }
  console.log('='.repeat(60) + '\n');
  
  // Save results to file
  const resultsPath = path.join(process.cwd(), '_bmad-output', 'test-reports', 'automated-test-results-0-8.json');
  const resultsDir = path.dirname(resultsPath);
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`📝 Results saved to: ${resultsPath}`);
}

// Run tests
runTests();

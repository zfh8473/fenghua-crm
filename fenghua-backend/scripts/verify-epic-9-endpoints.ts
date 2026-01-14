/**
 * Script to verify Epic 9 API endpoints
 * 
 * Verifies that all required API endpoints for Epic 9 stories exist and are accessible
 * All custom code is proprietary and not open source.
 */

import * as fs from 'fs';
import * as path from 'path';

interface EndpointCheck {
  story: string;
  endpoint: string;
  method: string;
  file: string;
  found: boolean;
  line?: number;
}

const endpointChecks: EndpointCheck[] = [
  // Story 9-1, 9-2: Audit Logs
  {
    story: '9-1, 9-2',
    endpoint: 'GET /api/audit-logs',
    method: '@Get()',
    file: 'fenghua-backend/src/audit/audit-logs.controller.ts',
    found: false,
  },
  {
    story: '9-1, 9-2',
    endpoint: 'GET /api/audit-logs/:id',
    method: '@Get(\':id\')',
    file: 'fenghua-backend/src/audit/audit-logs.controller.ts',
    found: false,
  },
  {
    story: '9-1, 9-2',
    endpoint: 'GET /api/audit-logs/export',
    method: '@Get(\'export\')',
    file: 'fenghua-backend/src/audit/audit-logs.controller.ts',
    found: false,
  },
  // Story 9-5: GDPR Export
  {
    story: '9-5',
    endpoint: 'POST /api/gdpr/export-request',
    method: '@Post(\'export-request\')',
    file: 'fenghua-backend/src/gdpr/gdpr-export.controller.ts',
    found: false,
  },
  {
    story: '9-5',
    endpoint: 'GET /api/gdpr/export-requests',
    method: '@Get(\'export-requests\')',
    file: 'fenghua-backend/src/gdpr/gdpr-export.controller.ts',
    found: false,
  },
  {
    story: '9-5',
    endpoint: 'GET /api/gdpr/export-requests/:id',
    method: '@Get(\'export-requests/:id\')',
    file: 'fenghua-backend/src/gdpr/gdpr-export.controller.ts',
    found: false,
  },
  {
    story: '9-5',
    endpoint: 'GET /api/gdpr/export-requests/:id/download',
    method: '@Get(\'export-requests/:id/download\')',
    file: 'fenghua-backend/src/gdpr/gdpr-export.controller.ts',
    found: false,
  },
  // Story 9-6: GDPR Deletion
  {
    story: '9-6',
    endpoint: 'POST /api/gdpr/deletion-request',
    method: '@Post(\'deletion-request\')',
    file: 'fenghua-backend/src/gdpr/gdpr-deletion.controller.ts',
    found: false,
  },
  {
    story: '9-6',
    endpoint: 'GET /api/gdpr/deletion-requests',
    method: '@Get(\'deletion-requests\')',
    file: 'fenghua-backend/src/gdpr/gdpr-deletion.controller.ts',
    found: false,
  },
  {
    story: '9-6',
    endpoint: 'GET /api/gdpr/deletion-requests/:id',
    method: '@Get(\'deletion-requests/:id\')',
    file: 'fenghua-backend/src/gdpr/gdpr-deletion.controller.ts',
    found: false,
  },
  // Story 9-7: Data Retention
  {
    story: '9-7',
    endpoint: 'GET /api/data-retention/policy',
    method: '@Get(\'policy\')',
    file: 'fenghua-backend/src/data-retention/data-retention.controller.ts',
    found: false,
  },
  {
    story: '9-7',
    endpoint: 'GET /api/data-retention/statistics',
    method: '@Get(\'statistics\')',
    file: 'fenghua-backend/src/data-retention/data-retention.controller.ts',
    found: false,
  },
  {
    story: '9-7',
    endpoint: 'GET /api/data-retention/cleanup-history',
    method: '@Get(\'cleanup-history\')',
    file: 'fenghua-backend/src/data-retention/data-retention.controller.ts',
    found: false,
  },
];

function verifyEndpoints(): void {
  console.log('🔍 Verifying Epic 9 API endpoints...\n');

  const projectRoot = process.cwd();
  let foundCount = 0;
  let missingCount = 0;

  for (const check of endpointChecks) {
    // Handle both absolute and relative paths
    let filePath: string;
    if (check.file.startsWith('/')) {
      filePath = check.file;
    } else if (check.file.startsWith('fenghua-backend/')) {
      // Remove fenghua-backend/ prefix and join with project root
      const relativePath = check.file.replace('fenghua-backend/', '');
      filePath = path.join(projectRoot, relativePath);
    } else {
      filePath = path.join(projectRoot, check.file);
    }

    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${check.story}: ${check.endpoint} - File not found: ${check.file}`);
      missingCount++;
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const methodPattern = new RegExp(check.method.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const lines = content.split('\n');

    let found = false;
    let lineNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      if (methodPattern.test(lines[i])) {
        found = true;
        lineNumber = i + 1;
        break;
      }
    }

    check.found = found;
    check.line = lineNumber;

    if (found) {
      console.log(`✅ ${check.story}: ${check.endpoint} - Found at line ${lineNumber}`);
      foundCount++;
    } else {
      console.log(`❌ ${check.story}: ${check.endpoint} - Not found in ${check.file}`);
      missingCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Found: ${foundCount}/${endpointChecks.length}`);
  console.log(`   ❌ Missing: ${missingCount}/${endpointChecks.length}`);

  if (missingCount > 0) {
    console.log(`\n⚠️  Some endpoints are missing. Please verify implementation.`);
    process.exit(1);
  } else {
    console.log(`\n✅ All Epic 9 API endpoints verified!`);
  }
}

// Run verification
verifyEndpoints();

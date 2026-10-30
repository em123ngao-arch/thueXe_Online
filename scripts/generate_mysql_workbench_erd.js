const fs = require('fs');
const path = require('path');

// =============================================================================
// DRIVESHARE — AUTHENTIC MYSQL WORKBENCH ERD GENERATOR
// =============================================================================

const tables = [
  {
    name: 'roles',
    x: 50, y: 60, width: 340,
    columns: [
      { name: 'role_id', type: 'BIGINT', isPk: true, isFk: false, nn: true },
      { name: 'role_name', type: 'VARCHAR(30)', isPk: false, isFk: false, nn: true, uk: true }
    ]
  },
  {
    name: 'user_roles',
    x: 50, y: 200, width: 340,
    columns: [
      { name: 'user_id', type: 'BIGINT', isPk: true, isFk: true, nn: true, ref: 'users.user_id' },
      { name: 'role_id', type: 'BIGINT', isPk: true, isFk: true, nn: true, ref: 'roles.role_id' }
    ]
  },
  {
    name: 'users',
    x: 50, y: 350, width: 360,
    columns: [
      { name: 'user_id', type: 'BIGINT', isPk: true, isFk: false, nn: true },
      { name: 'username', type: 'VARCHAR(50)', isPk: false, isFk: false, nn: true, uk: true },
      { name: 'email', type: 'VARCHAR(150)', isPk: false, isFk: false, nn: true, uk: true },
      { name: 'phone', type: 'VARCHAR(20)', isPk: false, isFk: false, nn: false, uk: true },
      { name: 'password_hash', type: 'VARCHAR(255)', isPk: false, isFk: false, nn: true },
      { name: 'full_name', type: 'VARCHAR(150)', isPk: false, isFk: false, nn: false },
      { name: 'avatar_url', type: 'VARCHAR(500)', isPk: false, isFk: false, nn: false },
      { name: 'auth_provider', type: 'VARCHAR(20)', isPk: false, isFk: false, nn: false },
      { name: 'provider_id', type: 'VARCHAR(100)', isPk: false, isFk: false, nn: false },
      { name: 'status', type: 'VARCHAR(20)', isPk: false, isFk: false, nn: true },
      { name: 'bank_verification_status', type: 'VARCHAR(30)', isPk: false, isFk: false, nn: false },
      { name: 'bank_rejection_reason', type: 'TEXT', isPk: false, isFk: false, nn: false },
      { name: 'created_at', type: 'TIMESTAMP', isPk: false, isFk: false, nn: true },
      { name: 'updated_at', type: 'TIMESTAMP', isPk: false, isFk: false, nn: false }
    ]
  },
  {
    name: 'renter_profiles',
    x: 50, y: 800, width: 360,
    columns: [
      { name: 'user_id', type: 'BIGINT', isPk: true, isFk: true, nn: true, ref: 'users.user_id' },
      { name: 'license_number', type: 'VARCHAR(30)', isPk: false, isFk: false, nn: false, uk: true },
      { name: 'license_full_name', type: 'VARCHAR(150)', isPk: false, isFk: false, nn: false },
      { name: 'license_dob', type: 'DATE', isPk: false, isFk: false, nn: false },
      { name: 'license_issue_date', type: 'DATE', isPk: false, isFk: false, nn: false },
      { name: 'license_expiry_date', type: 'DATE', isPk: false, isFk: false, nn: false },
      { name: 'license_front_url', type: 'VARCHAR(500)', isPk: false, isFk: false, nn: false },
      { name: 'license_back_url', type: 'VARCHAR(500)', isPk: false, isFk: false, nn: false },
      { name: 'license_verification_status', type: 'VARCHAR(20)', isPk: false, isFk: false, nn: true },
      { name: 'license_verified_by', type: 'BIGINT', isPk: false, isFk: true, nn: false, ref: 'users.user_id' },
      { name: 'license_verified_at', type: 'TIMESTAMP', isPk: false, isFk: false, nn: false }
    ]
  },
  {
    name: 'owner_profiles',
    x: 50, y: 1140, width: 360,
    columns: [
      { name: 'user_id', type: 'BIGINT', isPk: true, isFk: true, nn: true, ref: 'users.user_id' },
      { name: 'id_card_number', type: 'VARCHAR(20)', isPk: false, isFk: false, nn: false, uk: true },
      { name: 'id_card_front_url', type: 'VARCHAR(500)', isPk: false, isFk: false, nn: false },
      { name: 'id_card_back_url', type: 'VARCHAR(500)', isPk: false, isFk: false, nn: false },
      { name: 'bank_name', type: 'VARCHAR(100)', isPk: false, isFk: false, nn: false },
      { name: 'bank_account_number', type: 'VARCHAR(30)', isPk: false, isFk: false, nn: false },
      { name: 'bank_account_name', type: 'VARCHAR(150)', isPk: false, isFk: false, nn: false },
      { name: 'verification_status', type: 'VARCHAR(20)', isPk: false, isFk: false, nn: true },
      { name: 'verified_by', type: 'BIGINT', isPk: false, isFk: true, nn: false, ref: 'users.user_id' }
    ]
  },
  {
    name: 'cars',
    x: 500, y: 60, width: 380,
    columns: [
      { name: 'car_id', type: 'BIGINT', isPk: true, isFk: false, nn: true },
      { name: 'owner_id', type: 'BIGINT', isPk: false, isFk: true, nn: true, ref: 'users.user_id' },
      { name: 'brand', type: 'VARCHAR(50)', isPk: false, isFk: false, nn: true },
      { name: 'model', type: 'VARCHAR(100)', isPk: false, isFk: false, nn: true },
      { name: 'year', type: 'SMALLINT', isPk: false, isFk: false, nn: false },
      { name: 'license_plate', type: 'VARCHAR(20)', isPk: false, isFk: false, nn: true, uk: true },
      { name: 'seats', type: 'SMALLINT', isPk: false, isFk: false, nn: true },
      { name: 'transmission', type: 'VARCHAR(20)', isPk: false, isFk: false, nn: true },
      { name: 'fuel_type', type: 'VARCHAR(20)', isPk: false, isFk: false, nn: true },
      { name: 'price_per_day', type: 'NUMERIC(12,2)', isPk: false, isFk: false, nn: true },
      { name: 'address', type: 'TEXT', isPk: false, isFk: false, nn: false },
      { name: 'latitude', type: 'NUMERIC(10,7)', isPk: false, isFk: false, nn: false },
      { name: 'longitude', type: 'NUMERIC(10,7)', isPk: false, isFk: false, nn: false },
      { name: 'status', type: 'VARCHAR(30)', isPk: false, isFk: false, nn: true },
      { name: 'has_driver_service', type: 'BOOLEAN', isPk: false, isFk: false, nn: false },
      { name: 'driver_fee_per_day', type: 'NUMERIC(12,2)', isPk: false, isFk: false, nn: false },
      { name: 'rating', type: 'NUMERIC(3,2)', isPk: false, isFk: false, nn: false },
      { name: 'rating_count', type: 'INT', isPk: false, isFk: false, nn: false },
      { name: 'created_at', type: 'TIMESTAMP', isPk: false, isFk: false, nn: true }
    ]
  },
  {
    name: 'car_images',
    x: 500, y: 640, width: 380,
    columns: [
      { name: 'image_id', type: 'BIGINT', isPk: true, isFk: false, nn: true },
      { name: 'car_id', type: 'BIGINT', isPk: false, isFk: true, nn: true, ref: 'cars.car_id' },
      { name: 'image_url', type: 'VARCHAR(500)', isPk: false, isFk: false, nn: true },
      { name: 'is_thumbnail', type: 'BOOLEAN', isPk: false, isFk: false, nn: false }
    ]
  },
  {
    name: 'car_calendar_blocks',
    x: 500, y: 800, width: 380,
    columns: [
      { name: 'block_id', type: 'BIGINT', isPk: true, isFk: false, nn: true },
      { name: 'car_id', type: 'BIGINT', isPk: false, isFk: true, nn: true, ref: 'cars.car_id' },
      { name: 'start_date', type: 'DATE', isPk: false, isFk: false, nn: true },
      { name: 'end_date', type: 'DATE', isPk: false, isFk: false, nn: true },
      { name: 'reason', type: 'VARCHAR(255)', isPk: false, isFk: false, nn: false }
    ]
  },
  {
    name: 'chat_memory',
    x: 500, y: 990, width: 380,
    columns: [
      { name: 'memory_id', type: 'BIGINT', isPk: true, isFk: false, nn: true },
      { name: 'user_id', type: 'BIGINT', isPk: false, isFk: true, nn: true, ref: 'users.user_id' },
      { name: 'session_id', type: 'VARCHAR(100)', isPk: false, isFk: false, nn: true },
      { name: 'role', type: 'VARCHAR(20)', isPk: false, isFk: false, nn: true },
      { name: 'content', type: 'TEXT', isPk: false, isFk: false, nn: true }
    ]
  },
  {
    name: 'rentals',
    x: 960, y: 60, width: 420,
    columns: [
      { name: 'rental_id', type: 'BIGINT', isPk: true, isFk: false, nn: true },
      { name: 'renter_id', type: 'BIGINT', isPk: false, isFk: true, nn: true, ref: 'users.user_id' },
      { name: 'car_id', type: 'BIGINT', isPk: false, isFk: true, nn: true, ref: 'cars.car_id' },
      { name: 'start_date', type: 'DATE', isPk: false, isFk: false, nn: true },
      { name: 'end_date', type: 'DATE', isPk: false, isFk: false, nn: true },
      { name: 'price_per_day', type: 'NUMERIC(12,2)', isPk: false, isFk: false, nn: true },
      { name: 'total_amount', type: 'NUMERIC(12,2)', isPk: false, isFk: false, nn: true },
      { name: 'deposit_amount', type: 'NUMERIC(12,2)', isPk: false, isFk: false, nn: true },
      { name: 'remaining_amount', type: 'NUMERIC(12,2)', isPk: false, isFk: false, nn: true },
      { name: 'with_driver', type: 'BOOLEAN', isPk: false, isFk: false, nn: false },
      { name: 'driver_fee', type: 'NUMERIC(12,2)', isPk: false, isFk: false, nn: false },
      { name: 'status', type: 'VARCHAR(30)', isPk: false, isFk: false, nn: true },
      { name: 'payment_expires_at', type: 'TIMESTAMP', isPk: false, isFk: false, nn: false },
      { name: 'overdue_hours', type: 'INT', isPk: false, isFk: false, nn: false },
      { name: 'penalty_fee', type: 'NUMERIC(12,2)', isPk: false, isFk: false, nn: false },
      { name: 'actual_return_time', type: 'TIMESTAMP', isPk: false, isFk: false, nn: false },
      { name: 'is_blacklisted_triggered', type: 'BOOLEAN', isPk: false, isFk: false, nn: false },
      { name: 'reject_reason', type: 'TEXT', isPk: false, isFk: false, nn: false }
    ]
  },
  {
    name: 'rental_inspections',
    x: 960, y: 640, width: 420,
    columns: [
      { name: 'inspection_id', type: 'BIGINT', isPk: true, isFk: false, nn: true },
      { name: 'rental_id', type: 'BIGINT', isPk: false, isFk: true, nn: true, ref: 'rentals.rental_id' },
      { name: 'type', type: 'VARCHAR(20)', isPk: false, isFk: false, nn: true },
      { name: 'odo_reading', type: 'INT', isPk: false, isFk: false, nn: true },
      { name: 'fuel_percentage', type: 'SMALLINT', isPk: false, isFk: false, nn: true },
      { name: 'images_json', type: 'TEXT', isPk: false, isFk: false, nn: false },
      { name: 'damages_notes', type: 'TEXT', isPk: false, isFk: false, nn: false }
    ]
  },
  {
    name: 'reviews',
    x: 960, y: 880, width: 420,
    columns: [
      { name: 'review_id', type: 'BIGINT', isPk: true, isFk: false, nn: true },
      { name: 'rental_id', type: 'BIGINT', isPk: false, isFk: true, nn: true, uk: true, ref: 'rentals.rental_id' },
      { name: 'car_id', type: 'BIGINT', isPk: false, isFk: true, nn: true, ref: 'cars.car_id' },
      { name: 'renter_id', type: 'BIGINT', isPk: false, isFk: true, nn: true, ref: 'users.user_id' },
      { name: 'rating', type: 'SMALLINT', isPk: false, isFk: false, nn: true },
      { name: 'comment', type: 'TEXT', isPk: false, isFk: false, nn: false }
    ]
  },
  {
    name: 'payments',
    x: 1460, y: 60, width: 400,
    columns: [
      { name: 'payment_id', type: 'BIGINT', isPk: true, isFk: false, nn: true },
      { name: 'rental_id', type: 'BIGINT', isPk: false, isFk: true, nn: true, ref: 'rentals.rental_id' },
      { name: 'user_id', type: 'BIGINT', isPk: false, isFk: true, nn: true, ref: 'users.user_id' },
      { name: 'amount', type: 'NUMERIC(12,2)', isPk: false, isFk: false, nn: true },
      { name: 'payment_type', type: 'VARCHAR(30)', isPk: false, isFk: false, nn: true },
      { name: 'payment_method', type: 'VARCHAR(30)', isPk: false, isFk: false, nn: true },
      { name: 'transaction_id', type: 'VARCHAR(100)', isPk: false, isFk: false, nn: false, uk: true },
      { name: 'status', type: 'VARCHAR(20)', isPk: false, isFk: false, nn: true }
    ]
  },
  {
    name: 'rental_disputes',
    x: 1460, y: 410, width: 400,
    columns: [
      { name: 'dispute_id', type: 'BIGINT', isPk: true, isFk: false, nn: true },
      { name: 'rental_id', type: 'BIGINT', isPk: false, isFk: true, nn: true, ref: 'rentals.rental_id' },
      { name: 'reporter_id', type: 'BIGINT', isPk: false, isFk: true, nn: true, ref: 'users.user_id' },
      { name: 'dispute_type', type: 'VARCHAR(50)', isPk: false, isFk: false, nn: true },
      { name: 'reason', type: 'TEXT', isPk: false, isFk: false, nn: true },
      { name: 'evidence_images_json', type: 'TEXT', isPk: false, isFk: false, nn: false },
      { name: 'compensation_amount', type: 'NUMERIC(12,2)', isPk: false, isFk: false, nn: false },
      { name: 'status', type: 'VARCHAR(20)', isPk: false, isFk: false, nn: true },
      { name: 'resolved_by', type: 'BIGINT', isPk: false, isFk: true, nn: false, ref: 'users.user_id' }
    ]
  },
  {
    name: 'notifications',
    x: 1460, y: 790, width: 400,
    columns: [
      { name: 'notification_id', type: 'BIGINT', isPk: true, isFk: false, nn: true },
      { name: 'user_id', type: 'BIGINT', isPk: false, isFk: true, nn: true, ref: 'users.user_id' },
      { name: 'title', type: 'VARCHAR(150)', isPk: false, isFk: false, nn: true },
      { name: 'content', type: 'TEXT', isPk: false, isFk: false, nn: true },
      { name: 'type', type: 'VARCHAR(50)', isPk: false, isFk: false, nn: true },
      { name: 'is_read', type: 'BOOLEAN', isPk: false, isFk: false, nn: false }
    ]
  }
];

function generateSVG() {
  const canvasW = 1920;
  const canvasH = 1480;
  const rowH = 24;
  const headerH = 34;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasW} ${canvasH}" width="${canvasW}" height="${canvasH}">
  <defs>
    <!-- Background grid like MySQL Workbench -->
    <pattern id="workbenchGrid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e6ecf2" stroke-width="1"/>
    </pattern>
    
    <!-- Table Header Gradient -->
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#3a608f"/>
      <stop offset="100%" stop-color="#24426b"/>
    </linearGradient>

    <!-- Star Entity Header Gradient (Rentals) -->
    <linearGradient id="starHeaderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#094e48"/>
    </linearGradient>

    <!-- Drop Shadow for Tables -->
    <filter id="tableShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="3" dy="4" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.12"/>
    </filter>

    <!-- Connector Marker Crowfoot -->
    <marker id="crowEnd" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
      <path d="M0,0 L10,6 L0,12 M10,0 L10,12" fill="none" stroke="#475569" stroke-width="1.5"/>
    </marker>
    <marker id="oneStart" markerWidth="10" markerHeight="10" refX="2" refY="5" orient="auto">
      <line x1="4" y1="0" x2="4" y2="10" stroke="#475569" stroke-width="1.5"/>
      <line x1="8" y1="0" x2="8" y2="10" stroke="#475569" stroke-width="1.5"/>
    </marker>
  </defs>

  <!-- Canvas Background -->
  <rect width="${canvasW}" height="${canvasH}" fill="#f1f5f9"/>
  <rect width="${canvasW}" height="${canvasH}" fill="url(#workbenchGrid)"/>

  <!-- Title Banner -->
  <g transform="translate(50, 20)">
    <rect width="680" height="32" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <text x="12" y="21" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="14" font-weight="700" fill="#1e293b">
      🗄️ MySQL Workbench ERD — driveshare_db (PostgreSQL 16 Schema v8.0 Enterprise)
    </text>
  </g>

  <!-- RELATIONSHIP CONNECTING LINES (ORTHOGONAL) -->
  <g id="relations" stroke="#475569" stroke-width="1.5" fill="none">
    <!-- users -> user_roles -->
    <path d="M 230,350 L 230,300 L 230,270" marker-start="url(#oneStart)" marker-end="url(#crowEnd)" />
    <!-- roles -> user_roles -->
    <path d="M 220,130 L 220,200" marker-start="url(#oneStart)" marker-end="url(#crowEnd)" />
    <!-- users -> renter_profiles (1:1) -->
    <path d="M 230,710 L 230,800" marker-start="url(#oneStart)" marker-end="url(#oneStart)" />
    <!-- users -> owner_profiles (1:1) -->
    <path d="M 230,1070 L 230,1140" marker-start="url(#oneStart)" marker-end="url(#oneStart)" />
    
    <!-- users -> cars -->
    <path d="M 410,400 L 455,400 L 455,100 L 500,100" marker-start="url(#oneStart)" marker-end="url(#crowEnd)" />
    <!-- cars -> car_images -->
    <path d="M 690,530 L 690,640" marker-start="url(#oneStart)" marker-end="url(#crowEnd)" />
    <!-- cars -> car_calendar_blocks -->
    <path d="M 690,750 L 690,800" marker-start="url(#oneStart)" marker-end="url(#crowEnd)" />
    <!-- users -> chat_memory -->
    <path d="M 410,600 L 460,600 L 460,1030 L 500,1030" marker-start="url(#oneStart)" marker-end="url(#crowEnd)" />

    <!-- users -> rentals -->
    <path d="M 410,450 L 920,450 L 920,120 L 960,120" marker-start="url(#oneStart)" marker-end="url(#crowEnd)" />
    <!-- cars -> rentals -->
    <path d="M 880,150 L 960,150" marker-start="url(#oneStart)" marker-end="url(#crowEnd)" />

    <!-- rentals -> rental_inspections -->
    <path d="M 1170,510 L 1170,640" marker-start="url(#oneStart)" marker-end="url(#crowEnd)" />
    <!-- rentals -> reviews (1:1) -->
    <path d="M 1170,820 L 1170,880" marker-start="url(#oneStart)" marker-end="url(#oneStart)" />

    <!-- rentals -> payments -->
    <path d="M 1380,120 L 1460,120" marker-start="url(#oneStart)" marker-end="url(#crowEnd)" />
    <!-- rentals -> rental_disputes -->
    <path d="M 1380,450 L 1460,450" marker-start="url(#oneStart)" marker-end="url(#crowEnd)" />
    <!-- users -> notifications -->
    <path d="M 410,650 L 440,650 L 440,1400 L 1420,1400 L 1420,850 L 1460,850" marker-start="url(#oneStart)" marker-end="url(#crowEnd)" />
  </g>
`;

  // DRAW TABLES
  tables.forEach(t => {
    const totalH = headerH + t.columns.length * rowH + 6;
    const isStar = t.name === 'rentals';
    const grad = isStar ? 'url(#starHeaderGrad)' : 'url(#headerGrad)';

    svg += `
  <!-- TABLE: ${t.name} -->
  <g transform="translate(${t.x}, ${t.y})" filter="url(#tableShadow)" id="tbl_${t.name}">
    <!-- Table Outer Box -->
    <rect width="${t.width}" height="${totalH}" rx="5" fill="#ffffff" stroke="#335588" stroke-width="1.5"/>
    
    <!-- Table Header (Workbench Style) -->
    <path d="M 0,5 Q 0,0 5,0 L ${t.width - 5},0 Q ${t.width},0 ${t.width},5 L ${t.width},${headerH} L 0,${headerH} Z" fill="${grad}"/>
    
    <!-- Table Header Icon & Title -->
    <text x="12" y="22" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, monospace" font-size="13" font-weight="700" fill="#ffffff">
      🗄️ ${t.name}
    </text>
    <text x="${t.width - 12}" y="22" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="10" font-weight="600" fill="#93c5fd" text-anchor="end">
      TABLE
    </text>
    
    <!-- Table Columns -->
    <g transform="translate(0, ${headerH})">
`;

    t.columns.forEach((col, idx) => {
      const y = idx * rowH;
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      const keyIcon = col.isPk ? '🔑' : (col.isFk ? '🔗' : (col.nn ? '🔷' : '◇'));
      const keyColor = col.isPk ? '#b45309' : (col.isFk ? '#2563eb' : '#64748b');
      const nameWeight = (col.isPk || col.isFk) ? '700' : '500';
      const nameColor = col.isPk ? '#0f172a' : (col.isFk ? '#1e3a8a' : '#334155');

      svg += `      <!-- Row ${col.name} -->
      <rect y="${y}" width="${t.width}" height="${rowH}" fill="${bg}"/>
      <line x1="0" y1="${y}" x2="${t.width}" y2="${y}" stroke="#e2e8f0" stroke-width="0.8"/>
      
      <!-- Key Icon -->
      <text x="10" y="${y + 16}" font-size="10" fill="${keyColor}">${keyIcon}</text>
      
      <!-- Column Name -->
      <text x="28" y="${y + 16}" font-family="Consolas, Monaco, monospace" font-size="11.5" font-weight="${nameWeight}" fill="${nameColor}">
        ${col.name}${col.uk ? ' (UK)' : ''}
      </text>
      
      <!-- Column Type -->
      <text x="${t.width - 12}" y="${y + 16}" font-family="Consolas, Monaco, monospace" font-size="10.5" font-weight="500" fill="#64748b" text-anchor="end">
        ${col.type}
      </text>
`;
    });

    svg += `    </g>
  </g>
`;
  });

  svg += `</svg>`;
  return svg;
}

const svgContent = generateSVG();

// 1. Lưu file SVG vào docs/diagrams/
const svgPath1 = path.resolve('docs/diagrams/driveshare_erd_mysql_workbench.svg');
fs.writeFileSync(svgPath1, svgContent, 'utf-8');
console.log('✔ Đã tạo file SVG tại:', svgPath1);

// 2. Lưu file SVG vào frontend/ để phục vụ HTTP
const svgPath2 = path.resolve('frontend/driveshare_erd_mysql_workbench.svg');
fs.writeFileSync(svgPath2, svgContent, 'utf-8');
console.log('✔ Đã sao chép SVG vào frontend:', svgPath2);

// 3. Lưu vào artifact dir
const artifactDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\b0b36fad-ef8b-4a00-bef9-2286426655e6';
const svgPath3 = path.join(artifactDir, 'driveshare_erd_mysql_workbench.svg');
fs.writeFileSync(svgPath3, svgContent, 'utf-8');
console.log('✔ Đã lưu SVG vào artifact:', svgPath3);

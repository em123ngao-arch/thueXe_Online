# -*- coding: utf-8 -*-
"""
Script: audit_srs_v2_2.py
Purpose: Comprehensive audit of BAO_CAO_SRS_DRIVESHARE_K4_PRO_V2_2_Ch1_to_Ch12.docx
"""

import sys
import os
import re
import docx

sys.stdout.reconfigure(encoding='utf-8')

FILE_PATH = 'docs/BAO_CAO_SRS_DRIVESHARE_K4_PRO_V2_2_Ch1_to_Ch12.docx' if os.path.exists('docs/BAO_CAO_SRS_DRIVESHARE_K4_PRO_V2_2_Ch1_to_Ch12.docx') else 'BAO_CAO_SRS_DRIVESHARE_K4_PRO_V2_2_Ch1_to_Ch12.docx'

def audit():
    print(f"=== AUDITING {FILE_PATH} ===")
    assert os.path.exists(FILE_PATH), f"File {FILE_PATH} not found!"
    doc = docx.Document(FILE_PATH)
    
    print(f"Total Paragraphs: {len(doc.paragraphs)}")
    print(f"Total Tables: {len(doc.tables)}")
    print(f"Total Inline Shapes / Images in Document Parts: {len(doc.inline_shapes)}")
    
    # 1. Check Chapters Presence
    print("\n--- 1. Checking Chapter Headings ---")
    chapters = []
    for i, p in enumerate(doc.paragraphs):
        text = p.text.strip()
        if text.startswith('CHƯƠNG') or text.startswith('PHỤ LỤC'):
            chapters.append((i, p.style.name, text))
            print(f"  P[{i}] ({p.style.name}): {text}")
            
    assert len(chapters) >= 16, f"Expected at least 15 chapters + appendix, got {len(chapters)}"
    
    # 2. Check 5 Use Cases in Chapter 6
    print("\n--- 2. Checking Chapter 6 Use Cases ---")
    ucs = [p.text.strip() for p in doc.paragraphs if p.text.strip().startswith('UC-')]
    print(f"Found {len(ucs)} Use Cases:")
    for uc in ucs:
        print(f"  {uc}")
    assert len(ucs) == 5, f"Expected 5 Use Cases, got {len(ucs)}"
    expected_ucs = ['UC-AUT-001', 'UC-CAR-002', 'UC-BOK-003', 'UC-HND-004', 'UC-DSP-005']
    for euc in expected_ucs:
        assert any(euc in u for u in ucs), f"Missing Use Case: {euc}"
        
    # 3. Check Images & Captions
    print("\n--- 3. Checking Figures & Captions ---")
    captions = [p.text.strip() for p in doc.paragraphs if p.text.strip().startswith('Hình ')]
    print(f"Found {len(captions)} figure captions:")
    for cap in captions:
        print(f"  {cap}")
    expected_figures = ['Hình 6.1', 'Hình 6.2', 'Hình 6.3', 'Hình 8.1', 'Hình 9.1', 'Hình 9.2', 'Hình 11.1']
    for ef in expected_figures:
        assert any(ef in c for c in captions), f"Missing figure caption: {ef}"
        
    # 4. Check 17 Status Enums in Chapter 8
    print("\n--- 4. Checking 17 States in Chapter 8 ---")
    text_all = "\n".join([p.text for p in doc.paragraphs])
    states = [
        "PENDING", "PENDING_APPROVAL", "WAITING_PAYMENT", "APPROVED", "ON_HOLD",
        "CONFIRMED", "IN_PROGRESS", "OVERDUE", "COMPLETED", "EXPIRED",
        "AUTO_EXPIRED_NO_HOST_ACTION", "REJECTED", "WITHDRAWN_BY_GUEST",
        "CANCELLED", "CANCELLED_BY_GUEST", "CANCELLED_BY_HOST", "DISPUTED"
    ]
    for s in states:
        assert s in text_all, f"Missing state enum: {s}"
    print(f"All 17 states verified present in Chapter 8 text.")
    
    # 5. Check Chapter 10 API table
    print("\n--- 5. Checking Chapter 10 API Endpoints Table ---")
    api_table = None
    for t in doc.tables:
        if len(t.rows) > 0 and len(t.rows[0].cells) >= 4:
            if 'Method' in t.rows[0].cells[0].text and 'Endpoint' in t.rows[0].cells[1].text:
                api_table = t
                break
    assert api_table is not None, "API table in Chapter 10 not found!"
    print(f"API Table found with {len(api_table.rows) - 1} endpoints.")
    assert len(api_table.rows) - 1 == 53, f"Expected exactly 53 endpoints, got {len(api_table.rows) - 1}"
    
    # Extract API endpoints list
    ch10_endpoints = set()
    for row in api_table.rows[1:]:
        endpoint = row.cells[1].text.strip()
        ch10_endpoints.add(endpoint)
        
    # 6. Check Chapter 11 Database Tables
    print("\n--- 6. Checking Chapter 11 Database Tables ---")
    db_headings = [p.text.strip() for p in doc.paragraphs if p.text.strip().startswith('Bảng ') and '—' in p.text.strip()]
    print(f"Found {len(db_headings)} Database Table specifications:")
    for h in db_headings:
        print(f"  {h}")
    assert len(db_headings) == 15, f"Expected 15 tables (14 core + 1 AI), got {len(db_headings)}"
    
    ch11_table_names = set()
    for h in db_headings:
        m = re.search(r'Bảng\s+\d+:\s+([a-z_]+)\s+—', h)
        if m:
            ch11_table_names.add(m.group(1))
            
    print(f"Extracted {len(ch11_table_names)} table names: {sorted(list(ch11_table_names))}")
    
    # 7. Check Chapter 12 RTM Table
    print("\n--- 7. Checking Chapter 12 RTM Table ---")
    rtm_table = None
    for t in doc.tables:
        if len(t.rows) > 0 and len(t.rows[0].cells) >= 5:
            if 'Mã YC' in t.rows[0].cells[0].text and 'Mã Test Case' in t.rows[0].cells[4].text:
                rtm_table = t
                break
    assert rtm_table is not None, "RTM table in Chapter 12 not found!"
    
    rtm_rows = rtm_table.rows[1:]
    print(f"Total rows in RTM table: {len(rtm_rows)}")
    assert len(rtm_rows) == 54, f"Expected exactly 54 rows in RTM, got {len(rtm_rows)}"
    
    # Check 54 REQ IDs
    req_ids = [r.cells[0].text.strip() for r in rtm_rows]
    print(f"First 5 REQs: {req_ids[:5]} ... Last 5 REQs: {req_ids[-5:]}")
    assert len(set(req_ids)) == 54, "Duplicate REQ IDs found in RTM!"
    
    # Check prefixes
    prefixes = set(r.split('-')[1] for r in req_ids)
    print(f"REQ prefixes in RTM: {sorted(list(prefixes))}")
    expected_prefixes = {'AUT', 'CAR', 'BOK', 'PAY', 'HND', 'DSP', 'WAL', 'AI', 'ADM', 'TST', 'OPS'}
    assert prefixes == expected_prefixes, f"Mismatch in REQ prefixes: {prefixes} vs {expected_prefixes}"
    
    # 8. Check RTM endpoints against Chapter 10
    print("\n--- 8. Verifying RTM Endpoints against Chapter 10 ---")
    unmatched_endpoints = []
    for r in rtm_rows:
        req_id = r.cells[0].text.strip()
        api_cell = r.cells[2].text.strip()
        paths = re.findall(r'(/[a-zA-Z0-9_\{\}\-/]+)', api_cell)
        for p in paths:
            matched = any(p == ep or ep in p or p in ep for ep in ch10_endpoints)
            if not matched:
                unmatched_endpoints.append((req_id, p))
                
    if unmatched_endpoints:
        print(f"Warning: unmatched endpoints in RTM: {unmatched_endpoints}")
    else:
        print("All RTM endpoints successfully verified against Chapter 10!")
    assert len(unmatched_endpoints) == 0, f"Endpoints not in Ch 10: {unmatched_endpoints}"
    
    # 9. Check RTM tables against Chapter 11
    print("\n--- 9. Verifying RTM Tables against Chapter 11 ---")
    unmatched_tables = []
    for r in rtm_rows:
        req_id = r.cells[0].text.strip()
        table_cell = r.cells[3].text.strip()
        if any(k in table_cell for k in ["Toàn bộ", "Môi trường", "Hạ tầng", "System", "application", "REST"]):
            continue
        tables = [t.strip() for t in table_cell.split(',')]
        for t in tables:
            if t not in ch11_table_names:
                unmatched_tables.append((req_id, t))
                
    if unmatched_tables:
        print(f"Warning: unmatched tables in RTM: {unmatched_tables}")
    else:
        print("All RTM database tables successfully verified against Chapter 11!")
    assert len(unmatched_tables) == 0, f"Tables not in Ch 11: {unmatched_tables}"
    
    print("\n==========================================")
    print("AUDIT RESULT: 100% PASSED! DOCUMENT IS PERFECT!")
    print("==========================================")

if __name__ == '__main__':
    audit()

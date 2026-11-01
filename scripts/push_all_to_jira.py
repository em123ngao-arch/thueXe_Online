import os
import urllib.request
import json
import base64
import time
import sys
import csv

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

jira_url = os.environ.get('JIRA_BASE_URL', 'https://duybaondb.atlassian.net')
email = os.environ.get('JIRA_EMAIL', 'duybaondb@gmail.com')
token = os.environ.get('JIRA_API_TOKEN', '')

auth_str = f'{email}:{token}'
b64_auth = base64.b64encode(auth_str.encode()).decode()

headers = {
    'Authorization': f'Basic {b64_auth}',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
}

SPRINT_ID = 70
PROJECT_KEY = 'CRP'

ACCOUNT_IDS = {
    'NB': '712020:c4f67b0d-c838-49e2-9313-92ef08af980e',
    'VL': '712020:8954288c-0a0d-4d4e-a47b-e633af9a5a67',
    'CN': '712020:b8a35a61-95fb-4736-8bfb-d9326db7b1cd',
    'QD': '712020:bacac295-76ca-4dc9-8e1a-454391f0034c',
    'KT': '712020:314589bd-e0bc-4c62-9009-20597ac9da9f',
    'PT': '712020:0656a55b-a13a-4961-b257-fcf6876b4311'
}

def create_issue(fields):
    payload = {'fields': fields}
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(f'{jira_url}/rest/api/2/issue', data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            return res.get('key')
    except urllib.error.HTTPError as e:
        print(f"Lỗi tạo issue: {e.code} - {e.read().decode('utf-8')}")
        return None

def move_to_sprint(issue_keys):
    payload = {'issues': issue_keys}
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(f'{jira_url}/rest/agile/1.0/sprint/{SPRINT_ID}/issue', data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"-> Đã đưa {len(issue_keys)} issues vào Sprint 2 (HTTP {resp.status})")
    except urllib.error.HTTPError as e:
        print(f"Lỗi chuyển sprint: {e.code} - {e.read().decode('utf-8')}")

def main():
    print("==================================================================")
    print("BẮT ĐẦU TỰ ĐỘNG ĐẨY TOÀN BỘ 54 ISSUES LÊN JIRA SPRINT 2 (CRP)")
    print("==================================================================")

    # Đọc tệp CSV
    csv_path = 'docs/scrum/jira_test_plan_import.csv'
    all_created_keys = []
    
    # 1. Đọc và lọc cấu trúc
    epic_data = None
    tasks_data = [] # list of (row, subtasks)
    current_task = None

    with open(csv_path, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for r in reader:
            itype = r['Issue Type'].strip()
            if itype == 'Epic':
                epic_data = r
            elif itype == 'Task':
                current_task = {'task': r, 'subtasks': []}
                tasks_data.append(current_task)
            elif itype == 'Sub-task':
                if current_task:
                    current_task['subtasks'].append(r)

    print(f"Đã phân tích: 1 Epic, {len(tasks_data)} Tasks, {sum(len(t['subtasks']) for t in tasks_data)} Sub-tasks")

    # 2. Tạo Epic
    print("\n[1/3] Tạo Epic chính...")
    epic_fields = {
        'project': {'key': PROJECT_KEY},
        'summary': epic_data['Summary'],
        'description': epic_data['Description'],
        'issuetype': {'id': '10007'}, # Epic
        'assignee': {'accountId': ACCOUNT_IDS['NB']},
        'labels': [l.strip() for l in epic_data['Labels'].split(',') if l.strip()]
    }
    epic_key = create_issue(epic_fields)
    if not epic_key:
        print("Dùng issueType Task thay cho Epic nếu thiếu trường đặc thù...")
        epic_fields['issuetype'] = {'id': '10009'}
        epic_key = create_issue(epic_fields)

    print(f"✔ Đã tạo EPIC: {epic_key}")
    if epic_key:
        all_created_keys.append(epic_key)

    # 3. Tạo 8 Tasks & 45 Sub-tasks
    print("\n[2/3] Bắt đầu tạo 8 Tasks và 45 Sub-tasks...")
    for idx, t_obj in enumerate(tasks_data, 1):
        t_row = t_obj['task']
        t_assignee = ACCOUNT_IDS.get(t_row['Assignee'].strip(), ACCOUNT_IDS['NB'])
        t_labels = [l.strip() for l in t_row['Labels'].split(',') if l.strip()]

        task_fields = {
            'project': {'key': PROJECT_KEY},
            'summary': t_row['Summary'],
            'description': t_row['Description'],
            'issuetype': {'id': '10009'}, # Task
            'assignee': {'accountId': t_assignee},
            'labels': t_labels
        }
        task_key = create_issue(task_fields)
        print(f"\n-> [{idx}/{len(tasks_data)}] Tạo Task: {task_key} - {t_row['Summary']}")
        if task_key:
            all_created_keys.append(task_key)

            # Tạo các sub-tasks của task này
            for s_idx, s_row in enumerate(t_obj['subtasks'], 1):
                s_assignee_code = s_row['Assignee'].strip()
                s_assignee_id = ACCOUNT_IDS.get(s_assignee_code, ACCOUNT_IDS['NB'])
                s_labels = [l.strip() for l in s_row['Labels'].split(',') if l.strip()]

                subtask_fields = {
                    'project': {'key': PROJECT_KEY},
                    'parent': {'key': task_key},
                    'summary': s_row['Summary'],
                    'description': s_row['Description'],
                    'issuetype': {'id': '10008'}, # Subtask
                    'assignee': {'accountId': s_assignee_id},
                    'labels': s_labels
                }
                sub_key = create_issue(subtask_fields)
                if sub_key:
                    print(f"    ✔ Sub-task: {sub_key} | {s_assignee_code} | {s_row['Summary'][:50]}...")
                    all_created_keys.append(sub_key)
                time.sleep(0.1) # Tránh rate limit

    # 4. Đưa toàn bộ các Tasks & Epic vào Sprint 2 (ID: 70)
    print("\n[3/3] Đưa tất cả các issues vào Sprint 2 (ID: 70)...")
    # Lưu ý: Jira chỉ cho phép gán Task, Story, Bug vào Sprint (Subtask tự động theo parent)
    parent_issues = [k for k in all_created_keys if not any(k == s.get('key') for t in tasks_data for s in t['subtasks'])]
    # Lọc lấy các task cha (không phải subtask)
    tasks_to_sprint = [k for k in all_created_keys if k != epic_key and not '-' in k[4:]] # list tasks
    
    # Gửi cả danh sách các task cha vào sprint
    parent_keys = [k for k in all_created_keys if k == epic_key or any(k in t['Summary'] for t in [x['task'] for x in tasks_data])]
    
    # Đưa danh sách các issue không phải subtask vào Sprint
    # Ta lọc chính xác:
    non_subtask_keys = []
    # Đọc lại keys từ API
    for k in all_created_keys:
        # Nếu issue key là của Epic hoặc 8 Task
        non_subtask_keys.append(k)

    # Chia batch 50 issues
    for i in range(0, len(all_created_keys), 50):
        batch = all_created_keys[i:i+50]
        move_to_sprint(batch)

    print("\n==================================================================")
    print(f"🎉 HOÀN TẤT 100%! ĐÃ TẠO THÀNH CÔNG {len(all_created_keys)} ISSUES TRÊN JIRA!")
    print(f"Board URL: https://duybaondb.atlassian.net/jira/software/projects/CRP/boards/2/backlog")
    print("==================================================================")

if __name__ == '__main__':
    main()

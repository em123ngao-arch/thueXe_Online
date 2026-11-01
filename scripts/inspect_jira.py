import os
import urllib.request
import json
import base64
import sys

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

def api_get(endpoint):
    req = urllib.request.Request(f'{jira_url}{endpoint}', headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

# 1. Project CRP metadata
print("=== 1. PROJECT CRP METADATA ===")
project = api_get('/rest/api/3/project/CRP')
print(f"Project: {project.get('name')} (ID: {project.get('id')})")
print("Issue Types:")
for it in project.get('issueTypes', []):
    print(f"  - {it.get('name')} (ID: {it.get('id')}, Subtask: {it.get('subtask')})")

# 2. Board & Sprints
print("\n=== 2. BOARDS & SPRINTS ===")
boards = api_get('/rest/agile/1.0/board')
for b in boards.get('values', []):
    print(f"Board: {b.get('name')} (ID: {b.get('id')})")
    try:
        sprints = api_get(f"/rest/agile/1.0/board/{b.get('id')}/sprint")
        for s in sprints.get('values', []):
            print(f"   Sprint: {s.get('name')} (ID: {s.get('id')}, State: {s.get('state')})")
    except Exception as e:
        print(f"   Khong lay duoc sprint: {e}")

# 3. Users in Jira
print("\n=== 3. USERS IN JIRA ===")
users = api_get('/rest/api/3/users/search')
for u in users:
    if u.get('accountType') == 'atlassian':
        print(f"User: {u.get('displayName')} | Email: {u.get('emailAddress')} | AccountId: {u.get('accountId')}")

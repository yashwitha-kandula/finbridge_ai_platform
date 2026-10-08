import json, urllib.request, urllib.parse

API = "http://localhost:8000"

def call(method, path, body=None, token=None, form=False):
    data = None
    headers = {}
    if body is not None:
        if form:
            data = urllib.parse.urlencode(body).encode()
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            data = json.dumps(body).encode()
            headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(API + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

email, pw = "dash.test@finbridge.ai", "Test@1234"
s, r = call("POST", "/api/auth/register", {"email": email, "password": pw, "full_name": "Dash Test"})
if s != 200:
    s, r = call("POST", "/api/auth/login", {"username": email, "password": pw}, form=True)
tok = r["access_token"]

print("EMPTY:")
s, d = call("GET", "/api/dashboard", token=tok)
print(s, json.dumps({k: d[k] for k in ("has_data", "cards", "health", "insight", "goals", "bills")} if s == 200 else d)[:900])

print("SAMPLE:")
print(call("POST", "/api/dashboard/sample-data", {}, token=tok))
s, d = call("GET", "/api/dashboard", token=tok)
print(s)
if s == 200:
    print("cards", d["cards"])
    print("health", d["health"])
    print("trend", d["trend"])
    print("breakdown", d["breakdown"])
    print("goals", d["goals"])
    print("recent", d["recent"][:2])
    print("bills", d["bills"], d["due_soon"])
    print("insight", d["insight"])
else:
    print(d)
print("add goal", call("POST", "/api/dashboard/goals", {"goal_name": "Laptop", "target_amount": 90000, "current_amount": 10000}, token=tok))
print("add reminder", call("POST", "/api/dashboard/reminders", {"title": "Phone", "amount": 999, "due_date": "2030-01-01"}, token=tok))
print("remove", call("DELETE", "/api/dashboard/sample-data", token=tok))
s, d = call("GET", "/api/dashboard", token=tok)
print("after remove has_data:", d["has_data"], "goals:", [g["name"] for g in d["goals"]])

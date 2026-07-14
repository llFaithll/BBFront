import requests, json, uuid, sys

BASE = "https://bb-manager-pro.preview.emergentagent.com/api"
results = {"passed": [], "failed": []}

def rec(name, ok, detail=""):
    (results["passed"] if ok else results["failed"]).append(f"{name} :: {detail}")
    print(("PASS" if ok else "FAIL"), name, "-", detail)

s = requests.Session()

# 1. Login admin
r = s.post(f"{BASE}/auth/login", json={"email": "admin@bnb.it", "password": "admin123"})
rec("login admin", r.status_code == 200 and r.json().get("email") == "admin@bnb.it", f"{r.status_code} {r.text[:150]}")
admin_cookies = s.cookies.get_dict()
rec("auth cookies set", "access_token" in admin_cookies and "refresh_token" in admin_cookies, str(list(admin_cookies.keys())))

# 2. GET /auth/me
r = s.get(f"{BASE}/auth/me")
rec("auth/me with cookies", r.status_code == 200 and r.json().get("email") == "admin@bnb.it", f"{r.status_code}")

# 3. Unauthenticated request rejected
r2 = requests.get(f"{BASE}/auth/me")
rec("unauth returns 401", r2.status_code == 401, str(r2.status_code))

r2 = requests.get(f"{BASE}/bookings")
rec("bookings unauth 401", r2.status_code == 401, str(r2.status_code))

# 4. Register new user with unique email
uniq = f"user_{uuid.uuid4().hex[:8]}@test.it"
s2 = requests.Session()
r = s2.post(f"{BASE}/auth/register", json={"email": uniq, "password": "pass1234", "name": "Test User"})
rec("register new", r.status_code == 200 and r.json().get("email") == uniq, f"{r.status_code} {r.text[:120]}")

# Duplicate registration
r = requests.post(f"{BASE}/auth/register", json={"email": uniq, "password": "pass1234", "name": "Dup"})
rec("register duplicate 400", r.status_code == 400, f"{r.status_code} {r.text[:100]}")

# 5. Create booking Airbnb - verify net calculation
# gross 300, Airbnb 3% commission -> 291, then 21% cedolare -> 291*0.79 = 229.89
payload = {
    "guest_first_name": "Mario", "guest_last_name": "Rossi",
    "checkin": "2025-06-01", "checkout": "2025-06-04",
    "gross_price": 300.0, "channel": "Airbnb",
    "date_of_birth": "1985-05-10", "place_of_birth": "ROMA",
    "document_number": "AB1234567"
}
r = s.post(f"{BASE}/bookings", json=payload)
ok = r.status_code == 200
data = r.json() if ok else {}
booking_id = data.get("id")
expected_net = round(300 * 0.97 * 0.79, 2)  # 229.89
rec("create booking Airbnb", ok and data.get("nights") == 3 and abs(data.get("net_revenue", 0) - expected_net) < 0.01,
    f"nights={data.get('nights')} net={data.get('net_revenue')} expected={expected_net}")

# Booking channel
r = s.post(f"{BASE}/bookings", json={**payload, "channel": "Booking", "gross_price": 200.0, "checkin": "2025-07-01", "checkout": "2025-07-03"})
d = r.json() if r.status_code == 200 else {}
exp_b = round(200 * 0.85 * 0.79, 2)
rec("create booking Booking channel", r.status_code == 200 and abs(d.get("net_revenue", 0) - exp_b) < 0.01, f"net={d.get('net_revenue')} exp={exp_b}")

# Direct
r = s.post(f"{BASE}/bookings", json={**payload, "channel": "Direct", "gross_price": 100.0, "checkin": "2025-08-01", "checkout": "2025-08-02"})
d = r.json() if r.status_code == 200 else {}
exp_d = round(100 * 1.0 * 0.79, 2)
rec("create booking Direct", r.status_code == 200 and abs(d.get("net_revenue", 0) - exp_d) < 0.01, f"net={d.get('net_revenue')} exp={exp_d}")

# GET list
r = s.get(f"{BASE}/bookings")
rec("list bookings", r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) >= 3, f"{r.status_code} n={len(r.json()) if r.status_code==200 else '?'}")

# PUT
if booking_id:
    r = s.put(f"{BASE}/bookings/{booking_id}", json={**payload, "gross_price": 400.0})
    rec("update booking", r.status_code == 200 and r.json().get("gross_price") == 400.0, f"{r.status_code}")

# 6. Dashboard stats
r = s.get(f"{BASE}/dashboard/stats")
ok = r.status_code == 200
d = r.json() if ok else {}
rec("dashboard stats", ok and all(k in d for k in ["total_gross","total_net","year_gross","occupancy_pct","channels","monthly"]),
    f"keys={list(d.keys())[:6] if ok else r.status_code}")

# 7. Inventory
r = s.post(f"{BASE}/inventory", json={"name": "Asciugamani", "category": "Biancheria", "quantity": 2, "unit": "pz", "min_threshold": 5})
inv_id = r.json().get("id") if r.status_code == 200 else None
rec("create inventory", r.status_code == 200 and inv_id, f"{r.status_code}")

r = s.get(f"{BASE}/inventory")
rec("list inventory", r.status_code == 200 and any(i["name"]=="Asciugamani" for i in r.json()), f"{r.status_code}")

if inv_id:
    r = s.put(f"{BASE}/inventory/{inv_id}", json={"name": "Asciugamani", "category": "Biancheria", "quantity": 10, "unit": "pz", "min_threshold": 5})
    rec("update inventory", r.status_code == 200, f"{r.status_code}")
    r = s.delete(f"{BASE}/inventory/{inv_id}")
    rec("delete inventory", r.status_code == 200, f"{r.status_code}")

# 8. Expenses
r = s.post(f"{BASE}/expenses", json={"name": "IMU", "category": "IMU", "amount": 500.0, "due_date": "2025-06-16", "recurrence": "yearly"})
exp_id = r.json().get("id") if r.status_code == 200 else None
rec("create expense", r.status_code == 200 and exp_id, f"{r.status_code}")

if exp_id:
    r = s.put(f"{BASE}/expenses/{exp_id}", json={"name": "IMU", "category": "IMU", "amount": 500.0, "due_date": "2025-06-16", "recurrence": "yearly", "paid": True})
    rec("toggle expense paid", r.status_code == 200, f"{r.status_code}")

# 9. Pricing AI (real Claude call)
r = s.post(f"{BASE}/pricing/suggest", json={"checkin": "2025-08-15", "checkout": "2025-08-18", "location": "Roma", "base_price": 90.0})
ok = r.status_code == 200
d = r.json() if ok else {}
has_fields = all(k in d for k in ["suggested_price", "min_price", "max_price", "reasoning", "nights", "total_suggested"])
valid_price = isinstance(d.get("suggested_price"), (int, float)) and d.get("suggested_price") > 0
rec("pricing AI (Claude)", ok and has_fields and valid_price and d.get("nights") == 3,
    f"status={r.status_code} price={d.get('suggested_price')} nights={d.get('nights')} reasoning_len={len(str(d.get('reasoning','')))}")

# 10. Alloggiati preview/export
r = s.get(f"{BASE}/alloggiati/preview", params={"start_date": "2025-01-01", "end_date": "2025-12-31"})
ok = r.status_code == 200 and "records" in r.json()
rec("alloggiati preview", ok, f"{r.status_code} total={r.json().get('total') if ok else '?'}")

r = s.get(f"{BASE}/alloggiati/export", params={"start_date": "2025-01-01", "end_date": "2025-12-31"})
ct = r.headers.get("content-type", "")
cd = r.headers.get("content-disposition", "")
rec("alloggiati export", r.status_code == 200 and "text/plain" in ct and "attachment" in cd,
    f"status={r.status_code} ct={ct} cd={cd[:60]}")

# 11. iCal invalid URL -> 400
r = s.post(f"{BASE}/bookings/ical-import", json={"url": "https://invalid.example.invalid/nope.ics", "channel": "Airbnb"})
rec("ical invalid URL 400", r.status_code == 400, f"{r.status_code} {r.text[:100]}")

# Cleanup: delete created bookings
for b in s.get(f"{BASE}/bookings").json():
    if b.get("guest_first_name") == "Mario":
        s.delete(f"{BASE}/bookings/{b['id']}")
if exp_id: s.delete(f"{BASE}/expenses/{exp_id}")

print("\n=== SUMMARY ===")
print(f"Passed: {len(results['passed'])}")
print(f"Failed: {len(results['failed'])}")
for f in results["failed"]:
    print("  FAIL:", f)
sys.exit(0 if not results["failed"] else 1)

# Auth Testing Playbook

Admin: `admin@bnb.it` / `admin123` (DB: `bnb_manager`)

## API Testing
```bash
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bnb.it","password":"admin123"}'
curl -b cookies.txt http://localhost:8001/api/auth/me
```

Login should return user object and set `access_token` + `refresh_token` httpOnly cookies.

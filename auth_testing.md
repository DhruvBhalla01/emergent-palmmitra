# Auth-Gated Testing Playbook

## Session Setup
```
mongosh --eval "
use('test_database');
var userId = 'user_' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.' + Date.now() + '@example.com',
  name: 'Test User',
  auth_provider: 'google',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print(sessionToken);
"
```

## Backend Check
- `GET /api/auth/me` with `Authorization: Bearer <token>` returns user (200)

## Browser
- Set cookie `session_token` (path=/, httpOnly, secure, sameSite=None)

## Checklist
- User has `user_id` (UUID). All queries project `{"_id": 0}`.
- Session expiry is timezone-aware (UTC).

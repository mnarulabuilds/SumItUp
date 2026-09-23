# Legacy Node.js unit tests (archived)

These `*.test.js` files under `tests/unit/` target the old Express backend. The API is now **Python (FastAPI)**; active tests are `*.py` and run via:

```bash
npm run test:unit --prefix backend
```

Do not run the JavaScript tests unless you are porting or deleting legacy coverage. They are kept for reference during migration cleanup.

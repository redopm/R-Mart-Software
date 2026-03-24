from fastapi.testclient import TestClient
from main import app
client = TestClient(app)
r = client.post('/api/sales/', headers={'Authorization': 'Bearer asd'}, json={'items':[], 'payment_mode': 'CASH', 'sale_type': 'RETAIL'})
print(r.json())

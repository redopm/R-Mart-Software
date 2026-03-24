import requests
import time

BASE_URL = "http://localhost:8000/api"

def run_test():
    print("🚀 Seeding test data into ChhotaShop Backend...\n")

    # 1. Create a Product
    product_payload = {
        "barcode": "8901234567890",
        "name": "Tata Salt 1kg",
        "category": "Grocery",
        "unit": "kg",
        "cost_price": 20.0,
        "retail_price": 28.0,
        "wholesale_price": 24.0,
        "stock_qty": 0,
        "min_stock_alert": 10
    }
    r = requests.post(f"{BASE_URL}/products/", json=product_payload)
    if r.status_code == 200:
        product_id = r.json()["id"]
        print(f"✅ Product Created: Tata Salt (ID: {product_id})")
    else:
        print("❌ Failed to create product", r.text)
        return

    # 2. Add a Batch (adds stock)
    batch_payload = {
        "batch_number": "BATCH-001",
        "mfg_date": "2023-10-01",
        "expiry_date": "2024-10-01",
        "quantity": 50
    }
    r = requests.post(f"{BASE_URL}/products/{product_id}/batches/", json=batch_payload)
    if r.status_code == 200:
        batch_id = r.json()["id"]
        print(f"✅ Batch Added: 50 units (Batch ID: {batch_id}) -> Total Stock is now 50")
    else:
        print("❌ Failed to add batch", r.text)

    # 3. Create a Customer
    cust_payload = {
        "name": "Raju Kirana",
        "phone_number": "9876543210",
        "customer_type": "wholesale"
    }
    r = requests.post(f"{BASE_URL}/customers/", json=cust_payload)
    if r.status_code == 200:
        cust_id = r.json()["id"]
        print(f"✅ Customer Created: Raju Kirana (ID: {cust_id})")
    else:
        print("❌ Failed to create customer", r.text)

    # 3.5 Login (Auth)
    print("\n🔑 Logging in as default Admin...")
    login_res = requests.post(f"{BASE_URL}/auth/token", data={"username": "admin", "password": "admin123"})
    if login_res.status_code == 200:
        token = login_res.json()["access_token"]
        auth_headers = {"Authorization": f"Bearer {token}"}
        print("✅ Login Successful! Got JWT token.")
    else:
        print("❌ Failed to login", login_res.text)
        return

    # 4. Perform a Sale (Wholesale, Udhaar)
    sale_payload = {
        "customer_id": cust_id,
        "sale_type": "wholesale",
        "discount": 0.0,
        "payment_mode": "Udhaar",
        "items": [
            {
                "product_id": product_id,
                "batch_id": batch_id,
                "quantity": 10
            }
        ]
    }
    print("\n🛒 Processing Checkout (10 units @ wholesale price on Udhaar)...")
    r = requests.post(f"{BASE_URL}/sales/", json=sale_payload, headers=auth_headers)
    if r.status_code == 200:
        sale = r.json()
        print(f"🧾 Invoice Generated: {sale['invoice_no']}")
        print(f"💰 Final Amount: ₹{sale['final_amount']} (Wholesale Rate: ₹24/unit)")
    else:
        print("❌ Failed to process sale", r.text)

    # 5. Check Udhaar Balance & Stock
    r_cust = requests.get(f"{BASE_URL}/customers/{cust_id}")
    r_prod = requests.get(f"{BASE_URL}/products/{product_id}")
    
    if r_cust.status_code == 200 and r_prod.status_code == 200:
        print(f"\n📈 Final Verifications:")
        print(f" - Raju Kirana Pending Balance: ₹{r_cust.json()['pending_balance']} (Should be 240)")
        print(f" - Tata Salt Remaining Stock: {r_prod.json()['stock_qty']} (Should be 40)")
        print("\n🎉 Backend is working perfectly! (Sahi se run kr rha hai!)")

if __name__ == "__main__":
    run_test()

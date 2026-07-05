import urllib.request
import urllib.parse
import json
import os
import uuid

def test_all_endpoints():
    print("====================================================")
    print("[START] STARTING INTEGRATION TESTS FOR STRESS RISK APP")
    print("====================================================")
    
    base_url = "http://localhost:8000"
    
    # 1. Test Signup
    print("\n1. Testing Signup...")
    signup_url = f"{base_url}/api/auth/signup"
    unique_username = f"testuser_{uuid.uuid4().hex[:6]}"
    signup_payload = {
        "username": unique_username,
        "email": f"{unique_username}@corporate.com",
        "password": "SecurePassword123"
    }
    
    try:
        req_signup = urllib.request.Request(
            signup_url,
            data=json.dumps(signup_payload).encode('utf-8'),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        res_signup = urllib.request.urlopen(req_signup).read().decode()
        signup_data = json.loads(res_signup)
        token = signup_data.get("token")
        print(f"Signup Success! Created User: {signup_data.get('username')}")
    except Exception as e:
        print(f"[FAIL] Signup Failed: {e}")
        return

    # 2. Test Login
    print("\n2. Testing Login...")
    login_url = f"{base_url}/api/auth/login"
    login_payload = {
        "username_or_email": unique_username,
        "password": "SecurePassword123"
    }
    
    try:
        req_login = urllib.request.Request(
            login_url,
            data=json.dumps(login_payload).encode('utf-8'),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        res_login = urllib.request.urlopen(req_login).read().decode()
        login_data = json.loads(res_login)
        token = login_data.get("token")
        print("Login Success!")
    except Exception as e:
        print(f"[FAIL] Login Failed: {e}")
        return

    # 3. Test GET /me (Auth Protected Route)
    print("\n3. Testing Auth Context (/me)...")
    me_url = f"{base_url}/api/auth/me"
    
    try:
        req_me = urllib.request.Request(
            me_url,
            headers={"Authorization": f"Bearer {token}"},
            method="GET"
        )
        res_me = urllib.request.urlopen(req_me).read().decode()
        me_data = json.loads(res_me)
        print(f"Auth Context Verified: ID={me_data.get('id')}, Email={me_data.get('email')}")
    except Exception as e:
        print(f"[FAIL] /me Verification Failed: {e}")
        return

    # 4. Test Upload Dataset
    print("\n4. Testing CSV Dataset Upload...")
    upload_url = f"{base_url}/api/upload"
    
    # Path to sample raw data in the data folder
    sample_file_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "data",
        "raw_burnout_data.csv"
    )
    
    if not os.path.exists(sample_file_path):
        print(f"[FAIL] Sample dataset missing at {sample_file_path}. Please run data/fetch_dataset.py first.")
        return
        
    try:
        with open(sample_file_path, 'rb') as f:
            file_bytes = f.read()
            
        boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
        body = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="file"; filename="raw_burnout_data.csv"\r\n'
            f"Content-Type: text/csv\r\n\r\n"
            f"{file_bytes.decode('utf-8')}\r\n"
            f"--{boundary}--\r\n"
        ).encode('utf-8')
        
        req_upload = urllib.request.Request(
            upload_url,
            data=body,
            headers={
                "Content-Type": f"multipart/form-data; boundary={boundary}",
                "Authorization": f"Bearer {token}"
            },
            method="POST"
        )
        
        res_upload = urllib.request.urlopen(req_upload).read().decode()
        upload_data = json.loads(res_upload)
        dataset_id = upload_data.get("dataset_id")
        print(f"Upload Success! Saved Dataset ID: {dataset_id}")
        print(f"Rows: {upload_data.get('row_count')}, Cols: {upload_data.get('col_count')}")
    except Exception as e:
        print(f"[FAIL] Upload Failed: {e}")
        return

    # 5. Test Analyze
    print("\n5. Testing Analysis Pipeline...")
    analyze_url = f"{base_url}/api/analyze?dataset_id={dataset_id}"
    
    try:
        req_analyze = urllib.request.Request(
            analyze_url,
            headers={"Authorization": f"Bearer {token}"},
            method="POST"
        )
        res_analyze = urllib.request.urlopen(req_analyze).read().decode()
        analyze_data = json.loads(res_analyze)
        summary = analyze_data.get("summary")
        print("Analysis Successful!")
        print(f"Model selected: {summary.get('model_name')}, Accuracy: {summary.get('accuracy')}")
        print(f"Team average stress score: {summary.get('average_score')}%")
    except Exception as e:
        print(f"[FAIL] Analysis Failed: {e}")
        return

    # 6. Test Dashboard
    print("\n6. Testing Dashboard KPIs...")
    dash_url = f"{base_url}/api/dashboard?dataset_id={dataset_id}"
    try:
        req_dash = urllib.request.Request(
            dash_url,
            headers={"Authorization": f"Bearer {token}"},
            method="GET"
        )
        res_dash = urllib.request.urlopen(req_dash).read().decode()
        dash_data = json.loads(res_dash)
        print(f"Dashboard Stats Loaded: Overall stress risk percentage = {dash_data.get('overall_stress_risk_pct')}%")
    except Exception as e:
        print(f"[FAIL] Dashboard Failed: {e}")
        return

    # 7. Test Reports summary & downloads
    print("\n7. Testing Reports and Downloads...")
    report_url = f"{base_url}/api/report?dataset_id={dataset_id}"
    excel_url = f"{base_url}/api/report/download/excel?dataset_id={dataset_id}"
    csv_url = f"{base_url}/api/report/download/csv?dataset_id={dataset_id}"
    
    try:
        req_rep = urllib.request.Request(
            report_url,
            headers={"Authorization": f"Bearer {token}"},
            method="GET"
        )
        res_rep = urllib.request.urlopen(req_rep).read().decode()
        rep_data = json.loads(res_rep)
        print(f"Report Brief Loaded: High Risk Count={rep_data.get('high_risk_count')}")
        
        # Test Excel File Response
        req_excel = urllib.request.Request(excel_url, headers={"Authorization": f"Bearer {token}"}, method="GET")
        res_excel = urllib.request.urlopen(req_excel)
        print(f"Excel download successfully triggered: content-length={res_excel.getheader('Content-Length')} bytes")
        
        # Test CSV File Response
        req_csv = urllib.request.Request(csv_url, headers={"Authorization": f"Bearer {token}"}, method="GET")
        res_csv = urllib.request.urlopen(req_csv)
        print(f"CSV download successfully triggered: content-length={res_csv.getheader('Content-Length')} bytes")
        
    except Exception as e:
        print(f"[FAIL] Reports/Downloads Failed: {e}")
        return

    # 8. Test History
    print("\n8. Testing Analysis History & Deletion...")
    history_url = f"{base_url}/api/history"
    try:
        req_hist = urllib.request.Request(
            history_url,
            headers={"Authorization": f"Bearer {token}"},
            method="GET"
        )
        res_hist = urllib.request.urlopen(req_hist).read().decode()
        hist_data = json.loads(res_hist)
        print(f"History list fetched: found {len(hist_data)} runs")
        
        # Delete history item
        del_url = f"{base_url}/api/history/{dataset_id}"
        req_del = urllib.request.Request(
            del_url,
            headers={"Authorization": f"Bearer {token}"},
            method="DELETE"
        )
        res_del = urllib.request.urlopen(req_del).read().decode()
        print(f"Deleted run: {json.loads(res_del).get('message')}")
        
    except Exception as e:
        print(f"[FAIL] History Failed: {e}")
        return

    print("\n====================================================")
    print("[SUCCESS] ALL ENDPOINT TESTS PASSED SUCCESSFULLY!")
    print("====================================================")

if __name__ == "__main__":
    test_all_endpoints()

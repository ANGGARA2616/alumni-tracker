import requests
import time

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_update_alumni_opt_out_status_with_manual_verification_flow():
    alumni_id = None
    try:
        # Step 1: Create alumni with title containing 'MARGINAL'
        create_payload = {
            "name": "John MARGINAL Doe",
            "year_in": 2010,
            "year_out": 2014,
            "program": "Computer Science",
            "title": "MARGINAL Researcher"
        }
        create_resp = requests.post(f"{BASE_URL}/api/alumni/", json=create_payload, timeout=TIMEOUT)
        assert create_resp.status_code == 201, f"Failed to create alumni: {create_resp.text}"
        alumni = create_resp.json()
        alumni_id = alumni.get("id")
        assert alumni_id is not None, "Created alumni has no id"

        # Step 2: Trigger tracking to get status 'Perlu Verifikasi Manual'
        trigger_resp = requests.post(f"{BASE_URL}/api/trigger_tracking/{alumni_id}", timeout=TIMEOUT)
        assert trigger_resp.status_code == 200, f"Trigger tracking failed: {trigger_resp.text}"
        trigger_result = trigger_resp.json()
        assert trigger_result.get("status") == "Perlu Verifikasi Manual", f"Unexpected tracking status: {trigger_result.get('status')}"

        # Step 3: Fetch tracking results, ensure array is not empty
        results_resp = requests.get(f"{BASE_URL}/api/alumni/{alumni_id}/results", timeout=TIMEOUT)
        assert results_resp.status_code == 200, f"Fetch results failed: {results_resp.text}"
        results = results_resp.json()
        assert isinstance(results, list), "Results is not a list"
        assert len(results) > 0, "Results array is empty"

        # Step 4: Send verification status update 'Kemungkinan Kuat'
        status_payload = {"status": "Kemungkinan Kuat"}
        status_resp = requests.put(f"{BASE_URL}/api/alumni/{alumni_id}/status", json=status_payload, timeout=TIMEOUT)
        assert status_resp.status_code == 200, f"Failed to update alumni status: {status_resp.text}"

        # Step 5: Verify the status was updated in the alumni record
        fetch_alumni_resp = requests.get(f"{BASE_URL}/api/alumni/", timeout=TIMEOUT)
        assert fetch_alumni_resp.status_code == 200, f"Fetch alumni list failed: {fetch_alumni_resp.text}"
        alumni_list = fetch_alumni_resp.json()
        updated_alumni = next((a for a in alumni_list if a.get("id") == alumni_id), None)
        assert updated_alumni is not None, "Updated alumni not found in list"
        assert updated_alumni.get("status") == "Kemungkinan Kuat", f"Alumni status was not updated, current status: {updated_alumni.get('status')}"

    finally:
        # Clean up: delete the created alumni record
        if alumni_id:
            try:
                requests.delete(f"{BASE_URL}/api/alumni/{alumni_id}", timeout=TIMEOUT)
            except Exception:
                pass


test_update_alumni_opt_out_status_with_manual_verification_flow()
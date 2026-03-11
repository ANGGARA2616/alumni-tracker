import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_trigger_manual_verification_flow():
    created_alumni_id = None
    
    try:
        # Create a new alumni with title containing 'MARGINAL'
        alumni_payload = {
            "name": "Test Alumni MARGINAL",
            "year_in": 2010,
            "year_out": 2014,
            "program": "Teknik Informatika"
        }
        create_resp = requests.post(f"{BASE_URL}/api/alumni/", json=alumni_payload, timeout=TIMEOUT)
        assert create_resp.status_code == 201, f"Failed to create alumni, got {create_resp.status_code}"
        created_alumni = create_resp.json()
        created_alumni_id = created_alumni.get("id")
        assert created_alumni_id is not None, "Created alumni ID missing"

        # Trigger tracking for that alumni to get status 'Perlu Verifikasi Manual'
        trigger_resp = requests.post(f"{BASE_URL}/api/trigger_tracking/{created_alumni_id}", timeout=TIMEOUT)
        assert trigger_resp.status_code == 200, f"Trigger tracking failed with status {trigger_resp.status_code}"
        trigger_data = trigger_resp.json()
        assert trigger_data.get("status") == "Perlu Verifikasi Manual", f"Expected status 'Perlu Verifikasi Manual', got '{trigger_data.get('status')}'"

        # Fetch results with GET /api/alumni/{id}/results, expect non-empty array
        results_resp = requests.get(f"{BASE_URL}/api/alumni/{created_alumni_id}/results", timeout=TIMEOUT)
        assert results_resp.status_code == 200, f"Fetching results failed with status {results_resp.status_code}"
        results = results_resp.json()
        assert isinstance(results, list), "Results response is not a list"
        assert len(results) > 0, "Results array is empty"

        # PUT /api/alumni/{id}/status with status 'Kemungkinan Kuat'
        status_payload = {"status": "Kemungkinan Kuat"}
        status_resp = requests.put(f"{BASE_URL}/api/alumni/{created_alumni_id}/status", json=status_payload, timeout=TIMEOUT)
        assert status_resp.status_code == 200, f"Updating status failed with status {status_resp.status_code}"
        updated_alumni = status_resp.json()
        # Verify status updated in database to 'Kemungkinan Kuat'
        assert updated_alumni.get("status") == "Kemungkinan Kuat", f"Expected status 'Kemungkinan Kuat', got '{updated_alumni.get('status')}'"

    finally:
        # Cleanup: Delete created alumni if exists
        if created_alumni_id:
            requests.delete(f"{BASE_URL}/api/alumni/{created_alumni_id}", timeout=TIMEOUT)

test_trigger_manual_verification_flow()
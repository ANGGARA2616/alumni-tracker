import requests
import time

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_trigger_tracking_for_single_alumni():
    alumni_id = None
    try:
        # Step 1: Create new alumni with title containing 'MARGINAL'
        alumni_payload = {
            "name": "Test Alumni MARGINAL",
            "year_in": 2010,
            "year_out": 2014,
            "program": "Computer Science",
            "title": "Senior Researcher MARGINAL"
        }
        create_resp = requests.post(f"{BASE_URL}/api/alumni/", json=alumni_payload, timeout=TIMEOUT)
        assert create_resp.status_code == 201, f"Failed to create alumni: {create_resp.text}"
        alumni = create_resp.json()
        alumni_id = alumni.get("id")
        assert alumni_id, "Alumni ID not found in creation response"

        # Step 2: Trigger tracking for this alumni
        trigger_resp = requests.post(f"{BASE_URL}/api/trigger_tracking/{alumni_id}", timeout=TIMEOUT)
        assert trigger_resp.status_code == 200, f"Trigger tracking failed: {trigger_resp.text}"
        tracking_result = trigger_resp.json()
        # Check that status is 'Perlu Verifikasi Manual'
        status = tracking_result.get("status")
        assert status == "Perlu Verifikasi Manual", f"Unexpected tracking status: {status}"

        # Step 3: Fetch tracking results via GET /api/alumni/{id}/results
        results_resp = requests.get(f"{BASE_URL}/api/alumni/{alumni_id}/results", timeout=TIMEOUT)
        assert results_resp.status_code == 200, f"Failed to fetch tracking results: {results_resp.text}"
        results_data = results_resp.json()
        assert isinstance(results_data, list), f"Results data is not a list: {results_data}"
        assert len(results_data) > 0, "Tracking results array is empty"

        # Step 4: Send verification with PUT /api/alumni/{id}/status with JSON status 'Kemungkinan Kuat'
        status_payload = {"status": "Kemungkinan Kuat"}
        status_resp = requests.put(f"{BASE_URL}/api/alumni/{alumni_id}/status", json=status_payload, timeout=TIMEOUT)
        assert status_resp.status_code == 200, f"Failed to update alumni status: {status_resp.text}"
        updated_alumni = status_resp.json()
        assert updated_alumni.get("status") == "Kemungkinan Kuat", f"Alumni status not updated correctly, got: {updated_alumni.get('status')}"

    finally:
        # Cleanup: Delete the created alumni
        if alumni_id:
            try:
                del_resp = requests.delete(f"{BASE_URL}/api/alumni/{alumni_id}", timeout=TIMEOUT)
                # deletion may not return 200 always, just ignore failures here
            except Exception:
                pass

test_trigger_tracking_for_single_alumni()
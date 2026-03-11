import requests
import time

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_create_new_alumni_record_and_manual_verification_flow():
    alumni_payload = {
        "name": "Test Alumni MARGINAL",
        "year_in": 2010,
        "year_out": 2014,
        "program": "Computer Science",
        "title": "MARGINAL Analyst",
        "email": "test_marginal@example.com"
    }
    headers = {
        "Content-Type": "application/json"
    }

    alumni_id = None
    try:
        # Create new alumni with title containing 'MARGINAL'
        response = requests.post(f"{BASE_URL}/api/alumni/", json=alumni_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 201, f"Expected 201 Created, got {response.status_code}"
        alumni_data = response.json()
        alumni_id = alumni_data.get("id")
        assert alumni_id is not None, "Response JSON did not contain 'id'"

        # Trigger manual tracking for this alumni
        trigger_resp = requests.post(f"{BASE_URL}/api/trigger_tracking/{alumni_id}", timeout=TIMEOUT)
        assert trigger_resp.status_code == 200, f"Trigger tracking failed with status {trigger_resp.status_code}"
        trigger_data = trigger_resp.json()
        status = trigger_data.get("status") or trigger_data.get("tracking_result", {}).get("status") or trigger_data.get("tracking_result.status")
        # Accept possible nested status fields; fail if none found
        if not status:
            status = trigger_data.get("status")
        assert status == "Perlu Verifikasi Manual", f"Expected status 'Perlu Verifikasi Manual', got '{status}'"

        # Fetch tracking results to ensure array not empty
        results_resp = requests.get(f"{BASE_URL}/api/alumni/{alumni_id}/results", timeout=TIMEOUT)
        assert results_resp.status_code == 200, f"Fetching results failed with status {results_resp.status_code}"
        results = results_resp.json()
        assert isinstance(results, list), f"Results expected to be list, got {type(results)}"
        assert len(results) > 0, "Results array is empty, expected non-empty"

        # Send verification status update with PUT /api/alumni/{id}/status
        verify_payload = {"status": "Kemungkinan Kuat"}
        verify_resp = requests.put(f"{BASE_URL}/api/alumni/{alumni_id}/status", json=verify_payload, headers=headers, timeout=TIMEOUT)
        assert verify_resp.status_code == 200, f"Status update failed with status {verify_resp.status_code}"
        updated_data = verify_resp.json()
        updated_status = updated_data.get("status")
        assert updated_status == "Kemungkinan Kuat", f"Expected updated status 'Kemungkinan Kuat', got '{updated_status}'"

        # Optional: re-fetch alumni to verify status persisted
        refetch_resp = requests.get(f"{BASE_URL}/api/alumni/", timeout=TIMEOUT)
        assert refetch_resp.status_code == 200
        alumni_list = refetch_resp.json()
        matching = [a for a in alumni_list if a.get("id") == alumni_id]
        assert matching, f"Alumni with id {alumni_id} not found in alumni list"
        assert matching[0].get("status") == "Kemungkinan Kuat", f"Status in alumni list not updated, found '{matching[0].get('status')}'"

    finally:
        if alumni_id:
            # Clean up by deleting the created alumni - assume DELETE /api/alumni/{id} endpoint is available
            # If not provided, this cleanup step is skipped
            try:
                requests.delete(f"{BASE_URL}/api/alumni/{alumni_id}", timeout=TIMEOUT)
            except Exception:
                pass

test_create_new_alumni_record_and_manual_verification_flow()
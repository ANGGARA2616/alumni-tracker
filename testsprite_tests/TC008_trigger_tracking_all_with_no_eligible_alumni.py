import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30


def test_trigger_tracking_all_with_no_eligible_alumni():
    alumnus_id = None

    try:
        # Step 1: Create new alumni record with title containing 'MARGINAL'
        create_payload = {
            "name": "Test Alumni MARGINAL",
            "year_in": 2010,
            "year_out": 2014,
            "program": "Teknik Informatika",
            "title": "MARGINAL Position",
        }
        resp_create = requests.post(f"{BASE_URL}/api/alumni/", json=create_payload, timeout=TIMEOUT)
        assert resp_create.status_code == 201, f"Failed to create alumni, status: {resp_create.status_code}"
        alumnus = resp_create.json()
        alumnus_id = alumnus.get("id")
        assert alumnus_id is not None, "Alumni ID is missing in create response"
        # Step 2: Trigger tracking for this alumni to set status 'Perlu Verifikasi Manual'
        resp_trigger = requests.post(f"{BASE_URL}/api/trigger_tracking/{alumnus_id}", timeout=TIMEOUT)
        assert resp_trigger.status_code == 200, f"Trigger tracking failed with status {resp_trigger.status_code}"
        trigger_data = resp_trigger.json()
        # Expect status "Perlu Verifikasi Manual"
        assert trigger_data.get("status") == "Perlu Verifikasi Manual", f"Unexpected status: {trigger_data.get('status')}"

        # Step 3: Fetch tracking results via GET /api/alumni/{id}/results
        resp_results = requests.get(f"{BASE_URL}/api/alumni/{alumnus_id}/results", timeout=TIMEOUT)
        assert resp_results.status_code == 200, f"Failed to fetch results with status {resp_results.status_code}"
        results_json = resp_results.json()
        assert isinstance(results_json, list), "Results should be a list"
        assert len(results_json) > 0, "Results array is empty, expected some tracking entries"

        # Step 4: Send verification status update PUT /api/alumni/{id}/status with status 'Kemungkinan Kuat'
        status_payload = {"status": "Kemungkinan Kuat"}
        resp_status = requests.put(f"{BASE_URL}/api/alumni/{alumnus_id}/status", json=status_payload, timeout=TIMEOUT)
        assert resp_status.status_code == 200, f"Failed to update alumni status, status code: {resp_status.status_code}"
        updated_alumni = resp_status.json()
        assert updated_alumni.get("status") == "Kemungkinan Kuat", "Alumni status not updated correctly"

    finally:
        # Cleanup: Delete alumni if created
        if alumnus_id:
            requests.delete(f"{BASE_URL}/api/alumni/{alumnus_id}", timeout=TIMEOUT)


test_trigger_tracking_all_with_no_eligible_alumni()
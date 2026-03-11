import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30


def test_list_all_alumni_records():
    headers = {"Content-Type": "application/json"}
    alumni_id = None

    try:
        # Step 1: Create alumni with title containing 'MARGINAL'
        create_payload = {
            "name": "Test Alumni MARGINAL",
            "title": "Researcher MARGINAL Field",
            "year_in": 2010,
            "year_out": 2014,
            "program": "Computer Science"
        }
        create_resp = requests.post(
            f"{BASE_URL}/api/alumni/",
            json=create_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert create_resp.status_code == 201, f"Failed to create alumni: {create_resp.text}"
        alumni = create_resp.json()
        alumni_id = alumni.get("id")
        assert alumni_id is not None, "Created alumni ID is missing"

        # Step 2: Trigger manual tracking for this alumni
        trigger_resp = requests.post(
            f"{BASE_URL}/api/trigger_tracking/{alumni_id}",
            headers=headers,
            timeout=TIMEOUT,
        )
        assert trigger_resp.status_code == 200, f"Trigger tracking failed: {trigger_resp.text}"
        trigger_result = trigger_resp.json()
        status = trigger_result.get("status")
        assert status == "Perlu Verifikasi Manual", f"Expected status 'Perlu Verifikasi Manual', got '{status}'"

        # Step 3: Fetch tracking results and verify array not empty
        results_resp = requests.get(
            f"{BASE_URL}/api/alumni/{alumni_id}/results",
            headers=headers,
            timeout=TIMEOUT,
        )
        assert results_resp.status_code == 200, f"Failed to fetch results: {results_resp.text}"
        results = results_resp.json()
        assert isinstance(results, list), "Results is not a list"
        assert len(results) > 0, "Results list is empty"

        # Step 4: Send verification status update
        status_update_payload = {"status": "Kemungkinan Kuat"}
        status_resp = requests.put(
            f"{BASE_URL}/api/alumni/{alumni_id}/status",
            json=status_update_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert status_resp.status_code == 200, f"Failed to update status: {status_resp.text}"
        updated_alumni = status_resp.json()
        assert updated_alumni.get("status") == "Kemungkinan Kuat", "Alumni status was not updated correctly"

    finally:
        # Cleanup: delete created alumni
        if alumni_id:
            try:
                requests.delete(f"{BASE_URL}/api/alumni/{alumni_id}", timeout=TIMEOUT)
            except Exception:
                pass


test_list_all_alumni_records()
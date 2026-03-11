import requests
import time

BASE_URL = "http://localhost:8000"
TIMEOUT = 30


def test_trigger_tracking_all_eligible_alumni():
    alumni_id = None
    headers = {"Content-Type": "application/json"}

    try:
        # Step 1: Create alumni with title containing 'MARGINAL'
        create_payload = {
            "name": "Test Alumni MARGINAL",
            "year_in": 2010,
            "year_out": 2014,
            "program": "Test Program",
            "title": "Alumni MARGINAL Expert"
        }
        create_resp = requests.post(f"{BASE_URL}/api/alumni/", json=create_payload, headers=headers, timeout=TIMEOUT)
        assert create_resp.status_code == 201, f"Failed to create alumni, status code: {create_resp.status_code}"
        alumni = create_resp.json()
        alumni_id = alumni.get("id")
        assert alumni_id is not None, "Created alumni has no id"

        # Step 2: Trigger tracking for that alumni to make status 'Perlu Verifikasi Manual'
        trigger_resp = requests.post(f"{BASE_URL}/api/trigger_tracking/{alumni_id}", headers=headers, timeout=TIMEOUT)
        assert trigger_resp.status_code == 200, f"Trigger tracking failed, status code: {trigger_resp.status_code}"
        trigger_data = trigger_resp.json()
        assert trigger_data.get("status") == "Perlu Verifikasi Manual", "Alumni status is not 'Perlu Verifikasi Manual' after trigger"

        # Step 3: Fetch tracking results from GET /api/alumni/{id}/results and verify array not empty
        results_resp = requests.get(f"{BASE_URL}/api/alumni/{alumni_id}/results", headers=headers, timeout=TIMEOUT)
        assert results_resp.status_code == 200, f"Failed to get results, status code: {results_resp.status_code}"
        results_data = results_resp.json()
        assert isinstance(results_data, list), "Results is not a list"
        assert len(results_data) > 0, "Results array is empty"

        # Step 4: Send PUT /api/alumni/{id}/status with status 'Kemungkinan Kuat'
        update_status_payload = {"status": "Kemungkinan Kuat"}
        update_status_resp = requests.put(
            f"{BASE_URL}/api/alumni/{alumni_id}/status",
            json=update_status_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert update_status_resp.status_code == 200, f"Failed to update status, status code: {update_status_resp.status_code}"
        updated_alumni = update_status_resp.json()
        assert updated_alumni.get("status") == "Kemungkinan Kuat", "Alumni status did not update to 'Kemungkinan Kuat'"

        # Step 5: Trigger tracking for all eligible alumni via POST /api/trigger_tracking_all
        trigger_all_resp = requests.post(f"{BASE_URL}/api/trigger_tracking_all", headers=headers, timeout=TIMEOUT)
        assert trigger_all_resp.status_code == 200, f"Trigger tracking all failed, status code: {trigger_all_resp.status_code}"
        response_data = trigger_all_resp.json()

        # Validate keys in response
        assert "processed_count" in response_data, "Response missing 'processed_count'"
        assert "skipped_opt_out_count" in response_data, "Response missing 'skipped_opt_out_count'"
        assert "errors" in response_data, "Response missing 'errors'"
        assert isinstance(response_data["processed_count"], int), "'processed_count' is not int"
        assert isinstance(response_data["skipped_opt_out_count"], int), "'skipped_opt_out_count' is not int"
        assert isinstance(response_data["errors"], list), "'errors' is not list"

    finally:
        # Cleanup: Delete created alumni if possible
        if alumni_id:
            try:
                requests.delete(f"{BASE_URL}/api/alumni/{alumni_id}", timeout=TIMEOUT)
            except Exception:
                pass


test_trigger_tracking_all_eligible_alumni()
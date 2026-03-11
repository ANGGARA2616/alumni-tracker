import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_trigger_tracking_for_opted_out_alumni():
    alumni_id = None
    try:
        # Step 1: Create an alumni with a title containing 'MARGINAL'
        alumni_payload = {
            "name": "Test Alumni MARGINAL",
            "year_in": 2010,
            "year_out": 2014,
            "program": "Computer Science",
            "title": "MARGINAL Researcher"
        }
        response = requests.post(f"{BASE_URL}/api/alumni/", json=alumni_payload, timeout=TIMEOUT)
        assert response.status_code == 201, f"Expected 201 Created, got {response.status_code}"
        alumni = response.json()
        alumni_id = alumni.get("id")
        assert alumni_id is not None, "Alumni ID not returned"

        # Step 2: Trigger tracking for this alumni to make the status 'Perlu Verifikasi Manual'
        trigger_response = requests.post(f"{BASE_URL}/api/trigger_tracking/{alumni_id}", timeout=TIMEOUT)
        assert trigger_response.status_code == 200, f"Expected 200 on trigger, got {trigger_response.status_code}"
        trigger_json = trigger_response.json()
        status = trigger_json.get("status", "")
        assert status == "Perlu Verifikasi Manual", f"Expected status 'Perlu Verifikasi Manual', got '{status}'"

        # Step 3: Fetch results through GET /api/alumni/{id}/results and ensure array is not empty
        get_results_response = requests.get(f"{BASE_URL}/api/alumni/{alumni_id}/results", timeout=TIMEOUT)
        assert get_results_response.status_code == 200, f"Expected 200 on GET results, got {get_results_response.status_code}"
        results = get_results_response.json()
        assert isinstance(results, list), "Results should be a list"
        assert len(results) > 0, "Expected non-empty results array"

        # Step 4: PUT /api/alumni/{id}/status with JSON status 'Kemungkinan Kuat'
        status_payload = {"status": "Kemungkinan Kuat"}
        put_status_response = requests.put(f"{BASE_URL}/api/alumni/{alumni_id}/status", json=status_payload, timeout=TIMEOUT)
        assert put_status_response.status_code == 200, f"Expected 200 on status update, got {put_status_response.status_code}"
        updated_alumni = put_status_response.json()
        assert updated_alumni.get("status") == "Kemungkinan Kuat", f"Expected status updated to 'Kemungkinan Kuat', got '{updated_alumni.get('status')}'"

        # Step 5: Set opt_out to true
        opt_out_payload = {"opt_out": True}
        opt_out_response = requests.put(f"{BASE_URL}/api/alumni/{alumni_id}/opt_out", json=opt_out_payload, timeout=TIMEOUT)
        assert opt_out_response.status_code == 200, f"Expected 200 on opt_out update, got {opt_out_response.status_code}"
        opted_out_alumni = opt_out_response.json()
        assert opted_out_alumni.get("opt_out") is True, "Expected opt_out to be True"

        # Step 6: Trigger tracking for opt-out alumni, expect 400 error with message about tracking not permitted
        trigger_opt_out_response = requests.post(f"{BASE_URL}/api/trigger_tracking/{alumni_id}", timeout=TIMEOUT)
        assert trigger_opt_out_response.status_code == 400, f"Expected 400 for opted out alumni tracking, got {trigger_opt_out_response.status_code}"
        error_json = trigger_opt_out_response.json()
        error_message = error_json.get("detail") or error_json.get("message") or ""
        assert "opt-out" in error_message.lower(), f"Expected error message about 'opt-out', got '{error_message}'"

    finally:
        # Cleanup by deleting the alumni if created
        if alumni_id:
            try:
                requests.delete(f"{BASE_URL}/api/alumni/{alumni_id}", timeout=TIMEOUT)
            except Exception:
                pass

test_trigger_tracking_for_opted_out_alumni()
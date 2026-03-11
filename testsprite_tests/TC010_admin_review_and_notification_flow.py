import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30


def test_admin_review_and_notification_flow():
    alumni_id = None
    try:
        # Create a new alumni with title containing "MARGINAL"
        create_payload = {
            "name": "Test Alumni MARGINAL",
            "year_in": 2015,
            "year_out": 2019,
            "program": "Computer Science",
            "title": "MARGINAL Analyst"
        }
        resp_create = requests.post(f"{BASE_URL}/api/alumni/", json=create_payload, timeout=TIMEOUT)
        assert resp_create.status_code == 201, f"Failed to create alumni: {resp_create.text}"
        alumni = resp_create.json()
        alumni_id = alumni.get("id")
        assert alumni_id is not None, "Created alumni ID missing"

        # Trigger tracking to make status 'Perlu Verifikasi Manual'
        resp_trigger = requests.post(f"{BASE_URL}/api/trigger_tracking/{alumni_id}", timeout=TIMEOUT)
        assert resp_trigger.status_code == 200, f"Trigger tracking failed: {resp_trigger.text}"
        tracking_result = resp_trigger.json()
        status = tracking_result.get("status")
        assert status == "Perlu Verifikasi Manual", f"Expected status 'Perlu Verifikasi Manual', got '{status}'"
        evidence_id = tracking_result.get("evidence_id")
        assert evidence_id is not None, "evidence_id missing in tracking result"
        # Also check there is top_kandidat list for manual review (updated field name according to PRD)
        top_kandidat = tracking_result.get("top_kandidat")
        assert isinstance(top_kandidat, list) and len(top_kandidat) > 0, "top_kandidat list is empty or missing"

        # Fetch results via GET /api/alumni/{id}/results, ensure array not empty
        resp_results = requests.get(f"{BASE_URL}/api/alumni/{alumni_id}/results", timeout=TIMEOUT)
        assert resp_results.status_code == 200, f"Fetch alumni results failed: {resp_results.text}"
        results_json = resp_results.json()
        assert isinstance(results_json, list) and len(results_json) > 0, "Alumni results array is empty"

        # Verify admin UI can retrieve evidence and candidate details for manual review
        # Assuming evidence details endpoint GET /api/evidence/{evidence_id}
        resp_evidence = requests.get(f"{BASE_URL}/api/evidence/{evidence_id}", timeout=TIMEOUT)
        assert resp_evidence.status_code == 200, f"Fetch evidence failed: {resp_evidence.text}"
        evidence_data = resp_evidence.json()
        assert "candidates" in evidence_data, "Candidates data missing in evidence"
        candidates = evidence_data["candidates"]
        assert isinstance(candidates, list) and len(candidates) > 0, "Candidates list in evidence is empty"

        # Send verification command with status 'Kemungkinan Kuat'
        verify_payload = {"status": "Kemungkinan Kuat"}
        resp_verify = requests.put(f"{BASE_URL}/api/alumni/{alumni_id}/status", json=verify_payload, timeout=TIMEOUT)
        assert resp_verify.status_code == 200, f"Status update failed: {resp_verify.text}"
        updated_alumni = resp_verify.json()
        new_status = updated_alumni.get("status")
        assert new_status == "Kemungkinan Kuat", f"Expected alumni status 'Kemungkinan Kuat', got '{new_status}'"

    finally:
        if alumni_id is not None:
            # Clean up: delete the alumni record (assuming DELETE endpoint)
            try:
                requests.delete(f"{BASE_URL}/api/alumni/{alumni_id}", timeout=TIMEOUT)
            except Exception:
                pass


test_admin_review_and_notification_flow()

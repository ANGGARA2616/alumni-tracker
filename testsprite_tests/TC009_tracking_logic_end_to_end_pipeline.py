import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_tracking_logic_end_to_end_pipeline():
    alumni_data = {
        "name": "Test Alumni MARGINAL Status",
        "year_in": 2010,
        "year_out": 2014,
        "program": "Teknik Informatika",
        "title": "Researcher MARGINAL Case"
    }
    alumni_id = None
    try:
        # Create new alumni with 'MARGINAL' in title
        create_resp = requests.post(f"{BASE_URL}/api/alumni/", json=alumni_data, timeout=TIMEOUT)
        assert create_resp.status_code == 201, f"Expected 201 Created, got {create_resp.status_code}"
        created_alumni = create_resp.json()
        assert "id" in created_alumni
        alumni_id = created_alumni["id"]

        # Trigger tracking for this alumni
        trigger_resp = requests.post(f"{BASE_URL}/api/trigger_tracking/{alumni_id}", timeout=TIMEOUT)
        assert trigger_resp.status_code == 200, f"Expected 200 OK, got {trigger_resp.status_code}"
        tracking_result = trigger_resp.json()
        # Expect status to be "Perlu Verifikasi Manual" because of MARGINAL keyword
        assert tracking_result.get("status") == "Perlu Verifikasi Manual", f"Expected status 'Perlu Verifikasi Manual', got {tracking_result.get('status')}"
        assert "evidence_id" in tracking_result, "evidence_id missing in tracking_result"

        # Fetch all alumni and check updated status for this alumni
        list_resp = requests.get(f"{BASE_URL}/api/alumni/", timeout=TIMEOUT)
        assert list_resp.status_code == 200, f"Expected 200 OK for alumni list fetch, got {list_resp.status_code}"
        alumni_list = list_resp.json()
        assert isinstance(alumni_list, list), "Alumni list should be a list"
        # Find the created alumni and check status
        matched_alumni = next((a for a in alumni_list if a.get("id") == alumni_id), None)
        assert matched_alumni is not None, "Created alumni not found in list"
        assert matched_alumni.get("status") == "Perlu Verifikasi Manual", f"Expected alumni status 'Perlu Verifikasi Manual', got {matched_alumni.get('status')}"

    finally:
        if alumni_id is not None:
            # Clean up: delete created alumni
            requests.delete(f"{BASE_URL}/api/alumni/{alumni_id}", timeout=TIMEOUT)

test_tracking_logic_end_to_end_pipeline()

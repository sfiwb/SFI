import requests
import json

# Firestore REST API endpoint
url = "https://firestore.googleapis.com/v1/projects/sfi-wb/databases/(default)/documents:runQuery"

# Construct structured query to find supporterId = "SFI-WB-PRL-85283"
query = {
    "structuredQuery": {
        "from": [{"collectionId": "supporters"}],
        "where": {
            "fieldFilter": {
                "field": {"fieldPath": "supporterId"},
                "op": "EQUAL",
                "value": {"stringValue": "SFI-WB-PRL-85283"}
            }
        }
    }
}

try:
    response = requests.post(url, json=query)
    print("Status Code:", response.status_code)
    if response.status_code == 200:
        results = response.json()
        print(json.dumps(results, indent=2))
    else:
        print("Response Text:", response.text)
except Exception as e:
    print("Error:", e)

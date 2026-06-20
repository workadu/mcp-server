#!/usr/bin/env python3
import os
import sys
import json
import urllib.request
import urllib.error

def main():
    if len(sys.argv) < 3:
        print("Usage: python workadu_client.py <METHOD> <ENDPOINT> [JSON_PAYLOAD]")
        print("Example: python workadu_client.py GET /api/orders")
        print("Example: python workadu_client.py POST /api/orders '{\"service_id\": 123}'")
        sys.exit(1)

    method = sys.argv[1].upper()
    endpoint = sys.argv[2]
    payload = sys.argv[3] if len(sys.argv) > 3 else None

    # Environment variables
    api_token = os.environ.get("WORKADU_API_TOKEN")
    base_url = os.environ.get("WORKADU_API_URL")

    if not api_token or not base_url:
        print("Error: Missing required environment variables.")
        print("Please set WORKADU_API_TOKEN and WORKADU_API_URL.")
        print("Example: export WORKADU_API_TOKEN='your_token'")
        print("Example: export WORKADU_API_URL='https://app.workadu.com'")
        sys.exit(1)

    # Clean up base url and endpoint
    base_url = base_url.rstrip("/")
    if not endpoint.startswith("/"):
        endpoint = "/" + endpoint

    url = base_url + endpoint

    headers = {
        "Authorization": f"Bearer {api_token}",
        "Accept": "application/json"
    }

    data = None
    if payload:
        try:
            # Validate JSON
            json.loads(payload)
            data = payload.encode('utf-8')
            headers["Content-Type"] = "application/json"
        except json.JSONDecodeError:
            print("Error: Invalid JSON payload provided.")
            sys.exit(1)

    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as response:
            status_code = response.getcode()
            response_body = response.read().decode('utf-8')
            print(f"Status Code: {status_code}")
            try:
                # Try pretty-printing JSON
                parsed = json.loads(response_body)
                print(json.dumps(parsed, indent=2))
            except json.JSONDecodeError:
                print(response_body)
                
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.reason}")
        response_body = e.read().decode('utf-8')
        try:
            parsed = json.loads(response_body)
            print(json.dumps(parsed, indent=2))
        except:
            print(response_body)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"URL Error: {e.reason}")
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

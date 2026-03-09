# test_simple.py - Créez ce fichier dans la racine de votre projet

import requests
import sys


def test_url(url, description):
    print(f"\n🔍 Test: {description}")
    print(f"URL: {url}")
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            print(f"✅ SUCCESS - Status: {response.status_code}")
            try:
                data = response.json()
                print(f"   Response: {data.get('message', 'No message')}")
            except:
                print(f"   Response: {response.text[:100]}...")
        else:
            print(f"❌ FAILED - Status: {response.status_code}")
            print(f"   Error: {response.text[:200]}")
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR - Serveur Django non démarré ?")
        sys.exit(1)
    except Exception as e:
        print(f"❌ ERROR: {e}")


if __name__ == "__main__":
    base_url = "http://127.0.0.1:8000"

    print("=" * 60)
    print("TEST DE L'API YOONU DAL")
    print("=" * 60)

    # Tests de base
    test_url(f"{base_url}/api/", "API Racine")

    # Tests des tontines (version test)
    test_url(f"{base_url}/api/test/tontines/", "Test Tontines List")
    test_url(f"{base_url}/api/test/tontines/simulator/", "Test Tontines Simulator")

    # Test POST pour le simulateur
    print(f"\n🔍 Test POST: Simulateur de tontine")
    print(f"URL: {base_url}/api/test/tontines/simulator/")
    try:
        response = requests.post(f"{base_url}/api/test/tontines/simulator/", json={
            "amount_per_contribution": 50000,
            "frequency": "monthly",
            "number_of_participants": 10,
            "desired_position": 3
        }, timeout=10)
        if response.status_code == 200:
            print(f"✅ POST SUCCESS - Status: {response.status_code}")
            try:
                data = response.json()
                print(f"   Message: {data.get('message', 'No message')}")
                if 'results' in data:
                    print(f"   ROI: {data['results'].get('roi_percentage', 'N/A')}%")
            except:
                print(f"   Response: {response.text[:100]}...")
        else:
            print(f"❌ POST FAILED - Status: {response.status_code}")
            print(f"   Error: {response.text[:200]}")
    except Exception as e:
        print(f"❌ POST ERROR: {e}")
    test_url(f"{base_url}/api/test/tontines/analysis/", "Test Tontines Analysis")
    test_url(f"{base_url}/api/test/tontines/recommendations/", "Test Tontines Recommendations")

    print("\n" + "=" * 60)
    print("TESTS TERMINÉS")
    print("=" * 60)
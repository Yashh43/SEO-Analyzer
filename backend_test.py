import requests
import unittest
import json
import time
import sys
from urllib.parse import urlparse

class WebsiteAnalysisAPITester:
    def __init__(self, base_url="http://localhost:8001/"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=60):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.status_code == 200:
                    try:
                        return success, response.json()
                    except:
                        return success, None
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:200]}...")

            return success, None

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, None

    def test_health_endpoint(self):
        """Test the health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        if success:
            print(f"Health check response: {response}")
        self.results.append({
            "test": "Health Check",
            "success": success,
            "response": response
        })
        return success

    def test_analyze_valid_website(self, url):
        """Test analyzing a valid website"""
        print(f"\nTesting analysis of valid website: {url}")
        success, response = self.run_test(
            f"Analyze {url}",
            "POST",
            "api/analyze",
            200,
            data={"url": url},
            timeout=120  # Longer timeout for analysis
        )
        
        if success and response:
            # Validate response structure
            required_fields = [
                "url", "analysis_id", "title", "content_summary", 
                "suggestions", "tools_recommended", "overall_score", "categories"
            ]
            
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                print(f"❌ Response missing required fields: {missing_fields}")
                success = False
            else:
                print("✅ Response contains all required fields")
                
                # Check if suggestions are present
                if len(response["suggestions"]) == 0:
                    print("⚠️ Warning: No suggestions provided")
                else:
                    print(f"✅ Found {len(response['suggestions'])} suggestions")
                
                # Check if tools are recommended
                if len(response["tools_recommended"]) == 0:
                    print("⚠️ Warning: No tools recommended")
                else:
                    print(f"✅ Found {len(response['tools_recommended'])} recommended tools")
                
                # Check categories
                if not response["categories"]:
                    print("⚠️ Warning: No categories provided")
                else:
                    print(f"✅ Found {len(response['categories'])} categories")
                    
                # Print overall score
                print(f"📊 Overall score: {response['overall_score']}")
        
        self.results.append({
            "test": f"Analyze {url}",
            "success": success,
            "response": response if success else None
        })
        return success, response

    def test_analyze_invalid_url(self, url):
        """Test analyzing an invalid URL"""
        print(f"\nTesting analysis of invalid URL: {url}")
        success, response = self.run_test(
            f"Analyze Invalid URL: {url}",
            "POST",
            "api/analyze",
            400,  # Expecting a 400 Bad Request
            data={"url": url}
        )
        
        self.results.append({
            "test": f"Analyze Invalid URL: {url}",
            "success": success,
            "response": response
        })
        return success

    def run_all_tests(self):
        """Run all tests and return results"""
        print("🚀 Starting Website Analysis API Tests")
        
        # Test health endpoint
        self.test_health_endpoint()
        
        # Test valid websites
        valid_websites = [
            "https://github.com",
            "https://stackoverflow.com",
            "https://medium.com"
        ]
        
        for website in valid_websites:
            self.test_analyze_valid_website(website)
        
        # Test invalid URLs
        invalid_urls = [
            "invalid-url",
            "http://thisisnotarealwebsiteaddress12345.com",
            "ftp://example.com"
        ]
        
        for url in invalid_urls:
            self.test_analyze_invalid_url(url)
        
        # Print results
        print(f"\n📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        return self.results

def main():
    # Setup
    tester = WebsiteAnalysisAPITester()
    
    # Run tests
    results = tester.run_all_tests()
    
    # Return success if all tests passed
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
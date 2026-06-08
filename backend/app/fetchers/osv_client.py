import httpx
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

# Local database of common vulnerabilities to act as a fallback and offline demo provider
MOCK_VULNERABILITY_DB = {
    "npm": {
        "lodash": [
            {
                "version": "4.17.15",
                "osv_id": "GHSA-jfvh-qwwp-pw29",
                "title": "Prototype Pollution in lodash",
                "summary": "Prototype pollution in lodash leading to remote code execution or denial of service.",
                "details": "A prototype pollution vulnerability in lodash versions before 4.17.21 allows attackers to inject property keys into Object.prototype.",
                "severity": "HIGH",
                "cvss_score": 7.5,
                "fixed_in": "4.17.21",
                "affected_versions": "< 4.17.21"
            }
        ],
        "express": [
            {
                "version": "4.16.4",
                "osv_id": "GHSA-5wf2-72cc-7m3p",
                "title": "Open Redirect in express",
                "summary": "Express redirect helper has redirect issues if input is unvalidated.",
                "details": "Express versions before 4.17.1 have redirect handling weaknesses that let remote actors trigger open redirects.",
                "severity": "MEDIUM",
                "cvss_score": 5.4,
                "fixed_in": "4.17.1",
                "affected_versions": "< 4.17.1"
            }
        ],
        "minimist": [
            {
                "version": "1.2.0",
                "osv_id": "GHSA-xvch-5gv5-w85r",
                "title": "Prototype Pollution in minimist",
                "summary": "Minimist parser prototype pollution vulnerability.",
                "details": "minimist before 1.2.6 parses query strings containing prototype assignments causing pollution.",
                "severity": "CRITICAL",
                "cvss_score": 9.8,
                "fixed_in": "1.2.6",
                "affected_versions": "< 1.2.6"
            }
        ]
    },
    "pypi": {
        "cryptography": [
            {
                "version": "3.4.0",
                "osv_id": "GHSA-xwrp-57fc-j8qw",
                "title": "Null pointer dereference in cryptography",
                "summary": "Null pointer dereference when parsing malicious certificates.",
                "details": "A null pointer dereference in the parsing code of cryptography before 3.4.7 could lead to Denial of Service.",
                "severity": "HIGH",
                "cvss_score": 7.5,
                "fixed_in": "3.4.7",
                "affected_versions": "< 3.4.7"
            }
        ],
        "requests": [
            {
                "version": "2.26.0",
                "osv_id": "GHSA-r68x-9h7f-2g85",
                "title": "Leaked Authorization Headers",
                "summary": "Requests leaks Authorization headers to target host on cross-origin redirects.",
                "details": "requests before 2.28.1 leaks sensitive authentication parameters during redirect operations.",
                "severity": "MEDIUM",
                "cvss_score": 6.1,
                "fixed_in": "2.28.1",
                "affected_versions": "< 2.28.1"
            }
        ]
    }
}

class OSVClient:
    def __init__(self):
        self.api_url = "https://api.osv.dev/v1/query"

    async def check_vulnerability(self, package_name: str, version: str, ecosystem: str) -> List[Dict[str, Any]]:
        """
        Queries the OSV API for package vulnerabilities. 
        Falls back to local mock DB if network is down or query fails.
        """
        # Map ecosystem names
        eco_map = {
            "python": "PyPI",
            "npm": "npm",
            "maven": "Maven",
            "go": "Go"
        }
        osv_ecosystem = eco_map.get(ecosystem.lower(), ecosystem)
        
        payload = {
            "version": version,
            "package": {
                "name": package_name,
                "ecosystem": osv_ecosystem
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.post(self.api_url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    vulns = data.get("vulns", [])
                    results = []
                    for v in vulns:
                        # Extract CVSS score
                        cvss_score = 5.0  # Default fallback
                        severity = "MEDIUM"
                        if "severity" in v:
                            for sev in v["severity"]:
                                if sev.get("type") == "CVSS_V3":
                                    cvss_score = float(sev.get("score", 5.0))
                                    break
                                    
                        # Determine severity rating string
                        if cvss_score >= 9.0:
                            severity = "CRITICAL"
                        elif cvss_score >= 7.0:
                            severity = "HIGH"
                        elif cvss_score >= 4.0:
                            severity = "MEDIUM"
                        else:
                            severity = "LOW"
                            
                        # Extract fixed version
                        fixed_in = None
                        affected = v.get("affected", [])
                        if affected:
                            ranges = affected[0].get("ranges", [])
                            if ranges:
                                events = ranges[0].get("events", [])
                                for e in events:
                                    if "fixed" in e:
                                        fixed_in = e["fixed"]
                                        break

                        results.append({
                            "osv_id": v.get("id"),
                            "title": v.get("summary", "Vulnerability in " + package_name),
                            "summary": v.get("summary", ""),
                            "details": v.get("details", ""),
                            "severity": severity,
                            "cvss_score": cvss_score,
                            "fixed_in": fixed_in,
                            "affected_versions": f"== {version}"
                        })
                    return results
        except Exception as e:
            logger.warning(f"OSV API query failed for {package_name}@{version}: {str(e)}. Using local vulnerability DB.")
            
        # Fallback to local offline DB
        local_eco = MOCK_VULNERABILITY_DB.get(ecosystem.lower(), {})
        vulns_list = local_eco.get(package_name.lower(), [])
        
        # Filter for matched version
        matched = []
        for v in vulns_list:
            if v["version"] == version:
                matched.append({
                    "osv_id": v["osv_id"],
                    "title": v["title"],
                    "summary": v["summary"],
                    "details": v["details"],
                    "severity": v["severity"],
                    "cvss_score": v["cvss_score"],
                    "fixed_in": v["fixed_in"],
                    "affected_versions": v["affected_versions"]
                })
        return matched

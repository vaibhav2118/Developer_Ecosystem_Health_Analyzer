import pytest
from datetime import datetime, timedelta

from backend.app.metrics.contributor import calculate_contributor_metrics
from backend.app.scoring.health_engine import calculate_health_scores

def test_bus_factor_calculation():
    # 1. High Bus Factor Case (equally distributed commits)
    commits = []
    # 5 contributors with 20 commits each
    for i in range(5):
        username = f"user_{i}"
        for _ in range(20):
            commits.append({
                "author": {"login": username},
                "commit": {
                    "author": {
                        "name": username,
                        "date": (datetime.utcnow() - timedelta(days=2)).strftime("%Y-%m-%dT%H:%M:%SZ")
                    }
                }
            })
            
    res = calculate_contributor_metrics(commits, [])
    # 3 contributors are needed to reach >= 50% commits (20 * 3 = 60 out of 100)
    assert res["bus_factor"] == 3
    assert res["concentration_index"] < 2500 # Should be low concentration

def test_critical_bus_factor():
    # 2. Critical Bus Factor Case (one contributor owns everything)
    commits = []
    for _ in range(90):
        commits.append({
            "author": {"login": "key_person"},
            "commit": {
                "author": {
                    "name": "key_person",
                    "date": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
                }
            }
        })
    for i in range(10):
        commits.append({
            "author": {"login": f"helper_{i}"},
            "commit": {
                "author": {
                    "name": f"helper_{i}",
                    "date": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
                }
            }
        })
        
    res = calculate_contributor_metrics(commits, [])
    # Bus factor should be 1 since "key_person" has 90% of commits
    assert res["bus_factor"] == 1
    assert res["concentration_index"] > 5000 # High concentration

def test_health_scoring_engine():
    # Verify math scaling and clipping
    contributor = {"bus_factor": 1, "concentration_index": 8000, "retention_rate": 20.0}
    velocity = {"pr_merge_time_hours": 120.0, "issue_resolution_time_hours": 240.0, "commit_frequency_trend_slope": -3.0}
    deps = [{"staleness_score": 90.0, "vulnerability_score": 50.0}]
    community = {"readme_score": 10.0, "stars": 5, "forks": 1}
    network = {}
    
    scores = calculate_health_scores(contributor, velocity, deps, community, network)
    
    # Assert health scores are properly calculated and clipped between 0 and 100
    assert 0 <= scores["overall_score"] <= 100
    assert 0 <= scores["security_score"] <= 100
    assert 0 <= scores["sustainability_score"] <= 100

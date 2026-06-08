from typing import Dict, Any, List

# Industry standard benchmarks for comparing repositories
INDUSTRY_BENCHMARKS = {
    "stars": 4500,
    "forks": 850,
    "open_issues": 120,
    "overall_score": 70.0,
    "activity_score": 68.0,
    "community_score": 72.0,
    "security_score": 75.0,
    "sustainability_score": 65.0,
    "maintainability_score": 70.0,
    "bus_factor": 3,
}

def compare_repositories_data(repos: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compares multiple repositories side by side against industry benchmarks.
    """
    comparison_list = []
    
    for r in repos:
        # Extract details, metrics, and health scores
        details = r.get("details", {})
        scores = r.get("scores", {})
        contribs = r.get("contributors", {})
        velocity = r.get("velocity", {})
        
        comp_data = {
            "id": r.get("id"),
            "name": r.get("name"),
            "full_name": r.get("full_name"),
            "language": r.get("language"),
            
            # Key statistics
            "stars": details.get("stars", 0),
            "forks": details.get("forks", 0),
            "open_issues": details.get("open_issues", 0),
            "contributors_count": contribs.get("total_active_contributors", 1),
            "bus_factor": contribs.get("bus_factor", 1),
            "pr_merge_time_hours": velocity.get("pr_merge_time_hours", 24.0),
            
            # Scores
            "overall_score": scores.get("overall_score", 50.0),
            "activity_score": scores.get("activity_score", 50.0),
            "community_score": scores.get("community_score", 50.0),
            "security_score": scores.get("security_score", 50.0),
            "sustainability_score": scores.get("sustainability_score", 50.0),
            "maintainability_score": scores.get("maintainability_score", 50.0),
        }
        comparison_list.append(comp_data)
        
    return {
        "repositories": comparison_list,
        "benchmarks": INDUSTRY_BENCHMARKS
    }

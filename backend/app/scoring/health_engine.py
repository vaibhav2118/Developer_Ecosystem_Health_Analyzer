import numpy as np
from typing import Dict, Any, List

def calculate_health_scores(
    contributor_metrics: Dict[str, Any],
    velocity_metrics: Dict[str, Any],
    dependency_metrics: List[Dict[str, Any]],
    community_metrics: Dict[str, Any],
    network_metrics: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Computes overall Health Score (0-100) and five subscores:
    1. Activity Score (20% weight)
    2. Community Score (20% weight)
    3. Security Score (25% weight)
    4. Sustainability Score (20% weight)
    5. Maintainability Score (15% weight)
    
    Includes confidence intervals.
    """
    # 1. Activity Score
    # Factors: PR merge time, issue resolution speed, commit frequency trend slope.
    # Lower merge/resolution times are better.
    pr_merge = velocity_metrics.get("pr_merge_time_hours", 24.0)
    issue_res = velocity_metrics.get("issue_resolution_time_hours", 48.0)
    slope = velocity_metrics.get("commit_frequency_trend_slope", 0.0)
    
    # Scale times: 0 to 120 hours maps to score 100 to 20
    pr_score = max(20, 100 - (pr_merge / 1.5))
    issue_score = max(20, 100 - (issue_res / 3.0))
    slope_bonus = min(20, max(-20, slope * 10))
    
    activity_score = clip_score((pr_score * 0.5) + (issue_score * 0.5) + slope_bonus)

    # 2. Community Score
    # Factors: stars/forks scale, external contributor ratio, discussion activity
    stars = community_metrics.get("stars", 100)
    ext_ratio = community_metrics.get("external_contributor_ratio", 0.5)
    disc_activity = community_metrics.get("discussion_activity_score", 50.0)
    
    stars_score = min(100, 30 + (np.log10(max(1, stars)) * 15)) # log scale
    ext_score = ext_ratio * 100
    
    community_score = clip_score((stars_score * 0.3) + (ext_score * 0.4) + (disc_activity * 0.3))

    # 3. Security Score
    # Factors: dependency staleness and vulnerability exposure
    # Count vulnerabilities and deduct points.
    vuln_deductions = 0
    dependency_staleness_avg = 0.0
    
    if dependency_metrics:
        total_stale = 0.0
        for dep in dependency_metrics:
            total_stale += dep.get("staleness_score", 0.0)
            # Check for vulnerabilities attached to this dependency
            # Vulnerability exposure details can be checked or mocked.
            # (We will subtract 25 points for each CRITICAL, 15 for HIGH, 5 for MEDIUM)
            vuln_score = dep.get("vulnerability_score", 0.0)
            vuln_deductions += vuln_score
            
        dependency_staleness_avg = total_stale / len(dependency_metrics)
        
    sec_base = max(10, 100 - dependency_staleness_avg)
    security_score = clip_score(sec_base - vuln_deductions)

    # 4. Sustainability Score
    # Factors: Bus Factor, Concentration Index (HHI), contributor retention
    bus_factor = contributor_metrics.get("bus_factor", 1)
    hhi = contributor_metrics.get("concentration_index", 10000)
    retention = contributor_metrics.get("retention_rate", 100.0)
    
    bus_score = min(100, bus_factor * 25) # 4+ developers = 100
    hhi_score = max(10, 100 - (hhi / 120)) # lower HHI is better
    
    sustainability_score = clip_score((bus_score * 0.4) + (hhi_score * 0.3) + (retention * 0.3))

    # 5. Maintainability Score
    # Factors: README score, release frequency, lead time for changes
    readme_score = community_metrics.get("readme_score", 50.0)
    lead_time = velocity_metrics.get("lead_time_for_changes_days", 2.0)
    release_freq = velocity_metrics.get("release_frequency_monthly", 1.0)
    
    lead_time_score = max(20, 100 - (lead_time * 5))
    release_score = min(100, release_freq * 40)
    
    maintainability_score = clip_score((readme_score * 0.4) + (lead_time_score * 0.3) + (release_score * 0.3))

    # 6. Overall Health Score
    overall_score = (
        (activity_score * 0.20) +
        (community_score * 0.20) +
        (security_score * 0.25) +
        (sustainability_score * 0.20) +
        (maintainability_score * 0.15)
    )
    overall_score = round(overall_score, 1)

    # 7. Confidence Interval Calculation
    # Based on number of active contributors and commits. Fewer items = wider variance (lower confidence)
    commits_count = len(velocity_metrics.get("weekly_commit_counts", []))
    variance_factor = max(2.0, 15.0 - (commits_count * 0.5))
    
    ci_low = max(0.0, overall_score - variance_factor)
    ci_high = min(100.0, overall_score + variance_factor)

    return {
        "overall_score": overall_score,
        "activity_score": round(activity_score, 1),
        "community_score": round(community_score, 1),
        "security_score": round(security_score, 1),
        "sustainability_score": round(sustainability_score, 1),
        "maintainability_score": round(maintainability_score, 1),
        "confidence_interval_low": round(ci_low, 1),
        "confidence_interval_high": round(ci_high, 1)
    }

def clip_score(score: float) -> float:
    return max(0.0, min(100.0, score))

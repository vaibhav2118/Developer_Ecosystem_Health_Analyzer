import numpy as np
import pandas as pd
from typing import Dict, Any, List
from datetime import datetime

def calculate_contributor_metrics(commits: List[Dict[str, Any]], contributors_list: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculates contributor metrics including:
    - Bus Factor
    - Concentration Index (Herfindahl-Hirschman Index - HHI)
    - Core Contributor Ratio
    - New Contributor Rate
    - Contributor Churn Rate
    - Contributor Retention Rate
    """
    if not commits:
        return {
            "bus_factor": 1,
            "concentration_index": 10000,
            "core_contributor_ratio": 1.0,
            "new_contributor_rate": 0.0,
            "churn_rate": 0.0,
            "retention_rate": 100.0,
            "contributor_distribution": {}
        }

    # Analyze commits per developer
    commit_counts = {}
    commit_dates = {}
    for c in commits:
        author = c.get("author", {})
        username = author.get("login") if author else None
        if not username:
            # Fallback to commit.author.name
            username = c.get("commit", {}).get("author", {}).get("name")
        if not username:
            continue
            
        commit_counts[username] = commit_counts.get(username, 0) + 1
        
        # Track commit dates
        date_str = c.get("commit", {}).get("author", {}).get("date")
        if date_str:
            try:
                date_dt = pd.to_datetime(date_str).to_pydatetime().replace(tzinfo=None)
                if username not in commit_dates:
                    commit_dates[username] = []
                commit_dates[username].append(date_dt)
            except Exception:
                pass

    total_commits = sum(commit_counts.values())
    if total_commits == 0:
        return {
            "bus_factor": 1,
            "concentration_index": 10000,
            "core_contributor_ratio": 1.0,
            "new_contributor_rate": 0.0,
            "churn_rate": 0.0,
            "retention_rate": 100.0,
            "contributor_distribution": {}
        }

    # Sort contributors by commit counts
    sorted_contributors = sorted(commit_counts.items(), key=lambda x: x[1], reverse=True)
    
    # 1. Bus Factor calculation
    cumulative_commits = 0
    bus_factor = 0
    for username, count in sorted_contributors:
        cumulative_commits += count
        bus_factor += 1
        if cumulative_commits >= total_commits * 0.5:
            break

    # 2. HHI Concentration Index (Sum of squares of percentage shares)
    hhi = 0
    for username, count in sorted_contributors:
        share = (count / total_commits) * 100
        hhi += share ** 2
        
    # 3. Core Contributor Ratio (contributors making >= 10% of commits)
    core_contributors_count = sum(1 for username, count in sorted_contributors if (count / total_commits) >= 0.10)
    total_active_contributors = len(commit_counts)
    core_ratio = core_contributors_count / total_active_contributors if total_active_contributors > 0 else 0

    # 4. Activity Over Time (30 days vs 90 days)
    # Check churn, retention, and new contributor rates
    now = datetime.utcnow()
    thirty_days_ago = now - pd.Timedelta(days=30)
    ninety_days_ago = now - pd.Timedelta(days=90)
    
    active_last_30 = set()
    active_last_90 = set()
    first_commit_date = {}

    for username, dates in commit_dates.items():
        if dates:
            min_date = min(dates)
            first_commit_date[username] = min_date
            
            for d in dates:
                if d >= thirty_days_ago:
                    active_last_30.add(username)
                if d >= ninety_days_ago:
                    active_last_90.add(username)

    # New contributor rate: first commit in last 30 days
    new_contributors = sum(1 for username, date in first_commit_date.items() if date >= thirty_days_ago)
    new_rate = new_contributors / len(active_last_30) if len(active_last_30) > 0 else 0.0

    # Churn Rate: active in 30-90 days, but not in last 30 days
    active_30_to_90 = active_last_90 - active_last_30
    churn_rate = len(active_30_to_90) / len(active_last_90) if len(active_last_90) > 0 else 0.0
    
    # Retention rate: percentage of previous contributors who remained active
    retention_rate = (len(active_last_30.intersection(active_last_90)) / len(active_last_90)) * 100 if len(active_last_90) > 0 else 100.0

    # Contributor distributions
    dist = {uname: count for uname, count in sorted_contributors[:15]}

    return {
        "bus_factor": bus_factor,
        "concentration_index": round(hhi, 2),
        "core_contributor_ratio": round(core_ratio, 3),
        "new_contributor_rate": round(new_rate, 3),
        "churn_rate": round(churn_rate, 3),
        "retention_rate": round(retention_rate, 2),
        "total_active_contributors": total_active_contributors,
        "contributor_distribution": dist
    }

import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
from typing import Dict, Any, List

def forecast_repository_metrics(weekly_commits: List[int], current_health_score: float) -> Dict[str, Any]:
    """
    Fits a linear regression model to the weekly commits trend and projects:
    - Activity trend for the next 12 weeks
    - Contributor growth trend
    - Maintenance Risk (index from 0 to 100 based on projected activity decline)
    """
    # 1. Activity Trend Forecasting
    # If we have weekly commit history, fit LinearRegression
    if not weekly_commits:
        weekly_commits = [10, 12, 11, 14, 15, 13, 16, 15] # default mock
        
    x = np.array(range(len(weekly_commits))).reshape(-1, 1)
    y = np.array(weekly_commits)
    
    model = LinearRegression()
    model.fit(x, y)
    
    # Project next 12 weeks
    future_weeks = 12
    x_future = np.array(range(len(weekly_commits), len(weekly_commits) + future_weeks)).reshape(-1, 1)
    y_pred = model.predict(x_future)
    
    # Clean projections (no negative commits)
    predictions = [max(0.0, round(float(val), 1)) for val in y_pred]
    
    # Calculate trend slope direction
    slope = float(model.coef_[0])
    trend_direction = "stable"
    if slope > 0.5:
        trend_direction = "upward"
    elif slope < -0.5:
        trend_direction = "downward"
        
    # 2. Contributor Growth Prediction
    # Project contributor counts based on slope
    current_contributors = max(3, sum(1 for c in weekly_commits if c > 0))
    proj_contrib = []
    accumulated = current_contributors
    for i in range(future_weeks):
        # Grow slowly if trend is upward, decay/stable if downward
        growth = max(-0.2, min(0.5, slope * 0.1))
        accumulated += growth
        proj_contrib.append(max(1, int(round(accumulated))))

    # 3. Maintenance Risk Projection
    # Risk increases if commits are declining fast or health score is low
    base_risk = 100.0 - current_health_score
    risk_trend = []
    
    for i in range(future_weeks):
        # Accumulate risk if slope is negative
        decline_penalty = max(0.0, -slope * 1.5 * (i + 1))
        week_risk = min(100.0, max(0.0, base_risk + decline_penalty))
        risk_trend.append(round(week_risk, 1))
        
    latest_risk = risk_trend[-1]
    risk_level = "low"
    if latest_risk > 70:
        risk_level = "critical"
    elif latest_risk > 45:
        risk_level = "medium"

    return {
        "trend_direction": trend_direction,
        "slope": round(slope, 3),
        "weekly_commit_history": weekly_commits,
        "forecast_commits": predictions,
        "forecast_contributors": proj_contrib,
        "forecast_maintenance_risk": risk_trend,
        "current_maintenance_risk": round(base_risk, 1),
        "projected_maintenance_risk_level": risk_level
    }

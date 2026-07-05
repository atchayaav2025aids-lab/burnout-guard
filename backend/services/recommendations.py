def get_recommendations(risk_bucket, top_factors, raw_metrics):
    """
    Generates 1 to 3 actionable recommendations based on risk bucket,
    top factors, and raw metrics.
    """
    recommendations = []
    
    # helper to clean string values or return default numeric
    def get_num(key, default=0.0):
        val = raw_metrics.get(key, default)
        if val == "N/A":
            return default
        try:
            return float(val)
        except ValueError:
            return default

    # Lowercase factors for easier checking
    factors_lower = [f.lower() for f in top_factors]
    
    if risk_bucket == "High":
        # Rule 1: High Number of Tasks
        tasks = get_num("Number of Tasks")
        if tasks >= 7.0 or any("tasks" in f or "tickets" in f for f in factors_lower):
            recommendations.append("Redistribute workload across team; reduce allocation by ~20%")
            
        # Rule 2: Low Leave Count
        leaves = get_num("Leave Count", 15.0)
        if leaves <= 6.0 or any("leave" in f for f in factors_lower):
            recommendations.append("Encourage immediate PTO; flag for manager 1:1 this week")
            
        # Rule 3: High Meetings
        meetings = get_num("Meeting Hours")
        if meetings >= 15.0 or any("meeting" in f for f in factors_lower):
            recommendations.append("Reduce meeting load by ~30%; consider async standups")
            
        # Rule 4: Low Work-Life Balance Rating
        wlb = get_num("Work-Life Balance Rating", 4.0)
        if wlb <= 2.0 or any("balance" in f for f in factors_lower):
            recommendations.append("Evaluate remote/hybrid flexibility options")
            
        # Fallback if no specific rules trigger (or just to pad)
        if len(recommendations) == 0:
            recommendations.append("Schedule urgent 1:1 check-in; explore immediate workload adjustments")
            
    elif risk_bucket == "Medium":
        recommendations.append("Monitor workload and fatigue levels over next 2 weeks; schedule an informal check-in")
        
        leaves = get_num("Leave Count", 15.0)
        if leaves <= 6.0 or any("leave" in f for f in factors_lower):
            recommendations.append("Suggest taking a long weekend or a short rest break")
            
        meetings = get_num("Meeting Hours")
        if meetings >= 15.0:
            recommendations.append("Audit meeting calendar to free up focus hours")
            
    else:  # Low risk
        recommendations.append("No action needed; maintain current work patterns and encourage healthy boundaries")
        
    return recommendations[:3]

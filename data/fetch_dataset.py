import os
import json
import pandas as pd
import numpy as np

def generate_synthetic_data(num_records=2000):
    print("Generating custom IT company stress dataset...")
    np.random.seed(42)
    
    employee_ids = [f"DEV{i:04d}" for i in range(1, num_records + 1)]
    
    # 1. Daily Working Hours (Normal distribution around 8.2, range 4 to 14)
    working_hours = np.clip(np.random.normal(8.2, 1.5, size=num_records), 4.0, 14.0).round(1)
    
    # 2. Overtime Hours (correlated with working hours: if working hours > 8.0, overtime is likely)
    overtime_hours = []
    for wh in working_hours:
        if wh > 8.0:
            val = (wh - 8.0) + np.random.normal(0.5, 0.4)
        else:
            val = np.random.normal(0.2, 0.2)
        overtime_hours.append(np.clip(val, 0.0, 6.0))
    overtime_hours = np.array(overtime_hours).round(1)
    
    # 3. Number of Tasks/Tickets assigned (correlated with working hours, range 1 to 15)
    tasks = []
    for wh in working_hours:
        base_tasks = int((wh - 4.0) * 1.2 + 2.0)
        task_count = int(np.clip(np.random.normal(base_tasks, 1.8), 1, 15))
        tasks.append(task_count)
    tasks = np.array(tasks)
    
    # 4. Meeting Hours per week (range 1 to 30)
    meetings = np.clip(np.random.normal(10.0, 5.0, size=num_records) + (tasks * 0.6), 1.0, 30.0).round(1)
    
    # 5. Leave Count (fewer leaves taken correlates with higher working hours / stress, range 0 to 30)
    leaves = np.clip(np.random.normal(14.0, 4.0, size=num_records) - (working_hours - 8.0) * 0.8, 0, 30).astype(int)
    
    # 6. Employee Satisfaction Survey Score (1 to 10 scale, where higher is better, negatively correlated with fatigue)
    satisfaction = []
    for idx, wh in enumerate(working_hours):
        base_satisfaction = 9.0 - (wh - 8.0) * 0.8 - (overtime_hours[idx] * 0.4)
        sat_val = int(np.clip(np.random.normal(base_satisfaction, 1.2), 1, 10))
        satisfaction.append(sat_val)
    satisfaction = np.array(satisfaction)
    
    # 7. Project Deadlines (0 to 5 deadlines per month)
    deadlines = np.clip(np.random.normal(2.0, 1.0, size=num_records) + (tasks * 0.15), 0, 5).astype(int)
    
    # 8. Code Commits (for developers, 5 to 60 commits/week)
    commits = np.clip(np.random.normal(22.0, 8.0, size=num_records) + (working_hours - 8.0) * 2.0, 2, 60).astype(int)
    
    # 9. Work-Life Balance Rating (1 to 5 scale, 1 is poor, 5 is excellent)
    wlb_rating = []
    for idx, wh in enumerate(working_hours):
        base_wlb = 4.0 - (wh - 8.0) * 0.4 - (overtime_hours[idx] * 0.3)
        wlb_val = int(np.clip(np.random.normal(base_wlb, 0.7), 1, 5))
        wlb_rating.append(wlb_val)
    wlb_rating = np.array(wlb_rating)
    
    # 10. Response Time to emails/messages (in minutes, 5 to 120 minutes)
    response_time = np.clip(np.random.normal(25.0, 10.0, size=num_records) + (10 - satisfaction) * 4.0, 5, 120).astype(int)
    
    # Calculate target Stress Level using Burnout Prediction Formula:
    # Stress Score = (Working Hours * 0.3) + (Overtime Hours * 0.2) + (Task Load * 0.2) + (Meeting Hours * 0.1) - (Satisfaction Score * 0.2)
    stress_scores = []
    stress_levels = []
    
    for idx in range(num_records):
        wh = working_hours[idx]
        oth = overtime_hours[idx]
        task_load = tasks[idx]
        mh = meetings[idx]
        sat = satisfaction[idx]
        
        # Raw score from formula
        raw_score = (wh * 0.3) + (oth * 0.2) + (task_load * 0.2) + (mh * 0.1) - (sat * 0.2)
        
        # Add slight random noise to simulate real-world variance
        score_with_noise = raw_score + np.random.normal(0, 0.2)
        stress_scores.append(round(score_with_noise, 3))
        
        # Categorize stress levels:
        # Low Stress: < 3.2
        # Medium Stress: 3.2 to 5.2
        # High Stress: > 5.2
        if score_with_noise < 3.2:
            stress_levels.append("Low")
        elif score_with_noise <= 5.2:
            stress_levels.append("Medium")
        else:
            stress_levels.append("High")
            
    df = pd.DataFrame({
        "Employee ID": employee_ids,
        "Working Hours": working_hours,
        "Overtime Hours": overtime_hours,
        "Number of Tasks": tasks,
        "Meeting Hours": meetings,
        "Leave Count": leaves,
        "Satisfaction Score": satisfaction,
        "Project Deadlines": deadlines,
        "Code Commits": commits,
        "Work-Life Balance Rating": wlb_rating,
        "Response Time": response_time,
        "Raw Stress Score": stress_scores,
        "Stress Level": stress_levels
    })
    
    return df

def fetch_dataset():
    data_dir = os.path.dirname(os.path.abspath(__file__))
    raw_path = os.path.join(data_dir, "raw_burnout_data.csv")
    metadata_path = os.path.join(data_dir, "source_metadata.json")
    
    # We generate our custom IT company stress dataset matching the user request
    df = generate_synthetic_data()
    df.to_csv(raw_path, index=False)
    
    metadata = {
        "source": "synthetic",
        "description": "IT Company Stress Level Analysis cohort dataset with customized work indicators."
    }
    
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=4)
        
    print(f"Dataset successfully created and written to {raw_path}")
    print(f"Data source metadata written to {metadata_path}")

if __name__ == "__main__":
    fetch_dataset()

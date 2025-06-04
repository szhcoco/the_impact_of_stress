import os
import glob
import pandas as pd

eda_stats = {}

base_dir = 'dataset'
for user_name in os.listdir(base_dir):
    user_path = os.path.join(base_dir, user_name)
    if os.path.isdir(user_path):
        for dataset_id in os.listdir(user_path):
            dataset_path = os.path.join(user_path, dataset_id)
            if os.path.isdir(dataset_path):
                for file in os.listdir(dataset_path):
                    if file.endswith('EDA.csv'):
                        file_path = os.path.join(dataset_path, file)
                        print(f"Reading: {file_path}")
                        df = pd.read_csv(file_path)
                        if 'midterm 2' in dataset_id.lower():
                            for _, row in df.iterrows():
                                time = row['time_seconds']
                                eda = row['EDA']
                                if time not in eda_stats:
                                    eda_stats[time] = {'min': eda, 'max': eda}
                                else:
                                    eda_stats[time]['min'] = min(eda_stats[time]['min'], eda)
                                    eda_stats[time]['max'] = max(eda_stats[time]['max'], eda)

result_df = pd.DataFrame([
    {'time_seconds': time, 'EDA_min': values['min'], 'EDA_max': values['max']}
    for time, values in sorted(eda_stats.items())
])
result_df.to_csv('eda_min_max.csv', index=False)

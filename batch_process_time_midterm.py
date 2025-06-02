import numpy as np
import pandas as pd
import os

# Load the dataset


def process_data(file_path, test_duration):
    df = pd.read_csv(file_path)
    window_size = 5
    df['EDA_smooth'] = df['EDA'].rolling(window=window_size, center=True).mean()

    df['EDA_derivative'] = df['EDA_smooth'].diff()

    threshold = 0.02
    fluctuation_start_index = df[df['EDA_derivative'] > threshold].index.min()

    origin_index = fluctuation_start_index + 1200
    df['time_seconds'] = (df.index - origin_index) / 4.0

    df_filtered = df[(df['time_seconds'] >= -300) & (df['time_seconds'] <= test_duration+300)].reset_index(drop=True)
    df_filtered = df_filtered[['EDA', 'timestamp', 'time_seconds']]

    period = []
    for i in df_filtered['time_seconds']:
        if i < 0:
            period.append('pre-test')
        elif i <= test_duration:
            period.append('in-test')
        else:
            period.append('post-test')
    df_filtered['period'] = period

    df_filtered.to_csv(file_path, index=False)

    # heart rate
    df = pd.read_csv(file_path.replace('EDA', 'HR'))
    df = df[(df['timestamp'] >= df_filtered['timestamp'].iloc[0]) & (df['timestamp'] <= df_filtered['timestamp'].iloc[-1])].reset_index(drop=True)
    df['time_seconds'] = df.index - 300
    period = []
    for i in df['time_seconds']:
        if i < 0:
            period.append('pre-test')
        elif i <= test_duration:
            period.append('in-test')
        else:
            period.append('post-test')
    df['period'] = period
    df.to_csv(file_path.replace('EDA', 'HR'), index=False)



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
                        if 'midterm' in dataset_id.lower():
                            process_data(file_path, 5400)
                        else:
                            process_data(file_path, 10800)
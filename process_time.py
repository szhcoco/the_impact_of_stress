import numpy as np
import pandas as pd

# Load the dataset
file_path = 'eda_midterm1.csv'
df = pd.read_csv(file_path)
# Step 1: Apply a moving average to smooth the EDA signal
window_size = 20  # 5 seconds window (4Hz * 5 = 20)
df['EDA_smooth'] = df['EDA'].rolling(window=window_size, center=True).mean()

# Step 2: Compute the first derivative to detect fluctuation
df['EDA_derivative'] = df['EDA_smooth'].diff()

# Step 3: Detect the first significant rise
# We define "significant" as derivative above a threshold; empirically chosen
threshold = 0.01
fluctuation_start_index = df[df['EDA_derivative'] > threshold].index.min()

# Step 4: Set new time so that this point is at t = -300 (5 minutes before exam start)
# New origin index = fluctuation_start_index + 1200
origin_index = fluctuation_start_index + 1200
df['time_seconds'] = (df.index - origin_index) / 4.0  # 4Hz sampling rate

df_filtered = df[(df['time_seconds'] >= -300) & (df['time_seconds'] <= 5700)].reset_index(drop=True)
df_filtered = df_filtered[['EDA', 'time_seconds']]
# df_filtered = df

period = []
for i in df_filtered['time_seconds']:
    if i < 0:
        period.append('pre-test')
    elif i <= 5400:
        period.append('in-test')
    else:
        period.append('post-test')
df_filtered['period'] = period

df_filtered.to_csv(file_path, index=False)
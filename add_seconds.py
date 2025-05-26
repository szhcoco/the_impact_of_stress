import pandas as pd

# Load the uploaded CSV file
file_path = "hr_final.csv"
df = pd.read_csv(file_path)


df['time_seconds'] = df.index

# Save to a new CSV file for loading via D3.js
output_path = "hr_final.csv"
df.to_csv(output_path, index=False)
import numpy as np
import pandas as pd

# Load the dataset
file_path = 'eda_midterm1.csv'
df = pd.read_csv(file_path)

df = df[['EDA']]

df.to_csv(file_path, index=False)
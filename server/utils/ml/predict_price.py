import sys
import pandas as pd
import joblib
import json

# Load model
model = joblib.load("price_drop_predictor.pkl")

# Read JSON input from Node
input_json = sys.stdin.read()
input_data = json.loads(input_json)
df = pd.DataFrame([input_data])

# Predict
prediction = model.predict(df)

# Output result
print(prediction[0])

import os
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import joblib

def train_model():
    dataset_path = os.path.join(os.path.dirname(__file__), "..", "datasets", "expenses_train.csv")
    model_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    backend_model_dir = os.path.join(os.path.dirname(__file__), "..", "..", "backend", "app", "ml")
    
    os.makedirs(model_dir, exist_ok=True)
    os.makedirs(backend_model_dir, exist_ok=True)
    
    df = pd.read_csv(dataset_path)
    X = df["text"].astype(str)
    y = df["category"].astype(str)
    
    # TF-IDF + Logistic Regression Pipeline
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), lowercase=True, max_features=5000, sublinear_tf=True)),
        ("clf", LogisticRegression(C=2.0, max_iter=1000, solver="lbfgs"))
    ])
    
    pipeline.fit(X, y)
    print(f"Trained model on {len(df)} samples across {len(np.unique(y))} categories: {np.unique(y)}")
    
    # Save model
    model_file = os.path.join(model_dir, "categorizer.joblib")
    backend_model_file = os.path.join(backend_model_dir, "categorizer.joblib")
    
    joblib.dump(pipeline, model_file)
    joblib.dump(pipeline, backend_model_file)
    print(f"Model successfully saved to:\n - {model_file}\n - {backend_model_file}")

if __name__ == "__main__":
    train_model()

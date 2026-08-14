# ──────────────────────────────────────────────────────────────
# FILE: train_model.py
# WHERE IT IS: django-predict-service/model/train_model.py
# WHAT IT DOES: Complete Data Wrangling & Machine Learning Pipeline
#               STRICTLY ACCORDING TO UNITS 1–10 CURRICULUM CONCEPTS
# ──────────────────────────────────────────────────────────────

import os
import sys
import time
import math
import warnings

# Environment variable setup to prevent joblib loky process search warning on Windows 11
os.environ['LOKY_MAX_CPU_COUNT'] = str(os.cpu_count() or 4)
warnings.filterwarnings('ignore', category=UserWarning, module='joblib')

try:
    import joblib.externals.loky.backend.context as loky_context
    loky_context._count_physical_cores = lambda: (os.cpu_count() or 4, None)
except Exception:
    pass

import joblib
import numpy as np
import pandas as pd
import networkx as nx
from datetime import datetime

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.ensemble import HistGradientBoostingClassifier, HistGradientBoostingRegressor, RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.metrics import (
    confusion_matrix, accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, mean_absolute_error, mean_squared_error, r2_score
)

SUPPORTED_CROPS = [
    'wheat', 'rice', 'cotton', 'sugarcane', 'maize', 'soybean',
    'mustard', 'pulse', 'groundnut', 'jute', 'potato', 'onion'
]

CROP_BASE_PRICES = {
    'wheat': 2450, 'rice': 3100, 'cotton': 6200, 'sugarcane': 350,
    'maize': 2100, 'soybean': 4500, 'mustard': 5400, 'pulse': 6800,
    'groundnut': 5900, 'jute': 4700, 'potato': 1400, 'onion': 1800
}


def build_pandas_agricultural_dataset(n_samples=100000, random_state=42):
    """
    DATA MANIPULATION & ANALYSIS WITH PANDAS
    - DataFrame & Series creation
    - Data inspection: shape, info(), describe()
    - Data types: Qualitative (crop names) vs Quantitative (prices, supply, demand)
    - loc[] vs iloc[] access & slicing
    - Boolean Indexing / Filtering
    - Missing Data & Duplicates: dropna(how='any', subset=['crop']), fillna(), drop_duplicates(keep='first')
    - Data Transformations: sort_values(ascending=[True, False]), sort_index(), replace(), astype(), apply(), unique(), nunique()
    - Grouping & Aggregation: groupby(), agg(), nth(), concat(), merge(), crosstab()
    - Statistics & Outliers: corr(), IQR outlier bounds
    """
    print(f"📊 Building Pandas DataFrame with {n_samples:,} samples...")
    np.random.seed(random_state)

    crops = np.random.choice(SUPPORTED_CROPS, size=n_samples)
    crop_codes = np.array([SUPPORTED_CROPS.index(c) for c in crops], dtype=int)

    base_prices = np.array([CROP_BASE_PRICES[c] for c in crops], dtype=float)
    previous_prices = np.round(np.random.normal(base_prices, base_prices * 0.12), 2)
    previous_prices = np.maximum(10.0, previous_prices)

    supply_volumes = np.round(np.random.uniform(30.0, 450.0, size=n_samples), 2)
    transport_indices = np.round(np.clip(np.random.normal(105.0, 15.0, size=n_samples), 50.0, 200.0), 2)
    demand_scores = np.round(np.random.uniform(1.0, 10.0, size=n_samples), 2)

    spot_momentum_pct = np.random.normal(0.005, 0.035, size=n_samples)
    spot_prices = np.round(previous_prices * (1.0 + spot_momentum_pct), 2)
    hist_7d_avgs = np.round(spot_prices * (1.0 + np.random.normal(0.0, 0.02, size=n_samples)), 2)

    # Domain-specific quantitative Indian agricultural features
    weather_impact_scores = np.round(np.random.uniform(0.10, 1.00, size=n_samples), 2)
    msp_difference_pcts = np.round(np.random.uniform(-0.25, 0.25, size=n_samples), 4)

    # 1.1 DataFrame & Series Construction
    raw_data = {
        'crop': crops,                                    # Qualitative data (categorical string)
        'crop_code': crop_codes,                          # Quantitative integer label
        'previous_price': previous_prices,                # Quantitative float price
        'supply_volume': supply_volumes,                  # Quantitative float volume
        'transport_cost_index': transport_indices,        # Quantitative float index
        'market_demand_score': demand_scores,             # Quantitative float score
        'spot_price': spot_prices,                        # Quantitative float price
        'historical_7d_avg': hist_7d_avgs,                # Quantitative float price
        'weather_impact_score': weather_impact_scores,    # Quantitative float (0.0 drought - 1.0 ideal)
        'msp_difference_pct': msp_difference_pcts          # Quantitative float (% variance vs Govt MSP)
    }
    df = pd.DataFrame(raw_data)

    # Series demonstration
    price_series = pd.Series(spot_prices, name="spot_price_series")

    # Data Inspection Attributes & Methods
    df_shape = df.shape       # Tuple (rows, columns)
    describe_dict = df.describe().round(2).to_dict()  # Descriptive statistics summary

    # 1.2 Data Access & Transformation (apply, astype, loc, iloc)
    df['spot_momentum'] = df.apply(
        lambda row: (row['spot_price'] - row['previous_price']) / max(1.0, row['previous_price']), axis=1
    )
    df['historical_diff'] = df.apply(
        lambda row: (row['spot_price'] - row['historical_7d_avg']) / max(1.0, row['historical_7d_avg']), axis=1
    )
    df['crop_code'] = df['crop_code'].astype(int)

    # 1.3 Missing Data & Duplicates Handling (dropna, fillna, drop_duplicates)
    df = df.dropna(how='any', subset=['crop', 'previous_price'])
    df = df.ffill().fillna(0)
    df = df.drop_duplicates(subset=['crop', 'previous_price', 'supply_volume'], keep='first')

    # 1.4 Sorting & Indexing (sort_values, sort_index)
    df = df.sort_values(by=['crop', 'spot_price'], ascending=[True, False]).reset_index(drop=True)
    df = df.sort_index(axis=0)

    # 1.5 Boolean Indexing & Position Filtering (loc vs iloc)
    high_demand_df = df.loc[(df['market_demand_score'] >= 7.0) & (df['supply_volume'] <= 250.0)]
    subset_iloc = df.iloc[0:10, 0:5]

    # Value Replacement (replace)
    df['market_segment'] = df['market_demand_score'].apply(lambda x: 'HIGH' if x >= 7.0 else 'NORMAL')

    # 1.6 Aggregation & Grouping (groupby, agg, nth, crosstab)
    groupby_summary = df.groupby('crop').agg({
        'previous_price': ['mean', 'min', 'max', 'std'],
        'supply_volume': ['mean', 'sum'],
        'spot_price': 'mean'
    })
    groupby_summary.columns = ['_'.join(c).strip() for c in groupby_summary.columns.values]
    groupby_dict = groupby_summary.reset_index().to_dict(orient='records')

    first_row_per_group = df.groupby('crop').nth(0).reset_index().to_dict(orient='records')
    crosstab_table = pd.crosstab(df['crop'], df['market_segment']).to_dict()

    unique_crops = df['crop'].unique().tolist()
    nunique_crops = int(df['crop'].nunique())

    # Preprocessing: Binning continuous demand scores into categories
    df['demand_category'] = pd.cut(
        df['market_demand_score'],
        bins=[0, 3.5, 7.0, 10.0],
        labels=['Low', 'Medium', 'High']
    )

    # Categorical One-Hot Encoding (get_dummies)
    dummies_df = pd.get_dummies(df[['crop']], prefix='crop')

    # 1.7 Correlation Analysis (corr())
    numeric_cols = ['previous_price', 'supply_volume', 'transport_cost_index', 'market_demand_score', 'spot_price', 'spot_momentum', 'weather_impact_score', 'msp_difference_pct']
    corr_matrix = df[numeric_cols].corr().round(4).to_dict()

    # 1.8 IQR Outlier Detection
    q1 = df['spot_price'].quantile(0.25)
    q3 = df['spot_price'].quantile(0.75)
    iqr = q3 - q1
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr
    outliers_df = df.loc[(df['spot_price'] < lower_bound) | (df['spot_price'] > upper_bound)]
    outlier_count = len(outliers_df)

    # Derived Target Signals incorporating Weather and MSP heuristics
    demand_weight = (df['market_demand_score'] - 5.0) * 0.38
    supply_pressure = -((df['supply_volume'] - 100.0) / 200.0) * 0.28
    freight_penalty = -((df['transport_cost_index'] - 100.0) / 100.0) * 0.14
    weather_weight = (df['weather_impact_score'] - 0.5) * 0.35
    msp_weight = df['msp_difference_pct'] * 0.55

    latent_signal = (
        0.30 * demand_weight +
        0.35 * supply_pressure +
        0.15 * freight_penalty +
        0.25 * weather_weight +
        0.35 * msp_weight +
        2.20 * df['spot_momentum'] +
        1.40 * df['historical_diff'] +
        np.random.normal(0.0, 0.25, size=len(df))
    )

    df['target_direction'] = (latent_signal >= 0.0).astype(int)
    df['target_price'] = np.round(df['previous_price'] * (1.0 + np.clip(latent_signal * 0.032, -0.15, 0.20)), 2)

    # UNIT 2: NetworkX Graph Creation
    G_undirected = nx.Graph()
    G_directed = nx.DiGraph()
    for crop in SUPPORTED_CROPS:
        G_undirected.add_node(crop)
        G_directed.add_node(crop)
    for i in range(len(SUPPORTED_CROPS) - 1):
        G_undirected.add_edge(SUPPORTED_CROPS[i], SUPPORTED_CROPS[i+1], weight=1.5)
        G_directed.add_edge(SUPPORTED_CROPS[i], SUPPORTED_CROPS[i+1], weight=2.0)

    network_graph_info = {
        'undirected_nodes': len(G_undirected.nodes()),
        'undirected_edges': len(G_undirected.edges()),
        'directed_nodes': len(G_directed.nodes()),
        'directed_edges': len(G_directed.edges())
    }

    pandas_analytics = {
        'shape': list(df_shape),
        'total_records': len(df),
        'unique_crops': nunique_crops,
        'crop_list': unique_crops,
        'describe': describe_dict,
        'groupby_aggregations': groupby_dict,
        'crosstab_summary': crosstab_table,
        'correlation_matrix': corr_matrix,
        'iqr_outliers': {
            'q1': float(round(q1, 2)),
            'q3': float(round(q3, 2)),
            'iqr': float(round(iqr, 2)),
            'lower_bound': float(round(lower_bound, 2)),
            'upper_bound': float(round(upper_bound, 2)),
            'outlier_count': outlier_count,
            'outlier_percentage': float(round((outlier_count / len(df)) * 100, 2))
        },
        'network_graph': network_graph_info
    }

    return df, pandas_analytics


def train_models_and_evaluate(df):
    """
    MACHINE LEARNING PREPROCESSING, REGRESSION ANALYSIS & SUPERVISED CLASSIFICATION
    """
    print("⚡Partitioning train/test sets & training ML models...")

    feature_cols = [
        'crop_code', 'previous_price', 'supply_volume',
        'transport_cost_index', 'market_demand_score',
        'spot_price', 'historical_7d_avg', 'spot_momentum',
        'weather_impact_score', 'msp_difference_pct'
    ]

    X = df[feature_cols].values
    y_class = df['target_direction'].values
    y_reg = df['target_price'].values

    # Unit 3: Model Validation (Train-Test Split)
    X_train, X_test, y_class_train, y_class_test, y_reg_train, y_reg_test = train_test_split(
        X, y_class, y_reg, test_size=0.20, random_state=42, stratify=y_class
    )

    # -----------------------------------------------------------
    # UNIT 4: REGRESSION ANALYSIS
    # -----------------------------------------------------------
    lin_reg = LinearRegression()
    lin_reg.fit(X_train, y_reg_train)
    y_lin_pred = lin_reg.predict(X_test)

    lin_r2 = r2_score(y_reg_test, y_lin_pred)
    lin_mse = mean_squared_error(y_reg_test, y_lin_pred)
    lin_rmse = math.sqrt(lin_mse)
    lin_mae = mean_absolute_error(y_reg_test, y_lin_pred)

    linear_regression_metrics = {
        'model_name': 'Multiple Linear Regression',
        'intercept': float(round(lin_reg.intercept_, 4)),
        'coefficients': {col: float(round(coef, 4)) for col, coef in zip(feature_cols, lin_reg.coef_)},
        'r2_score': float(round(lin_r2, 4)),
        'mse': float(round(lin_mse, 2)),
        'rmse': float(round(lin_rmse, 2)),
        'mae_inr': float(round(lin_mae, 2))
    }

    # Production GBDT Regressor Pipeline
    reg_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('regressor', HistGradientBoostingRegressor(
            max_iter=200, learning_rate=0.08, max_depth=8, l2_regularization=1.5, random_state=42
        ))
    ])
    reg_pipeline.fit(X_train, y_reg_train)
    y_reg_pred = reg_pipeline.predict(X_test)

    reg_r2 = r2_score(y_reg_test, y_reg_pred)
    reg_mse = mean_squared_error(y_reg_test, y_reg_pred)
    reg_mae = mean_absolute_error(y_reg_test, y_reg_pred)
    reg_rmse = math.sqrt(reg_mse)

    # -----------------------------------------------------------
    # UNIT 5: SUPERVISED CLASSIFICATION METHODS & CONFUSION MATRIX
    # -----------------------------------------------------------
    # Primary Classifier: HistGradientBoostingClassifier
    clf_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', HistGradientBoostingClassifier(
            max_iter=200, learning_rate=0.08, max_depth=8, l2_regularization=1.5, random_state=42
        ))
    ])
    clf_pipeline.fit(X_train, y_class_train)

    y_class_pred = clf_pipeline.predict(X_test)
    y_class_proba = clf_pipeline.predict_proba(X_test)[:, 1]

    # Confusion Matrix: [[TN, FP], [FN, TP]]
    tn, fp, fn, tp = confusion_matrix(y_class_test, y_class_pred).ravel()
    total_preds = tn + fp + fn + tp

    # Derived Performance Formulas (Unit 5)
    accuracy = (tp + tn) / total_preds
    sensitivity_recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    error_rate = (fp + fn) / total_preds
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    f1 = 2 * (precision * sensitivity_recall) / (precision + sensitivity_recall) if (precision + sensitivity_recall) > 0 else 0.0
    auc = roc_auc_score(y_class_test, y_class_proba)

    classification_metrics = {
        'confusion_matrix': {
            'true_positives_tp': int(tp),
            'true_negatives_tn': int(tn),
            'false_positives_fp': int(fp),
            'false_negatives_fn': int(fn),
            'total_predictions': int(total_preds)
        },
        'derived_formulas': {
            'accuracy_pct': float(round(accuracy * 100, 2)),
            'sensitivity_recall_pct': float(round(sensitivity_recall * 100, 2)),
            'specificity_pct': float(round(specificity * 100, 2)),
            'error_rate_pct': float(round(error_rate * 100, 2)),
            'precision_pct': float(round(precision * 100, 2)),
            'f1_score_pct': float(round(f1 * 100, 2)),
            'roc_auc_score': float(round(auc, 4))
        }
    }

    # Supervised Classifier Comparators (kNN, Decision Tree, Random Forest, SVM)
    sample_indices = np.random.choice(len(X_train), size=min(10000, len(X_train)), replace=False)
    X_sub = X_train[sample_indices]
    y_sub = y_class_train[sample_indices]

    knn_clf = KNeighborsClassifier(n_neighbors=5, metric='euclidean')
    knn_clf.fit(X_sub, y_sub)

    rf_clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
    rf_clf.fit(X_sub, y_sub)
    rf_importances = {col: float(round(imp, 4)) for col, imp in zip(feature_cols, rf_clf.feature_importances_)}

    dt_clf = DecisionTreeClassifier(criterion='entropy', max_depth=8, random_state=42)
    dt_clf.fit(X_sub, y_sub)
    dt_importances = {col: float(round(imp, 4)) for col, imp in zip(feature_cols, dt_clf.feature_importances_)}

    svc_clf = SVC(kernel='rbf', C=1.0, probability=True, random_state=42)
    svc_clf.fit(X_sub[:2000], y_sub[:2000])

    feature_contributions = {
        'random_forest_importances': rf_importances,
        'decision_tree_importances': dt_importances,
        'linear_regression_coefficients': linear_regression_metrics['coefficients']
    }

    # -----------------------------------------------------------
    # VISUALIZATION & DEEP LEARNING PAYLOADS
    # -----------------------------------------------------------
    chart_payloads = {
        'heatmap': {
            'chart_type': 'sns.heatmap / px.imshow',
            'title': 'Feature Correlation Matrix',
            'cmap': 'coolwarm',
            'annot': True,
            'data': df[['previous_price', 'supply_volume', 'transport_cost_index', 'market_demand_score', 'spot_price']].corr().round(2).to_dict()
        },
        'bar_chart': {
            'chart_type': 'px.bar',
            'title': 'Average Spot Price by Commodity',
            'barmode': 'group',
            'orientation': 'v',
            'data': df.groupby('crop')['spot_price'].mean().round(2).to_dict()
        },
        'boxplot': {
            'chart_type': 'sns.boxplot',
            'title': 'Five-Number Summary Price Distribution',
            'data': {
                'min': float(df['spot_price'].min()),
                'q1_25': float(df['spot_price'].quantile(0.25)),
                'median_q2': float(df['spot_price'].median()),
                'q3_75': float(df['spot_price'].quantile(0.75)),
                'max': float(df['spot_price'].max())
            }
        },
        'scatter_3d': {
            'chart_type': 'px.scatter_3d',
            'title': 'Supply vs Freight vs Price Dynamics',
            'dimensions': ['supply_volume', 'transport_cost_index', 'spot_price']
        }
    }

    # Deep Learning (CNN) Specs Structure
    cnn_specs = {
        'framework': 'TensorFlow & Keras API',
        'architecture': 'Convolutional Neural Network (CNN)',
        'layers': [
            {'layer': 'Conv2D', 'filters': 32, 'kernel_size': '(3,3)', 'activation': 'ReLU', 'stride': 1},
            {'layer': 'MaxPooling2D', 'pool_size': '(2,2)'},
            {'layer': 'BatchNormalization'},
            {'layer': 'Conv2D', 'filters': 64, 'kernel_size': '(3,3)', 'activation': 'ReLU'},
            {'layer': 'MaxPooling2D', 'pool_size': '(2,2)'},
            {'layer': 'Dropout', 'rate': 0.25},
            {'layer': 'Flatten'},
            {'layer': 'Dense', 'units': 128, 'activation': 'ReLU'},
            {'layer': 'Dense', 'units': 2, 'activation': 'Softmax'}
        ],
        'compile_params': {'loss': 'categorical_crossentropy', 'optimizer': 'adam', 'metrics': ['accuracy']}
    }

    return {
        'clf_pipeline': clf_pipeline,
        'reg_pipeline': reg_pipeline,
        'feature_names': feature_cols,
        'classification_metrics': classification_metrics,
        'linear_regression_metrics': linear_regression_metrics,
        'gbdt_regressor_metrics': {
            'r2_score': float(round(reg_r2, 4)),
            'mse': float(round(reg_mse, 2)),
            'mae_inr': float(round(reg_mae, 2)),
            'rmse_inr': float(round(reg_rmse, 2))
        },
        'feature_contributions': feature_contributions,
        'chart_payloads': chart_payloads,
        'cnn_specs': cnn_specs
    }


def main():
    start_time = time.time()
    print("==================================================================")
    print("🚀 AGRI-PULSE AI — ML & ANALYTICS PIPELINE")
    print("==================================================================")

    df, pandas_analytics = build_pandas_agricultural_dataset(n_samples=100000)
    results = train_models_and_evaluate(df)

    artifacts_dir = os.path.join(os.path.dirname(__file__), 'artifacts')
    os.makedirs(artifacts_dir, exist_ok=True)
    model_filepath = os.path.join(artifacts_dir, 'agripulse_sklearn_models.joblib')

    model_package = {
        'classifier_pipeline': results['clf_pipeline'],
        'regressor_pipeline': results['reg_pipeline'],
        'feature_names': results['feature_names'],
        'pandas_analytics': pandas_analytics,
        'classification_metrics': results['classification_metrics'],
        'linear_regression_metrics': results['linear_regression_metrics'],
        'gbdt_regressor_metrics': results['gbdt_regressor_metrics'],
        'feature_contributions': results['feature_contributions'],
        'chart_payloads': results['chart_payloads'],
        'cnn_specs': results['cnn_specs'],
        'scikit_learn_version': sys.modules['sklearn'].__version__,
        'pandas_version': pd.__version__,
        'dataset_samples': len(df),
        'trained_at': datetime.utcnow().isoformat() + "Z"
    }

    joblib.dump(model_package, model_filepath, compress=3)

    file_size_mb = os.path.getsize(model_filepath) / (1024 * 1024)
    elapsed = round(time.time() - start_time, 2)

    print("\n✅ CONFUSION MATRIX RESULTS (20,000 Test Records):")
    cm = results['classification_metrics']['confusion_matrix']
    print(f"   - True Positives (TP):  {cm['true_positives_tp']:,}")
    print(f"   - True Negatives (TN):  {cm['true_negatives_tn']:,}")
    print(f"   - False Positives (FP): {cm['false_positives_fp']:,}")
    print(f"   - False Negatives (FN): {cm['false_negatives_fn']:,}")

    fmt = results['classification_metrics']['derived_formulas']
    print(f"\n✅ DERIVED CLASSIFICATION METRICS:")
    print(f"   - Accuracy:            {fmt['accuracy_pct']}%")
    print(f"   - Sensitivity/Recall:  {fmt['sensitivity_recall_pct']}%")
    print(f"   - Specificity:         {fmt['specificity_pct']}%")
    print(f"   - Error Rate:          {fmt['error_rate_pct']}%")
    print(f"   - Precision:           {fmt['precision_pct']}%")
    print(f"   - F1 Score:            {fmt['f1_score_pct']}%")

    print("\n==================================================================")
    print(f"🎉 PIPELINE EXECUTED AND ARTIFACT SAVED!")
    print(f"📁 Location: {model_filepath}")
    print(f"📦 File Size: {file_size_mb:.2f} MB | Time: {elapsed}s")
    print("==================================================================")


if __name__ == '__main__':
    main()

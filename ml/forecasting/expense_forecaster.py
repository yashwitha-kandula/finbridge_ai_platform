import numpy as np
from sklearn.linear_model import LinearRegression


class ExpenseForecaster:

    def __init__(self):
        self.model = LinearRegression()
        self.is_trained = False

    def train(self, monthly_expenses):

        if len(monthly_expenses) < 2:
            raise ValueError(
                "At least two months of data are required."
            )

        X = np.arange(
            1,
            len(monthly_expenses) + 1
        ).reshape(-1, 1)

        y = np.array(monthly_expenses)

        self.model.fit(X, y)

        self.n_months = len(monthly_expenses)
        self.is_trained = True

    def predict(self, months_ahead=1):

        if not self.is_trained:
            raise ValueError(
                "Model has not been trained."
            )

        # Next unseen month index (training used 1..n_months).
        # Previously used model.n_features_in_ (always 1), which
        # re-predicted the first month instead of the future.
        next_month = self.n_months + 1

        X = np.array([
            [next_month + months_ahead - 1]
        ])

        prediction = self.model.predict(X)[0]

        return max(0, round(float(prediction), 2))
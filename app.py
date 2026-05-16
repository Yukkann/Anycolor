from flask import Flask, jsonify, render_template
import json
from pathlib import Path

import yfinance as yf

app = Flask(__name__)
BASE_DIR = Path(__file__).resolve().parent
EVENTS_PATH = BASE_DIR / "events.json"


def load_events():
    with EVENTS_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_stock_history():
    stock = yf.download(
        "5032.T",
        start="2024-01-01",
        end="2027-01-01",
        auto_adjust=False,
        progress=False,
    )

    if stock.empty or "Close" not in stock:
        return {
            "dates": [],
            "prices": [],
        }

    close_prices = stock["Close"].ffill()
    if hasattr(close_prices, "columns"):
        close_prices = close_prices["5032.T"] if "5032.T" in close_prices else close_prices.iloc[:, 0]

    close_prices = close_prices.dropna()
    dates = close_prices.index.strftime("%Y-%m-%d").tolist()
    prices = [round(float(price), 2) for price in close_prices.tolist()]

    return {
        "dates": dates,
        "prices": prices,
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/data")
def get_data():
    stock_data = load_stock_history()
    return jsonify(
        {
            "dates": stock_data["dates"],
            "prices": stock_data["prices"],
            "events": load_events(),
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)

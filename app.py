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

    dates = stock.index.strftime("%Y-%m-%d").tolist()
    close_prices = stock["Close"].ffill().tolist()

    return {
        "dates": dates,
        "prices": close_prices,
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
    app.run(debug=True)

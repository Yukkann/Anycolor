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


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/data")
def get_data():
    stock = yf.download("5032.T", period="6mo", auto_adjust=False)

    dates = stock.index.strftime("%Y-%m-%d").tolist()
    prices = stock["Close"].ffill().tolist()

    return jsonify(
        {
            "dates": dates,
            "prices": prices,
            "events": load_events(),
        }
    )


if __name__ == "__main__":
    app.run(debug=True)

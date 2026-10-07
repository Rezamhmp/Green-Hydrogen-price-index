"""
Yahoo Finance data service.

This module downloads daily NG=F data from Yahoo Finance and
converts it into the hydrogen-price history used by the website.
"""

from pathlib import Path
from datetime import datetime, timezone

import pandas as pd
import yfinance as yf

from model import calculate_hydrogen_price


# ============================================================
# SETTINGS
# ============================================================

TICKER = "NG=F"

DATA_FILE = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "prices.json"
)


# ============================================================
# DOWNLOAD NATURAL GAS DATA
# ============================================================

def download_natural_gas_data(period: str = "10y") -> pd.DataFrame:
    """
    Download daily natural gas futures data from Yahoo Finance.
    """

    data = yf.download(
        TICKER,
        period=period,
        interval="1d",
        auto_adjust=False,
        progress=False,
    )

    if data.empty:
        raise RuntimeError(
            "No natural gas data was returned from Yahoo Finance."
        )

    # yfinance may return MultiIndex columns.
    if isinstance(data.columns, pd.MultiIndex):
        data.columns = data.columns.get_level_values(0)

    data = data.reset_index()

    data["Date"] = pd.to_datetime(data["Date"])

    return data


# ============================================================
# BUILD HYDROGEN PRICE HISTORY
# ============================================================

def build_price_history(data: pd.DataFrame) -> pd.DataFrame:
    """
    Convert natural gas closing prices into hydrogen prices.
    """

    data = data.copy()

    data = data[["Date", "Close"]].dropna()

    data.rename(
        columns={
            "Close": "natural_gas_close"
        },
        inplace=True,
    )

    data["natural_gas_close"] = data[
        "natural_gas_close"
    ].astype(float)

    data["hydrogen_price"] = data[
        "natural_gas_close"
    ].apply(calculate_hydrogen_price)

    data["Date"] = data["Date"].dt.strftime("%Y-%m-%d")

    return data


# ============================================================
# SAVE HISTORY
# ============================================================

def save_price_history(data: pd.DataFrame) -> None:
    """
    Save the calculated history to JSON.
    """

    DATA_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    records = data.to_dict(orient="records")

    import json

    with open(
        DATA_FILE,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            records,
            file,
            indent=2,
            ensure_ascii=False,
        )


# ============================================================
# UPDATE HISTORY
# ============================================================

def update_history() -> None:
    """
    Download Yahoo Finance data and rebuild the local history.
    """

    data = download_natural_gas_data()

    history = build_price_history(data)

    save_price_history(history)

    print(
        f"Updated {len(history)} observations."
    )

    print(
        f"Latest observation: "
        f"{history.iloc[-1]['Date']}"
    )


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    update_history()
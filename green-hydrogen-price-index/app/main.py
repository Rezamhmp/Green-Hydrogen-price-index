"""
FastAPI application for the Green Hydrogen Price Index.
"""

from pathlib import Path
import json
import statistics
import csv
import io

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles


from .model import (
    calculate_hydrogen_price,
    SMR_EFFICIENCY_DEFAULT,
    FIXED_COST_DEFAULT,
    MULTIPLIER_DEFAULT,
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR.parent / "data" / "prices.json"
STATIC_DIR = BASE_DIR / "static"


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="Green Hydrogen Price Index",
    version="1.0.0",
)


# ============================================================
# STATIC FILES
# ============================================================

app.mount(
    "/static",
    StaticFiles(directory=STATIC_DIR),
    name="static",
)

app.mount(
    "/assets",
    StaticFiles(directory=BASE_DIR.parent / "assets"),
    name="assets",
)


# ============================================================
# LOAD DATA
# ============================================================

def load_history():

    if not DATA_FILE.exists():
        return []

    with open(
        DATA_FILE,
        "r",
        encoding="utf-8",
    ) as file:

        return json.load(file)


# ============================================================
# HOME PAGE
# ============================================================

@app.get("/")
def home():

    return FileResponse(
        STATIC_DIR / "index.html"
    )


# ============================================================
# PRICE HISTORY API
# ============================================================

@app.get("/api/history")
def get_history():

    history = load_history()

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Price history is empty. Run update_prices.py first.",
        )

    return {
        "ticker": "NG=F",
        "model": {
            "conversion_factor": 0.05205,
            "smr_efficiency": SMR_EFFICIENCY_DEFAULT,
            "fixed_cost": FIXED_COST_DEFAULT,
            "multiplier": MULTIPLIER_DEFAULT,
        },
        "history": history,
    }


# ============================================================
# CSV DOWNLOAD API
# ============================================================

@app.get("/api/download-csv")
def download_csv(
    start_date: str,
    end_date: str,
):

    history = load_history()

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Price history is empty.",
        )

    # --------------------------------------------------------
    # Available date range
    # --------------------------------------------------------

    available_dates = [
        item["Date"]
        for item in history
    ]

    first_date = min(available_dates)
    last_date = max(available_dates)

    # --------------------------------------------------------
    # Validate requested range
    # --------------------------------------------------------

    if start_date > end_date:

        raise HTTPException(
            status_code=400,
            detail="Start date cannot be later than end date.",
        )

    if (
        start_date < first_date
        or end_date > last_date
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                f"Available date range is "
                f"{first_date} to {last_date}."
            ),
        )

    # --------------------------------------------------------
    # Filter history
    # --------------------------------------------------------

    selected_history = [
        item
        for item in history
        if start_date <= item["Date"] <= end_date
    ]

    if not selected_history:

        raise HTTPException(
            status_code=400,
            detail=(
                "No data is available for "
                "the selected date range."
            ),
        )

    # --------------------------------------------------------
    # Create CSV
    # --------------------------------------------------------

    output = io.StringIO()

    writer = csv.writer(output)

    writer.writerow([
        "Date",
        "Natural Gas Close (USD/MMBtu)",
        "Hydrogen Price (USD/kg H2)",
    ])

    for item in selected_history:

        writer.writerow([
            item["Date"],
            item["natural_gas_close"],
            item["hydrogen_price"],
        ])

    output.seek(0)

    # --------------------------------------------------------
    # Download response
    # --------------------------------------------------------

    filename = (
        f"green_hydrogen_price_"
        f"{start_date}_to_{end_date}.csv"
    )

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )


# ============================================================
# SINGLE PRICE CALCULATION
# ============================================================

@app.get("/api/calculate")
def calculate_price(
    natural_gas_price: float,
    smr_efficiency: float = SMR_EFFICIENCY_DEFAULT,
    fixed_cost: float = FIXED_COST_DEFAULT,
    multiplier: float = MULTIPLIER_DEFAULT,
):

    try:

        price = calculate_hydrogen_price(
            natural_gas_price=natural_gas_price,
            smr_efficiency=smr_efficiency,
            fixed_cost=fixed_cost,
            multiplier=multiplier,
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    return {
        "natural_gas_price": natural_gas_price,
        "hydrogen_price": price,
        "smr_efficiency": smr_efficiency,
        "fixed_cost": fixed_cost,
        "multiplier": multiplier,
    }


# ============================================================
# MODEL INFORMATION
# ============================================================

@app.get("/api/model")
def model_information():

    return {
        "formula": (
            "((Natural Gas Close × 0.05205 / "
            "SMR Efficiency) + Fixed Cost) × Multiplier"
        ),
        "conversion_factor": 0.05205,
        "default_smr_efficiency": SMR_EFFICIENCY_DEFAULT,
        "default_fixed_cost": FIXED_COST_DEFAULT,
        "default_multiplier": MULTIPLIER_DEFAULT,
        "units": {
            "natural_gas": "USD/MMBtu",
            "hydrogen": "USD/kg H2",
            "fixed_cost": "USD/kg H2",
        },
    }
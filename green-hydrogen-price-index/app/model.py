"""
Green Hydrogen Price Model

This module contains the core semi-empirical equation used by the
Green Hydrogen Price Index.

The implementation intentionally follows the author's original
Python formulation:

Hydrogen_Price =
    ((NG_Close * conversion_factor / SMR_efficiency)
     + fixed_cost) * multiplier
"""


# ============================================================
# MODEL PARAMETERS
# ============================================================

SMR_EFFICIENCY_DEFAULT = 0.352

FIXED_COST_DEFAULT = 1.75

CONVERSION_FACTOR = 0.05205

MULTIPLIER_DEFAULT = 4.3


# ============================================================
# CORE MODEL
# ============================================================

def calculate_hydrogen_price(
    natural_gas_price: float,
    smr_efficiency: float = SMR_EFFICIENCY_DEFAULT,
    fixed_cost: float = FIXED_COST_DEFAULT,
    multiplier: float = MULTIPLIER_DEFAULT,
) -> float:
    """
    Calculate indicative green hydrogen price.

    Parameters
    ----------
    natural_gas_price : float
        Natural gas closing price in USD/MMBtu.

    smr_efficiency : float
        Effective SMR mass efficiency.
        Default = 0.352

    fixed_cost : float
        Fixed cost in USD/kg H2.
        Default = 1.75

    multiplier : float
        Green-to-grey hydrogen price multiplier.
        Default = 4.3

    Returns
    -------
    float
        Indicative green hydrogen price in USD/kg H2.
    """

    if natural_gas_price < 0:
        raise ValueError("Natural gas price cannot be negative.")

    if smr_efficiency <= 0:
        raise ValueError("SMR efficiency must be greater than zero.")

    if fixed_cost < 0:
        raise ValueError("Fixed cost cannot be negative.")

    if multiplier <= 0:
        raise ValueError("Multiplier must be greater than zero.")

    hydrogen_price = (
        (
            natural_gas_price
            * CONVERSION_FACTOR
            / smr_efficiency
        )
        + fixed_cost
    ) * multiplier

    return hydrogen_price
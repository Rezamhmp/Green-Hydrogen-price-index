// ============================================================
// GREEN HYDROGEN PRICE INDEX
// Frontend Application
// ============================================================


// ============================================================
// GLOBAL DATA
// ============================================================

let historyData = [];

let selectedIndex = null;

let selectedGasPrice = null;

let selectedHydrogenPrice = null;


// ============================================================
// MODEL STATE
// ============================================================

const DEFAULT_MODEL_VALUES = {
    multiplier: 4.3,
    fixedCost: 1.75,
    smrEfficiency: 0.352
};

let modelState = {
    multiplier: DEFAULT_MODEL_VALUES.multiplier,
    fixedCost: DEFAULT_MODEL_VALUES.fixedCost,
    smrEfficiency: DEFAULT_MODEL_VALUES.smrEfficiency
};


// ============================================================
// DOM ELEMENTS
// ============================================================

const disclaimer =
    document.getElementById("disclaimer");

const agreeCheckbox =
    document.getElementById("agreeCheckbox");

const enterButton =
    document.getElementById("enterButton");


// ============================================================
// DISCLAIMER
// ============================================================

agreeCheckbox.addEventListener(
    "change",
    () => {

        enterButton.disabled =
            !agreeCheckbox.checked;

    }
);


enterButton.addEventListener(
    "click",
    () => {

        disclaimer.style.display = "none";

    }
);


// ============================================================
// LOAD HISTORY
// ============================================================

async function loadHistory() {

    const response =
        await fetch("/api/history");

    if (!response.ok) {

        alert(
            "Price data is not available yet. " +
            "Please run the update script first."
        );

        return;

    }

    const data =
        await response.json();

    historyData =
        data.history;

    initializePage();

}


// ============================================================
// INITIALIZE PAGE
// ============================================================

function initializePage() {

    if (!historyData.length) {
        return;
    }

    selectedIndex =
        historyData.length - 1;

    updateSelectedObservation();

    renderMainChart();

    renderMultiplierSensitivity();

    renderFixedCostSensitivity();

    updateStatistics();

}


// ============================================================
// CURRENT OBSERVATION
// ============================================================

function updateSelectedObservation() {

    const observation =
        historyData[selectedIndex];

    selectedGasPrice =
        Number(
            observation.natural_gas_close
        );


    // Recalculate the selected hydrogen price
    // using the CURRENT user-defined model parameters.

    selectedHydrogenPrice =
        calculateHydrogenPrice(
            selectedGasPrice,
            modelState.smrEfficiency,
            modelState.fixedCost,
            modelState.multiplier
        );


    document.getElementById(
        "currentPrice"
    ).textContent =
        formatHydrogenPrice(
            selectedHydrogenPrice
        );


    document.getElementById(
        "currentDate"
    ).textContent =
        observation.Date;


    document.getElementById(
        "gasPrice"
    ).textContent =
        selectedGasPrice.toFixed(4);


    document.getElementById(
        "selectedDate"
    ).textContent =
        observation.Date;


    document.getElementById(
        "selectedHydrogen"
    ).textContent =
        formatHydrogenPrice(
            selectedHydrogenPrice
        );


    document.getElementById(
        "selectedGas"
    ).textContent =
        selectedGasPrice.toFixed(4);


    renderMultiplierSensitivity();

    renderFixedCostSensitivity();

    updateStatistics();

}


// ============================================================
// FORMAT PRICE
// ============================================================

function formatHydrogenPrice(price) {

    return (
        "$" +
        Number(price).toFixed(2) +
        " / kg"
    );

}


// ============================================================
// HYDROGEN MODEL
// ============================================================

function calculateHydrogenPrice(
    gasPrice,
    smrEfficiency,
    fixedCost,
    multiplier
) {

    const conversionFactor =
        0.05205;

    return (
        (
            gasPrice
            * conversionFactor
            / smrEfficiency
        )
        + fixedCost
    )
    * multiplier;

}


// ============================================================
// CSV DOWNLOAD POPUP
// ============================================================

function openCsvDownloadModal() {

    const existingPopup =
        document.getElementById("csvDownloadModal");

    if (existingPopup) {
        existingPopup.remove();
    }

    if (!historyData.length) {
        return;
    }

    // --------------------------------------------------------
    // Available date range
    // --------------------------------------------------------

    const availableDates =
        historyData
            .map(item => item.Date)
            .sort();

    const firstDate =
        availableDates[0];

    const lastDate =
        availableDates[availableDates.length - 1];

    // --------------------------------------------------------
    // Find the CSV button
    // --------------------------------------------------------

    const csvButton =
        document.querySelector(
            '.modebar-btn[data-title="Download CSV"]'
        );

    // --------------------------------------------------------
    // Create popup
    // --------------------------------------------------------

    const popup =
        document.createElement("div");

    popup.id =
        "csvDownloadModal";

    popup.innerHTML = `
        <div class="csv-modal-content">

            <div class="csv-modal-header">

                <div>
                    <div class="csv-modal-title">
                        Download CSV
                    </div>

                    <div class="csv-modal-subtitle">
                        Select the date range to export.
                    </div>
                </div>

                <button
                    type="button"
                    class="csv-close-button"
                    id="csvCloseButton"
                    aria-label="Close"
                >
                    ×
                </button>

            </div>

            <div class="csv-date-fields">

                <label>
                    <span>Start Date</span>

                    <input
                        type="date"
                        id="csvStartDate"
                        value="${firstDate}"
                        min="${firstDate}"
                        max="${lastDate}"
                    >
                </label>

                <label>
                    <span>End Date</span>

                    <input
                        type="date"
                        id="csvEndDate"
                        value="${lastDate}"
                        min="${firstDate}"
                        max="${lastDate}"
                    >
                </label>

            </div>

            <div
                id="csvDownloadError"
                class="csv-download-error"
            ></div>

            <div class="csv-modal-actions">

                <button
                    type="button"
                    id="csvCancelButton"
                    class="csv-cancel-button"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    id="csvConfirmButton"
                    class="csv-download-button"
                >
                    Download CSV
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(popup);

    // --------------------------------------------------------
    // Position popup near the CSV modebar button
    // --------------------------------------------------------

    if (csvButton) {

        const buttonRect =
            csvButton.getBoundingClientRect();

        const popupContent =
            popup.querySelector(
                ".csv-modal-content"
            );

        const popupWidth =
            popupContent.offsetWidth;

        const popupHeight =
            popupContent.offsetHeight;

        const spacing = 8;

        let left =
            buttonRect.left;

        let top =
            buttonRect.bottom + spacing;

        // Keep popup inside the right edge
        if (
            left + popupWidth >
            window.innerWidth - 12
        ) {

            left =
                window.innerWidth -
                popupWidth -
                12;
        }

        // Keep popup inside the left edge
        if (left < 12) {
            left = 12;
        }

        // If there is not enough room below,
        // place it above the button.
        if (
            top + popupHeight >
            window.innerHeight - 12
        ) {

            top =
                buttonRect.top -
                popupHeight -
                spacing;
        }

        // Final top safety
        if (top < 12) {
            top = 12;
        }

        popupContent.style.left =
            `${left}px`;

        popupContent.style.top =
            `${top}px`;
    }

    // --------------------------------------------------------
    // Close popup
    // --------------------------------------------------------

    function closePopup() {
        popup.remove();
    }

    document
        .getElementById("csvCloseButton")
        .addEventListener(
            "click",
            closePopup
        );

    document
        .getElementById("csvCancelButton")
        .addEventListener(
            "click",
            closePopup
        );

    // --------------------------------------------------------
    // Download CSV
    // --------------------------------------------------------

    document
        .getElementById("csvConfirmButton")
        .addEventListener(
            "click",
            () => {

                const startDate =
                    document.getElementById(
                        "csvStartDate"
                    ).value;

                const endDate =
                    document.getElementById(
                        "csvEndDate"
                    ).value;

                const errorElement =
                    document.getElementById(
                        "csvDownloadError"
                    );

                errorElement.textContent = "";

                // --------------------------------------------
                // Validate dates
                // --------------------------------------------

                if (
                    !startDate ||
                    !endDate
                ) {

                    errorElement.textContent =
                        "Please select both dates.";

                    return;
                }

                if (startDate > endDate) {

                    errorElement.textContent =
                        "Start date cannot be later than end date.";

                    return;
                }

                if (
                    startDate < firstDate ||
                    endDate > lastDate
                ) {

                    errorElement.textContent =
                        `Available date range is ${firstDate} to ${lastDate}.`;

                    return;
                }

                // --------------------------------------------
                // Download selected range
                // --------------------------------------------

                const downloadUrl =
                    `/api/download-csv?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;

                window.location.href =
                    downloadUrl;

                closePopup();
            }
        );

    // --------------------------------------------------------
    // Close when clicking outside popup
    // --------------------------------------------------------

    popup.addEventListener(
        "click",
        event => {

            if (
                event.target === popup
            ) {

                closePopup();
            }
        }
    );
}


// ============================================================
// MAIN CHART
// ============================================================

function renderMainChart(
    days = "max"
) {

    let data =
        historyData;

    if (days !== "max") {

        data =
            historyData.slice(
                -Number(days)
            );

    }


    const trace = {

        x: data.map(
            item => item.Date
        ),

        y: data.map(
            item =>
                Number(
                    item.hydrogen_price
                )
        ),

        type: "scatter",

        mode: "lines",

        line: {
            width: 2
        },

        customdata:
            data.map(
                item => [
                    item.natural_gas_close,
                    item.hydrogen_price
                ]
            ),

        hovertemplate:
            "<b>%{x}</b><br>" +
            "Hydrogen: $%{y:.2f}/kg<br>" +
            "Natural Gas: $%{customdata[0]:.4f}/MMBtu" +
            "<extra></extra>"

    };


    const layout = {

        paper_bgcolor:
            "rgba(0,0,0,0)",

        plot_bgcolor:
            "rgba(0,0,0,0)",

        font: {
            color: "#edf4f4"
        },

        margin: {
            l: 55,
            r: 25,
            t: 20,
            b: 55
        },

        xaxis: {

            gridcolor:
                "rgba(255,255,255,0.06)",

            rangeslider: {
                visible: true
            }

        },

        yaxis: {

            title:
                "USD / kg H₂",

            gridcolor:
                "rgba(255,255,255,0.06)"

        },

        hovermode:
            "x unified"

    };


    Plotly.newPlot(
        "mainChart",
        [trace],
        layout,
        {
            responsive: true,
            displaylogo: false,

            modeBarButtonsToAdd: [
                {
                    name: "Download CSV",

                    icon: {
                        width: 24,
                        height: 24,
                        path: "M12 2C11.45 2 11 2.45 11 3V13.59L7.71 10.29C7.32 9.9 6.68 9.9 6.29 10.29C5.9 10.68 5.9 11.32 6.29 11.71L11.29 16.71C11.68 17.1 12.32 17.1 12.71 16.71L17.71 11.71C18.1 11.32 18.1 10.68 17.71 10.29C17.32 9.9 16.68 9.9 16.29 10.29L13 13.59V3C13 2.45 12.55 2 12 2ZM4 20C4 19.45 4.45 19 5 19H19C19.55 19 20 19.45 20 20C20 20.55 19.55 21 19 21H5C4.45 21 4 20.55 4 20Z"
                    },

                    click: function () {
                        openCsvDownloadModal();
                    }
                }
            ]
        }
    );

    // ------------------------------------------------------------
    // Move CSV button next to the screenshot button
    // ------------------------------------------------------------

    setTimeout(() => {

        const modebar =
            document.querySelector(
                "#mainChart .modebar"
            );

        if (!modebar) {
            return;
        }

        const csvButton =
            modebar.querySelector(
                '.modebar-btn[data-title="Download CSV"]'
            );

        const screenshotButton =
            modebar.querySelector(
                '.modebar-btn[data-title="Download plot as a png"]'
            );

        if (
            csvButton &&
            screenshotButton
        ) {

            screenshotButton.parentNode.insertBefore(
                csvButton,
                screenshotButton.nextSibling
            );
        }

    }, 100);


    document
        .getElementById("mainChart")
        .on(
            "plotly_click",
            function(event) {

                const point =
                    event.points[0];

                const clickedDate =
                    point.x;

                const index =
                    historyData.findIndex(
                        item =>
                            item.Date ===
                            clickedDate
                    );

                if (index !== -1) {

                    selectedIndex =
                        index;

                    updateSelectedObservation();

                }

            }
        );

}


// ============================================================
// MULTIPLIER SENSITIVITY
// ============================================================

function renderMultiplierSensitivity() {

    if (selectedGasPrice === null) {
        return;
    }


    const min =
        Number(
            document.getElementById(
                "multMin"
            ).value
        );


    const max =
        Number(
            document.getElementById(
                "multMax"
            ).value
        );


    const fixedCost =
        Number(
            document.getElementById(
                "fixedCostInput"
            ).value
        );


    const smr =
        Number(
            document.getElementById(
                "smrInput"
            ).value
        );


    const multipliers = [];

    const prices = [];


    for (
        let value = min;
        value <= max;
        value += 0.1
    ) {

        const rounded =
            Number(
                value.toFixed(2)
            );

        multipliers.push(
            rounded
        );

        prices.push(
            calculateHydrogenPrice(
                selectedGasPrice,
                smr,
                fixedCost,
                rounded
            )
        );

    }


    const trace = {

        x: multipliers,

        y: prices,

        type: "scatter",

        mode: "lines+markers"

    };


    const layout = {

        paper_bgcolor:
            "rgba(0,0,0,0)",

        plot_bgcolor:
            "rgba(0,0,0,0)",

        font: {
            color: "#edf4f4"
        },

        margin: {
            l: 45,
            r: 10,
            t: 10,
            b: 40
        },

        xaxis: {
            title: "Multiplier",
            gridcolor:
                "rgba(255,255,255,0.06)"
        },

        yaxis: {
            title: "USD/kg",
            gridcolor:
                "rgba(255,255,255,0.06)"
        }

    };


    Plotly.newPlot(
        "multiplierChart",
        [trace],
        layout,
        {
            responsive: true,
            displaylogo: false
        }
    );

}


// ============================================================
// FIXED COST SENSITIVITY
// ============================================================

function renderFixedCostSensitivity() {

    if (selectedGasPrice === null) {
        return;
    }


    const min =
        Number(
            document.getElementById(
                "fixedMin"
            ).value
        );


    const max =
        Number(
            document.getElementById(
                "fixedMax"
            ).value
        );


    const multiplier =
        Number(
            document.getElementById(
                "multiplierInput"
            ).value
        );


    const smr =
        Number(
            document.getElementById(
                "smrInput"
            ).value
        );


    const costs = [];

    const prices = [];


    for (
        let value = min;
        value <= max;
        value += 0.1
    ) {

        const rounded =
            Number(
                value.toFixed(2)
            );

        costs.push(
            rounded
        );

        prices.push(
            calculateHydrogenPrice(
                selectedGasPrice,
                smr,
                rounded,
                multiplier
            )
        );

    }


    const trace = {

        x: costs,

        y: prices,

        type: "scatter",

        mode: "lines+markers"

    };


    const layout = {

        paper_bgcolor:
            "rgba(0,0,0,0)",

        plot_bgcolor:
            "rgba(0,0,0,0)",

        font: {
            color: "#edf4f4"
        },

        margin: {
            l: 45,
            r: 10,
            t: 10,
            b: 40
        },

        xaxis: {
            title: "Fixed Cost",
            gridcolor:
                "rgba(255,255,255,0.06)"
        },

        yaxis: {
            title: "USD/kg",
            gridcolor:
                "rgba(255,255,255,0.06)"
        }

    };


    Plotly.newPlot(
        "fixedCostChart",
        [trace],
        layout,
        {
            responsive: true,
            displaylogo: false
        }
    );

}


// ============================================================
// STATISTICS
// ============================================================

function updateStatistics() {

    const prices =
        historyData.map(
            item =>
                Number(
                    item.hydrogen_price
                )
        );


    const sorted =
        [...prices].sort(
            (a, b) => a - b
        );


    const percentile =
        function(
            array,
            p
        ) {

            const index =
                (array.length - 1)
                * p;

            const lower =
                Math.floor(index);

            const upper =
                Math.ceil(index);

            if (
                lower === upper
            ) {
                return array[lower];
            }

            return (
                array[lower]
                +
                (
                    array[upper]
                    - array[lower]
                )
                *
                (
                    index - lower
                )
            );

        };


    document.getElementById(
        "statSelected"
    ).textContent =
        formatHydrogenPrice(
            selectedHydrogenPrice
        );


    document.getElementById(
        "statMin"
    ).textContent =
        formatHydrogenPrice(
            Math.min(...prices)
        );


    document.getElementById(
        "statMax"
    ).textContent =
        formatHydrogenPrice(
            Math.max(...prices)
        );


    document.getElementById(
        "statP025"
    ).textContent =
        formatHydrogenPrice(
            percentile(
                sorted,
                0.025
            )
        );


    document.getElementById(
        "statP975"
    ).textContent =
        formatHydrogenPrice(
            percentile(
                sorted,
                0.975
            )
        );

}


// ============================================================
// RANGE BUTTONS
// ============================================================

document
    .querySelectorAll(
        "[data-range]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            "[data-range]"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    renderMainChart(
                        button.dataset.range
                    );

                }
            );

        }
    );


// ============================================================
// MODEL CONTROL EVENTS
// ============================================================

[
    "multiplierInput",
    "fixedCostInput",
    "smrInput",
    "multMin",
    "multMax",
    "fixedMin",
    "fixedMax"
]
.forEach(
    id => {

        document
            .getElementById(id)
            .addEventListener(
                "input",
                () => {

                    // Update the active model state
                    modelState.multiplier =
                        Number(
                            document.getElementById(
                                "multiplierInput"
                            ).value
                        );

                    modelState.fixedCost =
                        Number(
                            document.getElementById(
                                "fixedCostInput"
                            ).value
                        );

                    modelState.smrEfficiency =
                        Number(
                            document.getElementById(
                                "smrInput"
                            ).value
                        );


                    // Recalculate everything using
                    // the current model parameters.

                    if (
                        selectedGasPrice !== null
                    ) {

                        selectedHydrogenPrice =
                            calculateHydrogenPrice(
                                selectedGasPrice,
                                modelState.smrEfficiency,
                                modelState.fixedCost,
                                modelState.multiplier
                            );


                        document.getElementById(
                            "currentPrice"
                        ).textContent =
                            formatHydrogenPrice(
                                selectedHydrogenPrice
                            );


                        document.getElementById(
                            "selectedHydrogen"
                        ).textContent =
                            formatHydrogenPrice(
                                selectedHydrogenPrice
                            );

                    }


                    renderMultiplierSensitivity();

                    renderFixedCostSensitivity();

                    updateStatistics();

                }
            );

    }
);


// ============================================================
// RESET MODEL PARAMETERS
// ============================================================

const resetModelButton =
    document.createElement("button");

resetModelButton.type = "button";
resetModelButton.textContent =
    "Reset Defaults";

resetModelButton.className =
    "reset-model-button";


const smrInput =
    document.getElementById("smrInput");

smrInput.insertAdjacentElement(
    "afterend",
    resetModelButton
);


resetModelButton.addEventListener(
    "click",
    () => {

        // Restore default values
        modelState.multiplier =
            DEFAULT_MODEL_VALUES.multiplier;

        modelState.fixedCost =
            DEFAULT_MODEL_VALUES.fixedCost;

        modelState.smrEfficiency =
            DEFAULT_MODEL_VALUES.smrEfficiency;


        // Update the visible input values
        document.getElementById(
            "multiplierInput"
        ).value =
            DEFAULT_MODEL_VALUES.multiplier;

        document.getElementById(
            "fixedCostInput"
        ).value =
            DEFAULT_MODEL_VALUES.fixedCost;

        document.getElementById(
            "smrInput"
        ).value =
            DEFAULT_MODEL_VALUES.smrEfficiency;


        // Recalculate selected observation
        if (
            selectedGasPrice !== null
        ) {

            selectedHydrogenPrice =
                calculateHydrogenPrice(
                    selectedGasPrice,
                    modelState.smrEfficiency,
                    modelState.fixedCost,
                    modelState.multiplier
                );


            document.getElementById(
                "currentPrice"
            ).textContent =
                formatHydrogenPrice(
                    selectedHydrogenPrice
                );


            document.getElementById(
                "selectedHydrogen"
            ).textContent =
                formatHydrogenPrice(
                    selectedHydrogenPrice
                );

        }


        renderMultiplierSensitivity();

        renderFixedCostSensitivity();

        updateStatistics();

    }
);


// ============================================================
// START APPLICATION
// ============================================================

loadHistory();
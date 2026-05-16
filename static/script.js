let allEvents = [];
let chartInstance = null;

function categoryToText(category) {
    const mapping = {
        earnings: "財報",
        concert: "活動",
        product: "企劃/商品",
        partnership: "合作",
        management: "公司治理",
        market: "市場事件",
        other: "其他"
    };
    return mapping[category] || "其他";
}

function impactToText(impact) {
    const mapping = {
        positive: "正向",
        negative: "負向",
        neutral: "中性"
    };
    return mapping[impact] || "中性";
}

function showEventCard(event) {
    const card = document.getElementById("eventCard");
    card.classList.remove("empty");

    card.innerHTML = `
        <h2>${event.title}</h2>
        <p><strong>日期：</strong>${event.date}</p>
        <p><strong>分類：</strong>${categoryToText(event.category)}</p>
        <p><strong>影響判斷：</strong>${impactToText(event.impact)}</p>
        <p><strong>摘要：</strong>${event.summary}</p>
        <p><strong>詳細說明：</strong>${event.description}</p>
        <p><strong>標籤：</strong>${event.tags.join(", ")}</p>
        <p><strong>來源：</strong><a href="${event.source_url}" target="_blank" rel="noopener noreferrer">${event.source_name}</a></p>
    `;
}

function renderTimeline(events) {
    const timeline = document.getElementById("timeline");
    timeline.innerHTML = "";

    events
        .slice()
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .forEach(event => {
            const item = document.createElement("div");
            item.className = "timeline-item";
            item.innerHTML = `
                <div class="timeline-date">${event.date}</div>
                <div class="timeline-content">
                    <h3>${event.title}</h3>
                    <p>${event.summary}</p>
                    <div class="timeline-actions">
                        <button type="button" class="show-event-card">檢視事件卡片</button>
                        <a class="timeline-link" href="${event.source_url}" target="_blank" rel="noopener noreferrer">查看詳情</a>
                    </div>
                </div>
            `;

            item.querySelector(".show-event-card").addEventListener("click", () => {
                showEventCard(event);
                window.scrollTo({ top: 0, behavior: "smooth" });
            });

            timeline.appendChild(item);
        });
}

function parseDateString(dateString) {
    return new Date(`${dateString}T00:00:00`);
}

function filterChartData(dates, prices, events, range) {
    if (range === "all") {
        return {
            labels: dates,
            prices,
            eventPoints: events
                .filter(event => dateToPriceMap[event.related_price_date] !== undefined)
                .map(event => ({
                    x: event.related_price_date,
                    y: dateToPriceMap[event.related_price_date],
                    eventData: event
                }))
        };
    }

    const endDate = parseDateString(dates[dates.length - 1]);
    const startDate = new Date(endDate);

    if (range === "30d") {
        startDate.setDate(endDate.getDate() - 30);
    } else if (range === "6m") {
        startDate.setMonth(endDate.getMonth() - 6);
    }

    const filteredLabels = [];
    const filteredPrices = [];

    for (let i = 0; i < dates.length; i++) {
        const currentDate = parseDateString(dates[i]);
        if (currentDate >= startDate && currentDate <= endDate) {
            filteredLabels.push(dates[i]);
            filteredPrices.push(prices[i]);
        }
    }

    return {
        labels: filteredLabels,
        prices: filteredPrices,
        eventPoints: events
            .filter(event => filteredLabels.includes(event.related_price_date))
            .map(event => ({
                x: event.related_price_date,
                y: dateToPriceMap[event.related_price_date],
                eventData: event
            }))
    };
}

function setActiveRangeButton(range) {
    document.querySelectorAll("#chartTabs button").forEach(button => {
        button.classList.toggle("active", button.dataset.range === range);
    });
}

let dateToPriceMap = {};
let fullDates = [];
let fullPrices = [];
let currentRange = "all";

function updateChartRange(range) {
    currentRange = range;
    const filtered = filterChartData(fullDates, fullPrices, allEvents, range);

    chartInstance.data.labels = filtered.labels;
    chartInstance.data.datasets[0].data = filtered.prices;
    chartInstance.data.datasets[1].data = filtered.eventPoints;
    chartInstance.options.plugins.tooltip.callbacks.label = function (context) {
        if (context.dataset.label === "新聞事件") {
            return context.raw.eventData.title;
        }
        return `股價: ${context.raw}`;
    };
    chartInstance.update();
    setActiveRangeButton(range);
}

fetch("/api/data")
    .then(response => response.json())
    .then(data => {
        if (!data.dates.length || !data.prices.length) {
            throw new Error("沒有抓到 2024～2026 的股價資料");
        }

        allEvents = data.events;
        fullDates = data.dates;
        fullPrices = data.prices;

        dateToPriceMap = {};
        for (let i = 0; i < data.dates.length; i++) {
            dateToPriceMap[data.dates[i]] = data.prices[i];
        }

        const ctx = document.getElementById("stockChart").getContext("2d");

        chartInstance = new Chart(ctx, {
            type: "line",
            data: {
                labels: data.dates,
                datasets: [
                    {
                        label: "ANYCOLOR 歷史股價（2024～2026）",
                        data: data.prices,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        tension: 0.2
                    },
                    {
                        label: "新聞事件",
                        data: [],
                        type: "scatter",
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: "nearest",
                    intersect: true
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label(context) {
                                if (context.dataset.label === "新聞事件") {
                                    return context.raw.eventData.title;
                                }
                                return `股價: ${context.raw}`;
                            }
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const element = elements[0];
                        const clickedDataset = chartInstance.data.datasets[element.datasetIndex];

                        if (clickedDataset.label === "新聞事件") {
                            const eventData = clickedDataset.data[element.index].eventData;
                            showEventCard(eventData);
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: "日期"
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: "股價"
                        }
                    }
                }
            }
        });

        document.querySelectorAll("#chartTabs button").forEach(button => {
            button.addEventListener("click", () => updateChartRange(button.dataset.range));
        });

        updateChartRange(currentRange);
        renderTimeline(allEvents);
    })
    .catch(error => {
        console.error("資料載入失敗:", error);
        const card = document.getElementById("eventCard");
        card.classList.remove("empty");
        card.innerHTML = `
            <h2>資料載入失敗</h2>
            <p>目前無法載入 2024～2026 的 ANYCOLOR 歷史股價。請確認網路可連線到 Yahoo Finance，並重新整理頁面。</p>
            <p><strong>錯誤：</strong>${error.message}</p>
        `;
    });

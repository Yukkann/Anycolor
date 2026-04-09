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
                    <button data-id="${event.id}">查看詳情</button>
                </div>
            `;

            item.querySelector("button").addEventListener("click", () => {
                showEventCard(event);
                window.scrollTo({ top: 0, behavior: "smooth" });
            });

            timeline.appendChild(item);
        });
}

fetch("/api/data")
    .then(response => response.json())
    .then(data => {
        allEvents = data.events;

        const dateToPrice = {};
        for (let i = 0; i < data.dates.length; i++) {
            dateToPrice[data.dates[i]] = data.prices[i];
        }

        const eventPoints = allEvents
            .filter(event => dateToPrice[event.related_price_date] !== undefined)
            .map(event => ({
                x: event.related_price_date,
                y: dateToPrice[event.related_price_date],
                eventData: event
            }));

        const ctx = document.getElementById("stockChart").getContext("2d");

        chartInstance = new Chart(ctx, {
            type: "line",
            data: {
                labels: data.dates,
                datasets: [
                    {
                        label: "ANYCOLOR 股價",
                        data: data.prices,
                        borderWidth: 2,
                        tension: 0.2
                    },
                    {
                        label: "新聞事件",
                        data: eventPoints,
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

        renderTimeline(allEvents);
    })
    .catch(error => {
        console.error("資料載入失敗:", error);
    });

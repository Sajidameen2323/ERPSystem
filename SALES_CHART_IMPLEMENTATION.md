# Sales Chart Data Implementation

## Overview
The `GetSalesChartData` method in `DashboardController` has been implemented to provide comprehensive sales chart data for dashboard visualization.

## Implementation Details

### Data Sources
The implementation uses two primary data sources:
1. **Sales Orders** - For tracking order volume and sales potential
2. **Invoices** - For tracking actual revenue (paid amounts)

### Features

#### Time-Based Grouping
Supports multiple time grouping options:
- **Day**: Daily aggregation (default)
- **Week**: Weekly aggregation starting from week beginning
- **Month**: Monthly aggregation 
- **Year**: Yearly aggregation

#### Chart Datasets
Provides three datasets for comprehensive sales visualization:

1. **Sales Orders Total**
   - Shows total value of all sales orders in each period
   - Color: Blue (`rgba(54, 162, 235, ...)`)
   - Represents sales potential/pipeline

2. **Revenue (Paid)**
   - Shows actual revenue from paid invoices
   - Color: Teal (`rgba(75, 192, 192, ...)`)
   - Represents actual cash flow

3. **Order Count**
   - Shows number of orders placed in each period
   - Color: Yellow (`rgba(255, 206, 86, ...)`)
   - Represents sales activity/volume

### API Endpoint
```
GET /api/dashboard/sales-chart
```

#### Query Parameters
- `fromDate` (optional): Start date for data range (default: 30 days ago)
- `toDate` (optional): End date for data range (default: today)
- `groupBy` (optional): Time grouping ("day", "week", "month", "year", default: "day")

#### Response Format
```json
{
  "isSuccess": true,
  "data": {
    "labels": ["Jan 01", "Jan 02", "Jan 03", ...],
    "datasets": [
      {
        "label": "Sales Orders Total",
        "data": [1000.00, 1500.00, 800.00, ...],
        "backgroundColor": "rgba(54, 162, 235, 0.5)",
        "borderColor": "rgba(54, 162, 235, 1)",
        "borderWidth": 2,
        "fill": false,
        "tension": 0.1
      },
      // ... additional datasets
    ]
  }
}
```

### Helper Methods

#### `GenerateTimePeriods(fromDate, toDate, groupBy)`
Generates time period boundaries based on the grouping parameter:
- Handles different time intervals (day, week, month, year)
- Ensures periods start at logical boundaries (e.g., start of week, month)

#### `FormatPeriodLabel(period, groupBy)`
Formats period labels for chart display:
- Day: "Jan 01"
- Week: "Week of Jan 01"
- Month: "Jan 2024"
- Year: "2024"

#### `IsDateInPeriod(date, period, groupBy)`
Determines if a specific date falls within a given period:
- Accounts for different time groupings
- Handles boundary conditions correctly

### Data Processing

#### Sales Orders
- Filters by `OrderDate` within the specified range
- Aggregates `TotalAmount` for each time period
- Counts number of orders per period

#### Invoices
- Filters by `InvoiceDate` within the specified range
- Excludes cancelled invoices
- Uses `PaidAmount` for actual revenue calculation (not total invoice amount)

### Error Handling
- Comprehensive try-catch blocks
- Detailed logging for debugging
- Graceful fallback for missing data
- Parameter validation for `groupBy`

### Performance Considerations
- Uses pagination parameters to get all relevant records
- Efficient LINQ queries for data aggregation
- Minimal database round trips

## Frontend Integration
This endpoint is designed to work with Chart.js or similar charting libraries in the Angular frontend, providing properly formatted data for line charts, bar charts, or combo charts.

## Usage Examples

### Daily Sales Data (Last 30 Days)
```
GET /api/dashboard/sales-chart
```

### Weekly Sales Data (Last 3 Months)
```
GET /api/dashboard/sales-chart?fromDate=2024-11-01&toDate=2024-12-31&groupBy=week
```

### Monthly Sales Data (Current Year)
```
GET /api/dashboard/sales-chart?fromDate=2024-01-01&toDate=2024-12-31&groupBy=month
```

## Future Enhancements
- Add customer segmentation datasets
- Include profit margin calculations
- Add forecasting/trend analysis
- Support for multiple currency handling
- Add drill-down capabilities for specific periods

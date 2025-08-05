# Sales Chart Integration Testing Guide

## Overview
This guide provides comprehensive testing instructions for the sales chart integration between the Angular frontend and ASP.NET Core backend.

## Backend Testing

### 1. Start the Backend Server
```powershell
cd "c:\Users\Sajid Ameen\Desktop\Atera\Practice\Angular\ERPSystem\ERPSystem.Server"
dotnet run
```

### 2. Test the Sales Chart API Endpoint

#### Basic Test (Default Parameters)
```http
GET https://localhost:7154/api/dashboard/sales-chart
```

#### Test with Date Range
```http
GET https://localhost:7154/api/dashboard/sales-chart?fromDate=2024-01-01&toDate=2024-12-31&groupBy=month
```

#### Test Different Grouping Options
```http
# Daily grouping (last 30 days)
GET https://localhost:7154/api/dashboard/sales-chart?groupBy=day

# Weekly grouping (last 8 weeks)  
GET https://localhost:7154/api/dashboard/sales-chart?fromDate=2024-11-01&toDate=2024-12-31&groupBy=week

# Monthly grouping (current year)
GET https://localhost:7154/api/dashboard/sales-chart?fromDate=2024-01-01&toDate=2024-12-31&groupBy=month

# Yearly grouping (last 3 years)
GET https://localhost:7154/api/dashboard/sales-chart?fromDate=2022-01-01&toDate=2024-12-31&groupBy=year
```

### 3. Expected Response Format
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
      {
        "label": "Revenue (Paid)",
        "data": [800.00, 1200.00, 600.00, ...],
        "backgroundColor": "rgba(75, 192, 192, 0.5)",
        "borderColor": "rgba(75, 192, 192, 1)",
        "borderWidth": 2,
        "fill": false,
        "tension": 0.1
      },
      {
        "label": "Order Count",
        "data": [5, 8, 3, ...],
        "backgroundColor": "rgba(255, 206, 86, 0.5)",
        "borderColor": "rgba(255, 206, 86, 1)",
        "borderWidth": 2,
        "fill": false,
        "tension": 0.1
      }
    ]
  },
  "message": null
}
```

## Frontend Testing

### 1. Start the Frontend Application
The frontend should start automatically when the backend runs, or manually:
```powershell
cd "c:\Users\Sajid Ameen\Desktop\Atera\Practice\Angular\ERPSystem\erpsystem.client"
npm run build
```

### 2. Test Sales Chart Component

#### Access Dashboard
1. Navigate to the dashboard in your browser
2. Look for the sales chart section
3. Verify that the chart loads (either with real data or sample data)

#### Test Chart Interactions
1. **Chart Type Toggle**: Test switching between line, bar, and area charts
2. **Timeframe Selection**: Test daily, weekly, monthly, yearly views
3. **Dark Mode**: Toggle dark mode to test chart theme adaptation
4. **Responsive Design**: Test on different screen sizes

### 3. Browser Console Testing
Open browser developer tools and check console for:

#### Success Messages
```javascript
// Check for successful data loading
"Loading sales chart data with X data points"
```

#### Error Messages
```javascript
// Check for error handling
"Error loading sales chart data: [error details]"
"No chart data available, using sample data"
```

#### Network Tab Verification
1. Open Network tab in browser dev tools
2. Filter by "dashboard/sales-chart"
3. Verify API calls are made with correct parameters
4. Check response data structure

## Integration Testing Scenarios

### Scenario 1: Empty Database
**Expected Behavior**: 
- Chart displays sample data
- Component shows "No chart data available, using sample data" in console
- All chart interactions work normally

### Scenario 2: Database with Sales Orders Only
**Expected Behavior**:
- "Sales Orders Total" and "Order Count" datasets have data
- "Revenue (Paid)" dataset shows zeros (no paid invoices)
- Chart displays properly with multiple datasets

### Scenario 3: Database with Sales Orders and Invoices
**Expected Behavior**:
- All three datasets have meaningful data
- Revenue data reflects actual paid amounts from invoices
- Order count matches sales order records

### Scenario 4: Different Time Ranges
**Test Steps**:
1. Select "Daily" timeframe → Should show day-by-day data
2. Select "Weekly" timeframe → Should show week-by-week aggregation
3. Select "Monthly" timeframe → Should show month-by-month aggregation
4. Select "Yearly" timeframe → Should show year-by-year aggregation

## Troubleshooting

### Common Issues

#### 1. Chart Not Loading
**Symptoms**: Empty chart area or loading indicator
**Solutions**:
- Check browser console for JavaScript errors
- Verify API endpoint is accessible
- Check network tab for failed requests
- Ensure Chart.js is properly loaded

#### 2. Sample Data Always Showing
**Symptoms**: Chart shows demo data instead of real data
**Solutions**:
- Verify database has sales orders and invoices
- Check API response in network tab
- Verify date ranges include actual data
- Check server logs for errors

#### 3. Incorrect Data Aggregation
**Symptoms**: Data doesn't match expected values
**Solutions**:
- Verify date range parameters
- Check groupBy parameter mapping
- Review server logs for calculation errors
- Test API endpoint directly

#### 4. Chart Type/Timeframe Not Updating
**Symptoms**: Chart doesn't change when options are selected
**Solutions**:
- Check Angular change detection
- Verify options binding in template
- Check component lifecycle methods
- Review console for binding errors

## Database Setup for Testing

### Create Test Data

#### Sales Orders
```sql
-- Create some sample sales orders
INSERT INTO SalesOrders (Id, CustomerId, OrderDate, Status, TotalAmount, OrderedByUserId, ReferenceNumber)
VALUES 
  (NEWID(), [existing-customer-id], '2024-12-01', 2, 1500.00, 'user123', 'SO-001'),
  (NEWID(), [existing-customer-id], '2024-12-02', 2, 2300.00, 'user123', 'SO-002'),
  -- Add more orders as needed
```

#### Invoices
```sql
-- Create invoices for sales orders
INSERT INTO Invoices (Id, InvoiceNumber, SalesOrderId, CustomerId, Status, InvoiceDate, DueDate, TotalAmount, PaidAmount)
VALUES
  (NEWID(), 'INV-001', [sales-order-id], [customer-id], 3, '2024-12-01', '2024-12-31', 1500.00, 1500.00),
  (NEWID(), 'INV-002', [sales-order-id], [customer-id], 3, '2024-12-02', '2024-12-31', 2300.00, 1150.00),
  -- Add more invoices as needed
```

## Performance Testing

### Load Testing
1. Create large datasets (1000+ sales orders, invoices)
2. Test different time ranges (1 year, 2 years)
3. Monitor response times and memory usage
4. Verify chart renders smoothly with large datasets

### Frontend Performance
1. Check Chart.js rendering performance
2. Monitor memory usage during chart updates
3. Test rapid timeframe/type changes
4. Verify cleanup on component destroy

## Success Criteria

### Backend API
- ✅ Returns proper JSON structure
- ✅ Handles all groupBy parameters correctly
- ✅ Processes date ranges properly
- ✅ Returns meaningful data or appropriate fallbacks
- ✅ Handles errors gracefully

### Frontend Component
- ✅ Displays chart with real or sample data
- ✅ Responds to option changes (type, timeframe)
- ✅ Handles dark mode properly
- ✅ Shows appropriate loading states
- ✅ Handles errors gracefully

### Integration
- ✅ Data flows correctly from backend to frontend
- ✅ Date ranges and groupBy parameters work end-to-end
- ✅ Chart updates when timeframe changes
- ✅ No console errors or network failures

# ERP Integration Workflow - Quick Guide

## Core Flow

```
Inventory → Supply Chain → Stock Management
```

## 1. Stock Monitoring
```
Product.CurrentStock ≤ Product.MinimumStock
    ↓
System Alert: "Reorder Required"
    ↓
Show Preferred Suppliers
    ↓
Create Purchase Order
```

## 2. Purchase Order Flow
```
Draft → Approved → Ordered → Received → Closed
```

**Key Transitions:**
- **Draft**: Editable, can modify items/quantities
- **Approved**: Locked, ready to send to supplier
- **Ordered**: Sent to supplier, awaiting delivery
- **Received**: Stock updated, inventory increased
- **Closed**: Process complete

## 3. Stock Updates
```
PO Item Received → Stock Movement (+) → Inventory Updated
```

**Automatic Actions:**
- Creates `StockMovement` record (type: StockIn)
- Updates `Product.CurrentStock`
- Calculates new inventory value
- Updates supplier performance metrics

## 4. Data Relationships

```
Product ←→ ProductSupplier ←→ Supplier
   ↓              ↓
StockMovement  PurchaseOrder
   ↓              ↓
Audit Trail    PO Items
```

## 5. Key Business Rules

### Inventory
- Stock cannot go negative
- All movements require reason codes
- Adjustments need approval
- Complete audit trail maintained

### Supply Chain
- Each product can have multiple suppliers
- One preferred supplier per product
- Lead times tracked for planning
- Performance ratings auto-calculated

### Integration Points
- Low stock triggers PO suggestions
- Receiving updates inventory automatically
- Cost tracking throughout the process
- Supplier performance affects future selection

## 6. Soft Delete Protection

All business data is protected:
- Products, Suppliers, Purchase Orders
- Stock Movements, Adjustments
- Product-Supplier relationships
- Complete audit trail preserved

## 7. Implementation Phases

### Phase 1 (Current)
- ✅ Basic inventory management
- ✅ Purchase order processing
- ✅ Supplier management
- ✅ Stock movement tracking

### Phase 2 (Next)
- Automatic reorder alerts
- Supplier performance dashboards
- Cost analysis reports
- Mobile scanning for receiving

### Phase 3 (Future)
- Demand forecasting
- EDI supplier integration
- Multi-location inventory
- Advanced analytics

## Quick Reference

**Monitor Stock**: Check `Product.CurrentStock` vs `Product.MinimumStock`

**Create PO**: Use `ProductSupplier` with `IsPreferredSupplier = true`

**Receive Stock**: Update `PurchaseOrderItem.ReceivedQuantity` → Auto-creates `StockMovement`

**Track History**: All changes logged with user context and timestamps

**Performance**: Query `Supplier.PerformanceRating` for vendor selection

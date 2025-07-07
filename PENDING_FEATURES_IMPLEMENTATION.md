# Pending Features Implementation Guide
## MicroBiz Hub ERP System

### Overview
This document outlines the implementation strategy for the remaining core modules of the MicroBiz Hub ERP system. The User Management & Authentication module has been completed using Okta authentication, so this guide focuses on the two remaining core modules:

1. **Inventory Management Module**
2. **Sales Order & Basic Invoicing Module**

---

## Module 1: Inventory Management

### 1.1 Functional Requirements Summary
- Product creation with required fields (Name, SKU, Unit Price, Cost Price, Current Stock)
- Product listing with search, sorting, and low stock highlighting
- Product details viewing and updating
- Product deletion (logical delete)
- Stock adjustment functionality with tracking

### 1.2 Backend Implementation (ASP.NET Core 8)

#### 1.2.1 Data Models

**Product Entity:**
```csharp
public class Product
{
    public Guid Id { get; set; }
    public string Name { get; set; } // Required, max 255 chars
    public string SKU { get; set; } // Required, unique, max 50 chars
    public string? Description { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal CostPrice { get; set; }
    public int CurrentStock { get; set; } = 0;
    public int? MinimumStock { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public virtual ICollection<StockAdjustment> StockAdjustments { get; set; }
    public virtual ICollection<OrderItem> OrderItems { get; set; }
}
```

**StockAdjustment Entity:**
```csharp
public class StockAdjustment
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public int AdjustmentQuantity { get; set; } // Positive for add, negative for deduct
    public string Reason { get; set; } // Required, max 255 chars
    public string AdjustedByUserId { get; set; } // Okta user ID
    public DateTime AdjustedAt { get; set; }
    
    // Navigation properties
    public virtual Product Product { get; set; }
}
```

#### 1.2.2 DTOs

**ProductDto:**
```csharp
public class ProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string SKU { get; set; }
    public string? Description { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal CostPrice { get; set; }
    public int CurrentStock { get; set; }
    public int? MinimumStock { get; set; }
    public bool IsLowStock { get; set; } // Computed property
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

**ProductCreateDto:**
```csharp
public class ProductCreateDto
{
    [Required, MaxLength(255)]
    public string Name { get; set; }
    
    [Required, MaxLength(50)]
    public string SKU { get; set; }
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    [Required, Range(0.01, double.MaxValue)]
    public decimal UnitPrice { get; set; }
    
    [Required, Range(0, double.MaxValue)]
    public decimal CostPrice { get; set; }
    
    [Required, Range(0, int.MaxValue)]
    public int CurrentStock { get; set; }
    
    [Range(0, int.MaxValue)]
    public int? MinimumStock { get; set; }
}
```

**StockAdjustmentDto:**
```csharp
public class StockAdjustmentDto
{
    [Required]
    public Guid ProductId { get; set; }
    
    [Required, Range(-int.MaxValue, int.MaxValue)]
    public int AdjustmentQuantity { get; set; }
    
    [Required, MaxLength(255)]
    public string Reason { get; set; }
}
```

#### 1.2.3 Services

**IProductService Interface:**
```csharp
public interface IProductService
{
    Task<PagedResult<ProductDto>> GetProductsAsync(int page, int pageSize, string? searchTerm = null, string? sortBy = null);
    Task<Result<ProductDto>> GetProductByIdAsync(Guid id);
    Task<Result<ProductDto>> CreateProductAsync(ProductCreateDto createDto);
    Task<Result<ProductDto>> UpdateProductAsync(Guid id, ProductUpdateDto updateDto);
    Task<Result> DeleteProductAsync(Guid id);
    Task<Result> AdjustStockAsync(Guid productId, StockAdjustmentDto adjustmentDto, string userId);
    Task<Result<bool>> IsSkuUniqueAsync(string sku, Guid? excludeProductId = null);
}
```

#### 1.2.4 API Controllers

**ProductsController:**
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize] // Okta authentication required
public class ProductsController : ControllerBase
{
    // GET /api/products
    [HttpGet]
    [Authorize(Roles = "Admin,InventoryUser")]
    public async Task<ActionResult<PagedResult<ProductDto>>> GetProducts([FromQuery] ProductQueryParameters parameters)
    
    // GET /api/products/{id}
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,InventoryUser")]
    public async Task<ActionResult<ProductDto>> GetProduct(Guid id)
    
    // POST /api/products
    [HttpPost]
    [Authorize(Roles = "Admin,InventoryUser")]
    public async Task<ActionResult<ProductDto>> CreateProduct(ProductCreateDto createDto)
    
    // PUT /api/products/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,InventoryUser")]
    public async Task<ActionResult<ProductDto>> UpdateProduct(Guid id, ProductUpdateDto updateDto)
    
    // DELETE /api/products/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,InventoryUser")]
    public async Task<ActionResult> DeleteProduct(Guid id)
    
    // POST /api/products/{id}/adjust-stock
    [HttpPost("{id}/adjust-stock")]
    [Authorize(Roles = "Admin,InventoryUser")]
    public async Task<ActionResult> AdjustStock(Guid id, StockAdjustmentDto adjustmentDto)
}
```

### 1.3 Frontend Implementation (Angular 18)

#### 1.3.1 Angular CLI Commands to Execute
```bash
ng generate service shared/services/product
ng generate component inventory/product-list
ng generate component inventory/product-form
ng generate component inventory/product-detail
ng generate component inventory/stock-adjustment-modal
ng generate interface shared/models/product
ng generate interface shared/models/stock-adjustment
```

#### 1.3.2 TypeScript Interfaces

**product.interface.ts:**
```typescript
export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  unitPrice: number;
  costPrice: number;
  currentStock: number;
  minimumStock?: number;
  isLowStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCreate {
  name: string;
  sku: string;
  description?: string;
  unitPrice: number;
  costPrice: number;
  currentStock: number;
  minimumStock?: number;
}

export interface ProductUpdate extends Partial<ProductCreate> {}

export interface ProductQueryParameters {
  page: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
```

#### 1.3.3 Product Service

**product.service.ts:**
```typescript
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getProducts(params: ProductQueryParameters): Observable<PagedResult<Product>> {
    const httpParams = new HttpParams({ fromObject: params as any });
    return this.http.get<PagedResult<Product>>(this.apiUrl, { params: httpParams });
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  createProduct(product: ProductCreate): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  updateProduct(id: string, product: ProductUpdate): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  adjustStock(productId: string, adjustment: StockAdjustment): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${productId}/adjust-stock`, adjustment);
  }
}
```

#### 1.3.4 Key Components Structure

**Product List Component Features:**
- Responsive table with Tailwind CSS styling
- Search functionality with debounce
- Sorting by columns
- Low stock highlighting
- Action buttons (Edit, Delete, Adjust Stock)
- Pagination
- Lucide icons for actions

**Product Form Component Features:**
- Reactive forms with validation
- SKU uniqueness validation
- Number input formatting
- Form submission handling
- Error display

---

## Module 2: Sales Order & Basic Invoicing

### 2.1 Functional Requirements Summary
- Customer management (CRUD operations)
- Sales order creation with multiple line items
- Stock validation and automatic deduction
- Order status management
- Basic invoice generation (view-only)

### 2.2 Backend Implementation (ASP.NET Core 8)

#### 2.2.1 Data Models

**Customer Entity:**
```csharp
public class Customer
{
    public Guid Id { get; set; }
    public string Name { get; set; } // Required, max 255 chars
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public virtual ICollection<SalesOrder> SalesOrders { get; set; }
}
```

**SalesOrder Entity:**
```csharp
public class SalesOrder
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public DateTime OrderDate { get; set; }
    public SalesOrderStatus Status { get; set; } = SalesOrderStatus.New;
    public decimal TotalAmount { get; set; }
    public string OrderedByUserId { get; set; } // Okta user ID
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public virtual Customer Customer { get; set; }
    public virtual ICollection<OrderItem> OrderItems { get; set; }
}

public enum SalesOrderStatus
{
    New,
    Processing,
    Completed,
    Cancelled
}
```

**OrderItem Entity:**
```csharp
public class OrderItem
{
    public Guid Id { get; set; }
    public Guid SalesOrderId { get; set; }
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPriceAtTimeOfOrder { get; set; }
    public decimal LineTotal { get; set; }
    
    // Navigation properties
    public virtual SalesOrder SalesOrder { get; set; }
    public virtual Product Product { get; set; }
}
```

#### 2.2.2 API Controllers

**CustomersController:**
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize] // Okta authentication required
public class CustomersController : ControllerBase
{
    // GET /api/customers
    [HttpGet]
    [Authorize(Roles = "Admin,SalesUser")]
    public async Task<ActionResult<PagedResult<CustomerDto>>> GetCustomers([FromQuery] CustomerQueryParameters parameters)
    
    // Additional CRUD endpoints...
}
```

**SalesOrdersController:**
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize] // Okta authentication required
public class SalesOrdersController : ControllerBase
{
    // GET /api/salesorders
    [HttpGet]
    [Authorize(Roles = "Admin,SalesUser")]
    public async Task<ActionResult<PagedResult<SalesOrderDto>>> GetSalesOrders([FromQuery] SalesOrderQueryParameters parameters)
    
    // POST /api/salesorders
    [HttpPost]
    [Authorize(Roles = "Admin,SalesUser")]
    public async Task<ActionResult<SalesOrderDto>> CreateSalesOrder(SalesOrderCreateDto createDto)
    
    // PUT /api/salesorders/{id}/status
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin,SalesUser")]
    public async Task<ActionResult> UpdateOrderStatus(Guid id, SalesOrderStatusUpdateDto statusUpdate)
    
    // GET /api/salesorders/{id}/invoice
    [HttpGet("{id}/invoice")]
    [Authorize(Roles = "Admin,SalesUser")]
    public async Task<ActionResult<InvoiceDto>> GetInvoice(Guid id)
}
```

### 2.3 Frontend Implementation (Angular 18)

#### 2.3.1 Angular CLI Commands to Execute
```bash
ng generate service shared/services/customer
ng generate service shared/services/sales-order
ng generate component sales/customer-list
ng generate component sales/customer-form
ng generate component sales/sales-order-list
ng generate component sales/sales-order-form
ng generate component sales/sales-order-detail
ng generate component sales/invoice-view
ng generate interface shared/models/customer
ng generate interface shared/models/sales-order
ng generate interface shared/models/order-item
```

#### 2.3.2 Key Features Implementation

**Sales Order Form Features:**
- Customer selection dropdown
- Dynamic product line items with add/remove functionality
- Real-time stock validation
- Automatic total calculation
- Quantity input validation
- Product search/filter in dropdown

**Invoice View Features:**
- Professional invoice layout
- Customer and order details
- Itemized product list
- Total calculations
- Print-friendly styling

---

## Implementation Priority & Timeline

### Phase 1: Inventory Management (Week 1-2)
1. Backend entities and database migration
2. Product service and controller implementation
3. Frontend product interfaces and service
4. Product list and form components
5. Stock adjustment functionality

### Phase 2: Sales Order & Basic Invoicing (Week 3-4)
1. Customer and sales order backend implementation
2. Complex sales order creation logic with stock validation
3. Frontend customer management
4. Sales order form with dynamic line items
5. Invoice view component

### Phase 3: Integration & Testing (Week 5)
1. End-to-end testing
2. Role-based access control validation
3. UI/UX refinements
4. Performance optimization

---

## Technical Considerations

### Database Migration Strategy
- Use Entity Framework Core migrations
- Ensure proper foreign key relationships
- Add appropriate indexes for performance

### Error Handling
- Implement global error handling middleware
- Use Result pattern for service layer responses
- Provide user-friendly error messages in frontend

### Security
- Leverage existing Okta authentication
- Implement role-based authorization on all endpoints
- Validate all user inputs

### UI/UX Guidelines
- Use Tailwind CSS for consistent styling
- Implement responsive design
- Use Lucide icons consistently
- Follow Angular 18 best practices with standalone components
- Implement loading states and error handling

This implementation guide provides a comprehensive roadmap for completing the remaining core modules of the MicroBiz Hub ERP system while building upon the existing Okta authentication foundation.

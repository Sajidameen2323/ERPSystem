using AutoMapper;
using ERPSystem.Server.DTOs.SupplyChain;
using ERPSystem.Server.Models;
using Microsoft.OpenApi.Extensions;

namespace ERPSystem.Server.Mappings;

public class SupplyChainProfile : Profile
{
    public SupplyChainProfile()
    {
        // Supplier mappings
        CreateMap<Supplier, SupplierDto>();
        CreateMap<SupplierCreateDto, Supplier>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
            .ForMember(dest => dest.IsDeleted, opt => opt.MapFrom(src => false))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));
        
        CreateMap<SupplierUpdateDto, Supplier>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

        // ProductSupplier mappings
        CreateMap<ProductSupplier, ProductSupplierDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product.Name))
            .ForMember(dest => dest.SupplierName, opt => opt.MapFrom(src => src.Supplier.Name));
        
        CreateMap<ProductSupplierCreateDto, ProductSupplier>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));
        
        CreateMap<ProductSupplierUpdateDto, ProductSupplier>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.ProductId, opt => opt.Ignore())
            .ForMember(dest => dest.SupplierId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

        // PurchaseOrder mappings
        CreateMap<PurchaseOrder, PurchaseOrderDto>()
            .ForMember(dest => dest.SupplierName, opt => opt.MapFrom(src => src.Supplier.Name))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.GetDisplayName()))
            .ForMember(dest => dest.Supplier, opt => opt.MapFrom(src => src.Supplier));
        
        CreateMap<PurchaseOrderCreateDto, PurchaseOrder>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.PONumber, opt => opt.Ignore()) // Will be generated
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => PurchaseOrderStatus.Draft))
            .ForMember(dest => dest.OrderDate, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.TotalAmount, opt => opt.Ignore()) // Will be calculated
            .ForMember(dest => dest.CreatedByUserId, opt => opt.Ignore()) // Will be set from user context
            .ForMember(dest => dest.IsDeleted, opt => opt.MapFrom(src => false))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.Items, opt => opt.Ignore()); // Will be mapped separately
        
        CreateMap<PurchaseOrderUpdateDto, PurchaseOrder>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.PONumber, opt => opt.Ignore())
            .ForMember(dest => dest.SupplierId, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.Ignore())
            .ForMember(dest => dest.OrderDate, opt => opt.Ignore())
            .ForMember(dest => dest.TotalAmount, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedByUserId, opt => opt.Ignore())
            .ForMember(dest => dest.ApprovedByUserId, opt => opt.Ignore())
            .ForMember(dest => dest.ApprovedAt, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.Items, opt => opt.Ignore());

        // PurchaseOrderItem mappings
        CreateMap<PurchaseOrderItem, PurchaseOrderItemDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product.Name))
            .ForMember(dest => dest.ProductSKU, opt => opt.MapFrom(src => src.Product.SKU));
        
        CreateMap<PurchaseOrderItemCreateDto, PurchaseOrderItem>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.PurchaseOrderId, opt => opt.Ignore())
            .ForMember(dest => dest.ReceivedQuantity, opt => opt.MapFrom(src => 0));
        
        CreateMap<PurchaseOrderItemUpdateDto, PurchaseOrderItem>()
            .ForMember(dest => dest.Id, opt => opt.Ignore()) // Will be set in service
            .ForMember(dest => dest.PurchaseOrderId, opt => opt.Ignore()) // Will be set in service
            .ForMember(dest => dest.ReceivedQuantity, opt => opt.MapFrom(src => 0))
            .ForMember(dest => dest.ReceivedDate, opt => opt.Ignore());

        // StockMovement mappings
        CreateMap<StockMovement, StockMovementDto>()
            .ForMember(dest => dest.MovementType, opt => opt.MapFrom(src => src.MovementType.GetDisplayName()))
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product.Name))
            .ForMember(dest => dest.ProductSKU, opt => opt.MapFrom(src => src.Product.SKU))
            .ForMember(dest => dest.IsIncrease, opt => opt.MapFrom(src => 
                src.MovementType == StockMovementType.StockIn || 
                src.MovementType == StockMovementType.Return ||
                (src.MovementType == StockMovementType.Adjustment && src.Quantity > 0)));
        
        CreateMap<StockMovementCreateDto, StockMovement>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.StockBeforeMovement, opt => opt.Ignore()) // Will be set by service
            .ForMember(dest => dest.StockAfterMovement, opt => opt.Ignore()) // Will be calculated by service
            .ForMember(dest => dest.MovedByUserId, opt => opt.Ignore()) // Will be set from user context
            .ForMember(dest => dest.MovementDate, opt => opt.MapFrom(src => DateTime.UtcNow));
    }
}

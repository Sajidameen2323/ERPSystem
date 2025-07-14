using AutoMapper;
using ERPSystem.Server.Models;
using ERPSystem.Server.DTOs.Inventory;

namespace ERPSystem.Server.Mappings;

public class InventoryProfile : Profile
{
    public InventoryProfile()
    {
        // Product Mappings
        CreateMap<Product, ProductDto>()
            .ForMember(dest => dest.IsLowStock, opt => opt.MapFrom(src => 
                src.MinimumStock.HasValue && src.CurrentStock <= src.MinimumStock.Value));

        CreateMap<ProductCreateDto, Product>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.MapFrom(src => false))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.StockAdjustments, opt => opt.Ignore());

        CreateMap<ProductUpdateDto, Product>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.SKU, opt => opt.Ignore()) // SKU cannot be updated
            .ForMember(dest => dest.CurrentStock, opt => opt.Ignore()) // Stock updated via adjustments
            .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.StockAdjustments, opt => opt.Ignore())
            .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

        // StockAdjustment Mappings
        CreateMap<StockAdjustmentDto, StockAdjustment>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.AdjustedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.AdjustedByUserId, opt => opt.Ignore()) // Set in service
            .ForMember(dest => dest.Product, opt => opt.Ignore());

        CreateMap<StockAdjustment, StockAdjustmentResponseDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product.Name))
            .ForMember(dest => dest.ProductSKU, opt => opt.MapFrom(src => src.Product.SKU));
    }
}

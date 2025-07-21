using AutoMapper;
using ERPSystem.Server.DTOs.Returns;
using ERPSystem.Server.Models;
using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Server.Mappings;

public class ReturnsProfile : Profile
{
    public ReturnsProfile()
    {
        CreateMap<PurchaseOrderReturn, PurchaseOrderReturnDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => GetDisplayName(src.Status)))
            .ForMember(dest => dest.PurchaseOrderNumber, opt => opt.MapFrom(src => src.PurchaseOrder.PONumber))
            .ForMember(dest => dest.SupplierName, opt => opt.MapFrom(src => src.Supplier.Name));

        CreateMap<PurchaseOrderReturnItem, PurchaseOrderReturnItemDto>()
            .ForMember(dest => dest.Reason, opt => opt.MapFrom(src => GetDisplayName(src.Reason)))
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product.Name))
            .ForMember(dest => dest.ProductSKU, opt => opt.MapFrom(src => src.Product.SKU));

        CreateMap<CreatePurchaseOrderReturnRequestDto, PurchaseOrderReturn>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.ReturnNumber, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => ReturnStatus.Pending))
            .ForMember(dest => dest.ReturnDate, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.TotalReturnAmount, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

        CreateMap<CreatePurchaseOrderReturnItemDto, PurchaseOrderReturnItem>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.PurchaseOrderReturnId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));
    }

    private static string GetDisplayName<T>(T enumValue) where T : Enum
    {
        var field = enumValue.GetType().GetField(enumValue.ToString());
        var attribute = field?.GetCustomAttributes(typeof(DisplayAttribute), false)
                              .Cast<DisplayAttribute>()
                              .FirstOrDefault();

        return attribute?.Name ?? enumValue.ToString();
    }
}

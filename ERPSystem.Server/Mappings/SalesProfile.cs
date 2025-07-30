using AutoMapper;
using ERPSystem.Server.DTOs.Sales;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Mappings;

public class SalesProfile : Profile
{
    public SalesProfile()
    {
        // Customer mappings
        CreateMap<Customer, CustomerDto>();
        CreateMap<CustomerCreateDto, Customer>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.SalesOrders, opt => opt.Ignore());

        CreateMap<CustomerUpdateDto, Customer>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.SalesOrders, opt => opt.Ignore());

        // Sales Order mappings
        CreateMap<SalesOrder, SalesOrderDto>()
            .ForMember(dest => dest.CustomerName, opt => opt.MapFrom(src => src.Customer.Name))
            .ForMember(dest => dest.OrderItems, opt => opt.MapFrom(src => src.SalesOrderItems.Where(soi => !soi.IsDeleted)))
            .ForMember(dest => dest.Invoice, opt => opt.MapFrom(src => src.Invoice));

        CreateMap<SalesOrderCreateDto, SalesOrder>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.TotalAmount, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.Ignore())
            .ForMember(dest => dest.OrderDate, opt => opt.Ignore())
            .ForMember(dest => dest.ShippedDate, opt => opt.Ignore())
            .ForMember(dest => dest.DeliveredDate, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Customer, opt => opt.Ignore())
            .ForMember(dest => dest.SalesOrderItems, opt => opt.Ignore());

        // Sales Order Item mappings
        CreateMap<SalesOrderItem, SalesOrderItemDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product.Name))
            .ForMember(dest => dest.ProductSku, opt => opt.MapFrom(src => src.Product.SKU));

        CreateMap<SalesOrderItemCreateDto, SalesOrderItem>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.SalesOrderId, opt => opt.Ignore())
            .ForMember(dest => dest.UnitPriceAtTimeOfOrder, opt => opt.MapFrom(src => src.UnitPrice))
            .ForMember(dest => dest.LineTotal, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.SalesOrder, opt => opt.Ignore())
            .ForMember(dest => dest.Product, opt => opt.Ignore());

        CreateMap<SalesOrderItemUpdateDto, SalesOrderItem>()
            .ForMember(dest => dest.SalesOrderId, opt => opt.Ignore())
            .ForMember(dest => dest.UnitPriceAtTimeOfOrder, opt => opt.MapFrom(src => src.UnitPrice))
            .ForMember(dest => dest.LineTotal, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.SalesOrder, opt => opt.Ignore())
            .ForMember(dest => dest.Product, opt => opt.Ignore());

        // Sales Order Invoice mapping (simplified invoice info for sales order view)
        CreateMap<Invoice, SalesOrderInvoiceDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => (int)src.Status))
            .ForMember(dest => dest.StatusLabel, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.IsOverdue, opt => opt.MapFrom(src => src.Status == InvoiceStatus.Overdue || (src.DueDate < DateTime.UtcNow && src.Status == InvoiceStatus.Sent)));

        // Invoice mappings
        CreateMap<Invoice, InvoiceDto>()
            .ForMember(dest => dest.CustomerName, opt => opt.MapFrom(src => src.Customer.Name))
            .ForMember(dest => dest.CustomerEmail, opt => opt.MapFrom(src => src.Customer.Email))
            .ForMember(dest => dest.SalesOrderReferenceNumber, opt => opt.MapFrom(src => src.SalesOrder.ReferenceNumber))
            .ForMember(dest => dest.InvoiceItems, opt => opt.MapFrom(src => src.InvoiceItems.Where(ii => !ii.IsDeleted)));

        CreateMap<InvoiceCreateDto, Invoice>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.InvoiceNumber, opt => opt.Ignore())
            .ForMember(dest => dest.CustomerId, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.Ignore())
            .ForMember(dest => dest.InvoiceDate, opt => opt.Ignore())
            .ForMember(dest => dest.SubTotal, opt => opt.Ignore())
            .ForMember(dest => dest.TotalAmount, opt => opt.Ignore())
            .ForMember(dest => dest.PaidAmount, opt => opt.Ignore())
            .ForMember(dest => dest.BalanceAmount, opt => opt.Ignore())
            .ForMember(dest => dest.PaidDate, opt => opt.Ignore())
            .ForMember(dest => dest.GeneratedByUserId, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.SalesOrder, opt => opt.Ignore())
            .ForMember(dest => dest.Customer, opt => opt.Ignore())
            .ForMember(dest => dest.InvoiceItems, opt => opt.Ignore());

        // Invoice Item mappings
        CreateMap<InvoiceItem, InvoiceItemDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product.Name))
            .ForMember(dest => dest.ProductSKU, opt => opt.MapFrom(src => src.Product.SKU));

        CreateMap<InvoiceItemCreateDto, InvoiceItem>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.InvoiceId, opt => opt.Ignore())
            .ForMember(dest => dest.LineTotal, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Invoice, opt => opt.Ignore())
            .ForMember(dest => dest.Product, opt => opt.Ignore());
    }
}
